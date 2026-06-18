import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { AiInterviewService, InterviewContext } from './ai-interview.service';
import { randomUUID } from 'crypto';

// ============================================================
// T-012: WebSocket 面试网关 — 实时 AI 模拟面试
// 消息协议:
//   C→S: user_answer    { interviewId, content }
//   S→C: ai_message_chunk { messageId, chunk }
//   S→C: ai_message_done  { messageId, fullContent, feedback, isFollowUp, nextAction, score }
//   S→C: error            { code, message }
// ============================================================

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/ws/interview',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class InterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(InterviewGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private aiInterviewService: AiInterviewService,
  ) {}

  /* ══════════════════════════════════════════════
     连接 / 断开
     ══════════════════════════════════════════════ */

  async handleConnection(client: Socket) {
    try {
      // 从查询参数或 auth 对象获取 token
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.auth?.token as string);

      if (!token) {
        client.emit('error', { code: 401, message: '未提供认证令牌' });
        client.disconnect();
        return;
      }

      // 验证 JWT — secret 由 JwtModule 全局配置提供
      const payload = this.jwtService.verify(token);

      (client as AuthenticatedSocket).userId = payload.sub;
      (client as AuthenticatedSocket).userEmail = payload.email;

      this.logger.log(
        `✅ WebSocket 客户端已连接: ${client.id} (用户: ${payload.sub})`,
      );
    } catch (err) {
      this.logger.warn(
        `❌ WebSocket 认证失败: ${client.id} — ${(err as Error).message}`,
      );
      client.emit('error', { code: 401, message: '令牌无效或已过期' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 WebSocket 客户端已断开: ${client.id}`);
  }

  /* ══════════════════════════════════════════════
     用户提交回答
     ══════════════════════════════════════════════ */

  @SubscribeMessage('user_answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; content: string },
  ) {
    const authClient = client as AuthenticatedSocket;
    const messageId = randomUUID();

    // 1. 验证用户身份
    if (!authClient.userId) {
      client.emit('error', { code: 401, message: '未认证' });
      return;
    }

    // 2. 校验参数
    if (!data.interviewId || !data.content?.trim()) {
      client.emit('error', {
        code: 400,
        message: '缺少 interviewId 或 content',
      });
      return;
    }

    try {
      // 3. 查询面试记录并校验归属
      const interview = await this.prisma.interview.findFirst({
        where: { id: data.interviewId, userId: authClient.userId },
      });

      if (!interview) {
        throw new NotFoundException('面试记录不存在');
      }

      if (interview.status === 'completed') {
        throw new BadRequestException('面试已结束');
      }

      // 4. 保存用户回答
      await this.prisma.interviewMessage.create({
        data: {
          interviewId: data.interviewId,
          role: 'user',
          content: data.content.trim(),
        },
      });

      // 5. 获取完整对话历史
      const messages = await this.prisma.interviewMessage.findMany({
        where: { interviewId: data.interviewId },
        orderBy: { createdAt: 'asc' },
      });

      // 6. 获取简历上下文
      let resumeContext: string | undefined;
      if (interview.resumeId) {
        const resume = await this.prisma.resume.findUnique({
          where: { id: interview.resumeId },
        });
        if (resume?.parsedData) {
          resumeContext = JSON.stringify(resume.parsedData);
        }
      }

      // 7. 构建面试上下文
      const context: InterviewContext = {
        position: interview.targetPosition,
        difficulty: interview.difficulty,
        resumeContext,
      };

      // 8. 调用 AI 评估
      this.logger.log(`🤖 AI 评估中 — 面试: ${data.interviewId}`);
      const evaluation = await this.aiInterviewService.evaluateAndContinue(
        context,
        data.content.trim(),
        messages.map((m) => ({
          role: m.role,
          content: m.content,
          questionType: m.questionType || undefined,
        })),
      );

      // 9. 保存 AI 回复到数据库
      let aiContent = evaluation.feedback;
      if (evaluation.isFollowUp && evaluation.followUpContent) {
        aiContent += `\n\n追问：${evaluation.followUpContent}`;
      } else if (evaluation.nextQuestion) {
        aiContent += `\n\n${evaluation.nextQuestion}`;
      }

      await this.prisma.interviewMessage.create({
        data: {
          interviewId: data.interviewId,
          role: 'assistant',
          content: aiContent,
          questionType: evaluation.nextQuestionType || null,
        },
      });

      // 10. 更新面试状态
      const updateData: any = { questionCount: { increment: 1 } };
      if (evaluation.nextAction === 'complete') {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
        updateData.score = evaluation.score;
        updateData.feedback = evaluation.feedback;
      }
      await this.prisma.interview.update({
        where: { id: data.interviewId },
        data: updateData,
      });

      // 11. 模拟流式输出，发送小块（按句子分割模拟流式效果）
      const sentences = aiContent.split(/(?<=[。！？.!?])/);
      for (const sentence of sentences) {
        if (sentence.trim()) {
          client.emit('ai_message_chunk', {
            messageId,
            chunk: sentence.trim(),
          });
          // 小延迟模拟流式效果
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      // 12. 发送完成事件
      client.emit('ai_message_done', {
        messageId,
        fullContent: aiContent,
        feedback: evaluation.feedback,
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        isFollowUp: evaluation.isFollowUp,
        nextAction: evaluation.nextAction,
        followUpContent: evaluation.followUpContent || null,
        nextQuestion: evaluation.nextQuestion || null,
      });

      this.logger.log(
        `✅ WebSocket 回答处理完成 — 面试: ${data.interviewId}, 动作: ${evaluation.nextAction}`,
      );
    } catch (err) {
      this.logger.error(`❌ WebSocket 回答处理失败: ${(err as Error).message}`);
      client.emit('error', {
        code:
          err instanceof NotFoundException
            ? 404
            : err instanceof BadRequestException
              ? 400
              : 500,
        message: (err as Error).message,
      });
    }
  }
}
