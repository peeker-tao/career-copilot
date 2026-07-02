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

/**
 * 岗位名合理性检查：如果岗位名中不含常见职位关键词，则回退到通用值
 */
const COMMON_POSITION_KEYWORDS = [
  '工程', '开发', '设计', '运维', '测试', '产品', '运营', '市场',
  '销售', '人力', '行政', '财务', '法务', '算法', '数据', '前端',
  '后端', '全栈', '架构', '安全', '网络', '嵌入式', '游戏',
  'AI', 'ML', 'iOS', 'Android', '移动端', '系统', '技术',
  '经理', '总监', '专员', '实习生', '助理', '分析师',
  'node', 'java', 'python', 'go', 'rust', 'react', 'vue', 'angular',
];

function isValidPosition(position: string): boolean {
  const pos = position.trim().toLowerCase();
  // 至少 2 个字符
  if (pos.length < 2) return false;
  // 包含常见职位关键词 => 合理
  if (COMMON_POSITION_KEYWORDS.some((kw) => pos.includes(kw))) return true;
  // 包含常见中文字（不全是乱码）
  const chineseChars = (pos.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (chineseChars >= 2) return true;
  // 纯英文且长度>=3 可能是英文职位名（如 "engineer"）
  if (/^[a-zA-Z\s]+$/.test(pos) && pos.length >= 3) return true;
  return false;
}

function normalizePosition(position: string): string {
  if (isValidPosition(position)) return position;
  return '软件开发工程师';
}

export interface FirstQuestionResult {
  content: string;
  questionType: string;
  referenceAnswer?: string;
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
  nextQuestionReferenceAnswer?: string;
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
    const safePosition = normalizePosition(context.position);
    if (safePosition !== context.position) {
      this.logger.warn(`岗位名 "${context.position}" 不合理，已回退为 "${safePosition}"`);
    }

    const systemPrompt = buildInterviewSystemPrompt({
      position: safePosition,
      difficulty: context.difficulty,
      resumeContext: context.resumeContext,
    });

    const userPrompt = `请为「${safePosition}」岗位生成第一道面试题。`;

    const result = await this.aiService.callLLM(systemPrompt, userPrompt, 0.3, 'interview:question');

    // 标准化 referenceAnswer: 如果 LLM 返回数组则合并为字符串
    const rawAnswer = result.referenceAnswer;
    const referenceAnswer = Array.isArray(rawAnswer)
      ? rawAnswer.join('\n')
      : typeof rawAnswer === 'string'
        ? rawAnswer
        : undefined;

    return {
      content:
        (result.content as string) ||
        (result.question as string) ||
        '请介绍一下你的项目经验',
      questionType: (result.questionType as string) || 'technical',
      referenceAnswer,
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
    const safePosition = normalizePosition(context.position);

    const systemPrompt = buildInterviewSystemPrompt({
      position: safePosition,
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

    const result = await this.aiService.callLLM(systemPrompt, userPrompt, 0.3, 'interview:evaluate');

    // 容错归一化 nextAction（大小写 / 下划线 / 连字符变体）
    const normalized = normalizeNextAction(result.nextAction as string);

    const rawRef = result.nextQuestionReferenceAnswer;
    const nextQuestionReferenceAnswer = Array.isArray(rawRef)
      ? rawRef.join('\n')
      : typeof rawRef === 'string' && rawRef.length > 0
        ? rawRef
        : undefined;

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
      nextQuestionReferenceAnswer,
      summary: result.summary as string | undefined,
    };
  }
}
