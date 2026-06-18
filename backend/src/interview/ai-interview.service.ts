// ============================================================
// AI 面试引擎核心
// T-011: 管理面试对话流 — 出题 → 评估 → 追问/下一题/结束
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { buildInterviewSystemPrompt } from '../ai/prompts/interview.system';
import { normalizeNextAction } from './interview.utils';

export interface InterviewContext {
  position: string;
  difficulty: string;
  resumeContext?: string;
}

export interface FirstQuestionResult {
  content: string;
  questionType: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  isFollowUp: boolean;
  nextAction: 'followUp' | 'nextQuestion' | 'complete';
  followUpContent?: string;
  nextQuestion?: string;
  nextQuestionType?: string;
  summary?: string;
}

export interface HistoryMessage {
  role: string;
  content: string;
  questionType?: string;
}

@Injectable()
export class AiInterviewService {
  private readonly logger = new Logger(AiInterviewService.name);

  constructor(private aiService: AiService) {}

  /**
   * 生成面试的第一道题
   */
  async generateFirstQuestion(
    context: InterviewContext,
  ): Promise<FirstQuestionResult> {
    const systemPrompt = buildInterviewSystemPrompt({
      position: context.position,
      difficulty: context.difficulty,
      resumeContext: context.resumeContext,
    });

    const userPrompt = `请为「${context.position}」岗位生成第一道面试题。`;

    const result = await this.aiService.callLLM(systemPrompt, userPrompt);

    return {
      content:
        (result.content as string) ||
        (result.question as string) ||
        '请介绍一下你的项目经验',
      questionType: (result.questionType as string) || 'technical',
    };
  }

  /**
   * 评估用户回答，决定下一步动作
   * @param history 历史消息（system 已内置，传 user/assistant 对话即可）
   */
  async evaluateAndContinue(
    context: InterviewContext,
    userAnswer: string,
    history: HistoryMessage[],
  ): Promise<EvaluationResult> {
    const systemPrompt = buildInterviewSystemPrompt({
      position: context.position,
      difficulty: context.difficulty,
      resumeContext: context.resumeContext,
      answeredCount: history.filter((m) => m.role === 'user').length,
    });

    // 构建对话上下文
    const dialogue = history
      .map((m) => {
        const prefix = m.role === 'assistant' ? '面试官' : '应聘者';
        const typeInfo = m.questionType ? `（${m.questionType}）` : '';
        return `${prefix}${typeInfo}：${m.content}`;
      })
      .join('\n\n');

    const userPrompt = `以下是本次面试的对话记录：\n\n${dialogue}\n\n---\n\n应聘者的最新回答：\n${userAnswer}\n\n请评估这个回答，并决定下一步动作（追问 / 下一题 / 结束面试）。`;

    const result = await this.aiService.callLLM(systemPrompt, userPrompt);

    // 容错归一化 nextAction（大小写 / 下划线 / 连字符变体）
    const normalized = normalizeNextAction(result.nextAction as string);

    return {
      score: typeof result.score === 'number' ? result.score : 70,
      feedback: (result.feedback as string) || '回答已记录',
      strengths: (result.strengths as string[]) || [],
      weaknesses: (result.weaknesses as string[]) || [],
      isFollowUp: result.isFollowUp === true,
      nextAction: normalized as 'followUp' | 'nextQuestion' | 'complete',
      followUpContent: result.followUpContent as string | undefined,
      nextQuestion: result.nextQuestion as string | undefined,
      nextQuestionType: result.nextQuestionType as string | undefined,
      summary: result.summary as string | undefined,
    };
  }
}
