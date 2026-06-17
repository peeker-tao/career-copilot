import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  buildFeedbackSystemPrompt,
  buildFeedbackUserPrompt,
  FeedbackPromptParams,
  FeedbackReport,
} from '../ai/prompts/interview.feedback';

// ============================================================
// T-013: 面试报告生成服务
// 根据面试对话记录生成多维度综合评价报告
// ============================================================

@Injectable()
export class InterviewReportService {
  private readonly logger = new Logger(InterviewReportService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * 生成面试报告
   * @param interviewId 面试记录 ID
   * @param userId 用户 ID（用于校验归属）
   * @returns 结构化报告，已持久化到数据库
   */
  async generateReport(
    interviewId: string,
    userId: string,
  ): Promise<FeedbackReport> {
    // 1. 获取面试记录（含归属校验）
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, userId },
    });

    if (!interview) {
      throw new Error('面试记录不存在');
    }

    // 2. 有缓存则直接返回
    if (interview.overallFeedback) {
      this.logger.log(`📋 返回缓存的面试报告: ${interviewId}`);
      return interview.overallFeedback as unknown as FeedbackReport;
    }

    // 3. 获取对话消息（排除 system 角色）
    const messages = await this.prisma.interviewMessage.findMany({
      where: { interviewId, role: { not: 'system' } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length < 2) {
      throw new Error('对话记录不足，无法生成报告');
    }

    // 4. 提取问答对
    const qaPairs: FeedbackPromptParams['qaPairs'] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'assistant' && messages[i + 1].role === 'user') {
        qaPairs.push({
          question: messages[i].content,
          answer: messages[i + 1].content,
          questionType: messages[i].questionType || undefined,
        });
      }
    }

    if (qaPairs.length === 0) {
      throw new Error('未找到有效的问答对，无法生成报告');
    }

    // 5. 构建 Prompt 参数
    const promptParams: FeedbackPromptParams = {
      position: interview.targetPosition,
      difficulty: interview.difficulty,
      questionCount: qaPairs.length,
      qaPairs,
    };

    // 6. 调用 AI 生成报告
    this.logger.log(`🤖 生成面试报告: ${interviewId} (${qaPairs.length} 道题)`);
    const systemPrompt = buildFeedbackSystemPrompt();
    const userPrompt = buildFeedbackUserPrompt(promptParams);

    let report: Record<string, unknown>;
    try {
      report = await this.aiService.callLLM(systemPrompt, userPrompt);
    } catch (err) {
      this.logger.error(`AI 报告生成失败: ${(err as Error).message}`);
      throw new Error('报告生成失败，请稍后重试');
    }

    // 7. 补全默认值
    const fullReport: FeedbackReport = {
      overallScore: (report.overallScore as number) || 70,
      overallRating:
        (report.overallRating as FeedbackReport['overallRating']) || 'C',
      summary: (report.summary as string) || '报告生成完成',
      questionScores:
        (report.questionScores as FeedbackReport['questionScores']) || [],
      dimensions: (report.dimensions as FeedbackReport['dimensions']) || [],
      strengths: (report.strengths as string[]) || [],
      weaknesses: (report.weaknesses as string[]) || [],
      learningSuggestions:
        (report.learningSuggestions as FeedbackReport['learningSuggestions']) ||
        [],
    };

    // 8. 持久化到数据库
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        overallFeedback: JSON.parse(JSON.stringify(fullReport)),
        score: fullReport.overallScore,
      },
    });

    this.logger.log(
      `✅ 面试报告已保存: ${interviewId} (评分: ${fullReport.overallScore})`,
    );
    return fullReport;
  }
}
