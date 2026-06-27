import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';
import { SaveTranscriptDto } from './dto/save-transcript.dto';

@Injectable()
export class VoiceInterviewService {
  private readonly logger = new Logger(VoiceInterviewService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * 创建语音面试会话
   */
  async createSession(userId: string, dto: CreateVoiceSessionDto) {
    const session = await this.prisma.voiceInterviewSession.create({
      data: {
        userId,
        targetPosition: dto.targetPosition,
        difficulty: dto.difficulty || 'medium',
        resumeId: dto.resumeId || null,
        status: 'recording',
      },
    });

    return session;
  }

  /**
   * 获取用户的语音面试会话列表
   */
  async getSessions(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.voiceInterviewSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.voiceInterviewSession.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * 获取语音面试详情
   */
  async getSession(id: string, userId: string) {
    const session = await this.prisma.voiceInterviewSession.findFirst({
      where: { id, userId },
    });
    if (!session) {
      throw new NotFoundException('语音面试会话不存在');
    }
    return session;
  }

  /**
   * 暂停/恢复语音面试
   */
  async togglePause(id: string, userId: string) {
    const session = await this.getSession(id, userId);

    const newStatus = session.status === 'recording' ? 'paused' : 'recording';
    const updated = await this.prisma.voiceInterviewSession.update({
      where: { id },
      data: { status: newStatus },
    });

    return updated;
  }

  /**
   * 保存语音面试转录内容
   */
  async saveTranscript(id: string, userId: string, dto: SaveTranscriptDto) {
    const session = await this.getSession(id, userId);

    if (session.status === 'completed') {
      throw new BadRequestException('该语音面试已结束');
    }

    const updated = await this.prisma.voiceInterviewSession.update({
      where: { id },
      data: {
        transcript: dto.transcript as any,
        durationSeconds: dto.durationSeconds,
      },
    });

    return updated;
  }

  /**
   * 结束语音面试，AI 生成面试摘要和反馈
   */
  async completeSession(id: string, userId: string) {
    const session = await this.getSession(id, userId);

    if (session.status === 'completed') {
      throw new BadRequestException('该语音面试已结束');
    }

    // 标记完成
    const updated = await this.prisma.voiceInterviewSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // 如果有转录内容，异步生成面试摘要（通过队列）
    if (session.transcript) {
      try {
        await this.generateTranscriptSummary(session);
      } catch (err) {
        this.logger.warn(`语音面试摘要生成失败: ${(err as Error).message}`);
      }
    }

    return updated;
  }

  /**
   * 删除语音面试会话
   */
  async removeSession(id: string, userId: string) {
    const session = await this.getSession(id, userId);
    await this.prisma.voiceInterviewSession.delete({ where: { id } });
    return { message: '删除成功' };
  }

  /**
   * AI 生成语音面试转录摘要
   */
  private async generateTranscriptSummary(session: any) {
    const transcript = session.transcript as Array<{
      timestamp: number;
      speaker: string;
      text: string;
    }>;

    if (!transcript || transcript.length === 0) return;

    const transcriptText = transcript
      .map((t) => `[${t.speaker}] ${t.text}`)
      .join('\n');

    const systemPrompt = `你是一个面试评估专家。请根据语音面试的转录内容，生成一份精简的面试摘要。以严格的 JSON 格式返回。`;

    const userPrompt = `岗位: ${session.targetPosition}
难度: ${session.difficulty}

转录内容:
${transcriptText}

请生成:
1. overallScore: 综合评分 (0-100)
2. summary: 面试摘要 (100-200字)
3. strengths: 亮点 (2-3条)
4. weaknesses: 待改进 (2-3条)
5. suggestedFollowUp: 建议的后续文字面试方向

以 JSON 格式返回。`;

    try {
      const summary = await this.aiService.callLLM(systemPrompt, userPrompt);
      await this.prisma.voiceInterviewSession.update({
        where: { id: session.id },
        data: { transcript: summary as any },
      });
      this.logger.log(`✅ 语音面试摘要已生成: ${session.id}`);
    } catch (err) {
      this.logger.error(`语音面试摘要生成失败: ${(err as Error).message}`);
    }
  }

  /**
   * 获取 AI 根据转录生成的面试摘要
   */
  async getSessionSummary(id: string, userId: string) {
    const session = await this.getSession(id, userId);

    if (session.status !== 'completed') {
      throw new BadRequestException('语音面试尚未结束');
    }

    return session.transcript;
  }
}
