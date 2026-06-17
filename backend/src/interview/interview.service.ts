import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiInterviewService, InterviewContext } from './ai-interview.service';
import { InterviewReportService } from './interview-report.service';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private prisma: PrismaService,
    private aiInterviewService: AiInterviewService,
    private aiService: AiService,
    private interviewReportService: InterviewReportService,
  ) {}

  async create(
    userId: string,
    data: { targetPosition: string; difficulty?: string; resumeId?: string },
  ) {
    // 0. 如果传了 resumeId，先验证简历存在且属于当前用户
    if (data.resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: data.resumeId, userId },
      });
      if (!resume) {
        throw new BadRequestException(
          `简历不存在或不属于当前用户: ${data.resumeId}`,
        );
      }
    }

    // 1. 创建面试记录
    const interview = await this.prisma.interview.create({
      data: {
        userId,
        targetPosition: data.targetPosition,
        difficulty: data.difficulty || 'medium',
        resumeId: data.resumeId || null,
      },
    });

    // 2. 如果有简历，获取简历解析内容作为上下文
    let resumeContext: string | undefined;
    if (data.resumeId) {
      const resume = await this.prisma.resume.findUnique({
        where: { id: data.resumeId },
      });
      if (resume?.parsedData) {
        resumeContext = JSON.stringify(resume.parsedData);
      }
    }

    // 3. 用 AI 生成第一道面试题
    try {
      const context: InterviewContext = {
        position: data.targetPosition,
        difficulty: data.difficulty || 'medium',
        resumeContext,
      };

      const firstQuestion =
        await this.aiInterviewService.generateFirstQuestion(context);

      // 4. 保存面试官的第一道题
      await this.prisma.interviewMessage.create({
        data: {
          interviewId: interview.id,
          role: 'assistant',
          content: firstQuestion.content,
          questionType: firstQuestion.questionType,
        },
      });

      // 5. 更新题目计数
      await this.prisma.interview.update({
        where: { id: interview.id },
        data: { questionCount: 1 },
      });

      return {
        ...interview,
        questionCount: 1,
        firstQuestion: {
          content: firstQuestion.content,
          questionType: firstQuestion.questionType,
        },
      };
    } catch (err) {
      this.logger.error(`生成首题失败: ${(err as Error).message}`);
      // AI 失败时仍然返回面试记录，让用户稍后重试
      return interview;
    }
  }

  async findAll(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          targetPosition: true,
          difficulty: true,
          status: true,
          score: true,
          questionCount: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      this.prisma.interview.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }

    return interview;
  }

  async getMessages(id: string, userId: string) {
    const interview = await this.findOne(id, userId);
    return interview.messages;
  }

  async submitAnswer(id: string, userId: string, content: string) {
    const interview = await this.findOne(id, userId);

    if (interview.status === 'completed') {
      throw new BadRequestException('面试已结束');
    }

    // 1. 保存用户回答
    await this.prisma.interviewMessage.create({
      data: {
        interviewId: id,
        role: 'user',
        content,
      },
    });

    // 2. 构建面试上下文（从已有消息中获取）
    const messages = await this.prisma.interviewMessage.findMany({
      where: { interviewId: id },
      orderBy: { createdAt: 'asc' },
    });

    // 3. 获取简历上下文
    let resumeContext: string | undefined;
    if (interview.resumeId) {
      const resume = await this.prisma.resume.findUnique({
        where: { id: interview.resumeId },
      });
      if (resume?.parsedData) {
        resumeContext = JSON.stringify(resume.parsedData);
      }
    }

    const context: InterviewContext = {
      position: interview.targetPosition,
      difficulty: interview.difficulty,
      resumeContext,
    };

    // 4. 调用 AI 评估回答
    let evaluation;
    try {
      evaluation = await this.aiInterviewService.evaluateAndContinue(
        context,
        content,
        messages.map((m) => ({
          role: m.role,
          content: m.content,
          questionType: m.questionType || undefined,
        })),
      );
    } catch (err) {
      this.logger.error(`AI 评估失败: ${(err as Error).message}`);
      return {
        message: '回答已记录，AI 评估暂时不可用',
        evaluation: null,
      };
    }

    // 5. 根据 nextAction 处理后续（容错：大小写不敏感 + 常见变体）
    const normalizeAction = (a: string): string => {
      const v = (a || '').toLowerCase().replace(/[_-]/g, '');
      if (v === 'followup') return 'followUp';
      if (v === 'nextquestion') return 'nextQuestion';
      if (v === 'complete') return 'complete';
      return 'nextQuestion'; // 默认进入下一题
    };
    const action = normalizeAction(evaluation.nextAction || '');

    let nextQuestion: { content: string; questionType: string } | undefined;
    let isComplete = false;

    if (action === 'followUp' && evaluation.followUpContent) {
      // 追问：保存面试官的追问
      await this.prisma.interviewMessage.create({
        data: {
          interviewId: id,
          role: 'assistant',
          content: evaluation.followUpContent,
          questionType: 'technical',
        },
      });
      nextQuestion = {
        content: evaluation.followUpContent,
        questionType: 'technical',
      };
      // 追问不增加 questionCount
    } else if (action === 'nextQuestion') {
      // 下一题：AI 可能没返回 nextQuestion，兜底用通用题目
      const qContent =
        evaluation.nextQuestion ||
        `请继续介绍你在 ${interview.targetPosition} 方面的其他项目或实践经验。`;
      const qType = evaluation.nextQuestionType || 'technical';

      await this.prisma.interviewMessage.create({
        data: {
          interviewId: id,
          role: 'assistant',
          content: qContent,
          questionType: qType,
        },
      });
      nextQuestion = { content: qContent, questionType: qType };
      await this.prisma.interview.update({
        where: { id },
        data: { questionCount: { increment: 1 } },
      });
    } else if (action === 'complete') {
      // 结束面试
      isComplete = true;
      await this.prisma.interview.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          score: evaluation.score,
        },
      });
    }

    return {
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      },
      nextQuestion,
      isComplete,
      summary: evaluation.summary,
    };
  }

  async generateFeedback(id: string, userId: string) {
    const interview = await this.findOne(id, userId);

    if (interview.status !== 'completed') {
      throw new BadRequestException('面试未完成，无法生成报告');
    }

    try {
      return await this.interviewReportService.generateReport(id, userId);
    } catch (err) {
      this.logger.error(`生成报告失败: ${(err as Error).message}`);
      throw new BadRequestException(
        (err as Error).message || '报告生成失败，请稍后重试',
      );
    }
  }

  async complete(id: string, userId: string) {
    const interview = await this.findOne(id, userId);

    return this.prisma.interview.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }
}
