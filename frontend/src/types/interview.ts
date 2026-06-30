/** 面试难度 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 面试状态 */
export type InterviewStatus = 'in_progress' | 'completed' | 'interrupted' | 'pending'

/** 消息角色 */
export type MessageRole = 'ai' | 'user' | 'assistant'

/** 消息类型 */
export type MessageType = 'text' | 'voice'

/** 面试会话 */
export interface Interview {
  id: string
  targetPosition: string
  difficulty: Difficulty
  status: InterviewStatus
  score?: number | null
  rounds: number
  duration: string
  startedAt: string
  completedAt?: string
  questionCount?: number
  totalRounds?: number
  currentRound?: number
}

/** 消息发送状态 */
export type MessageStatus = 'sending' | 'sent' | 'failed'

/** 面试消息 */
export interface InterviewMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  rating?: number | null
  questionType?: string
  /** 消息类型：text=文本，voice=语音 */
  type?: MessageType
  /** 语音消息的音频 URL（用于播放） */
  audioUrl?: string
  /** 发送状态：sending=发送中，sent=成功，failed=失败 */
  status?: MessageStatus
  /** AI 评价文本（评价+对话+答案模式） */
  feedback?: string
  /** 参考答案 */
  referenceAnswer?: string[]
}

/** 创建面试请求 */
export interface CreateInterviewRequest {
  targetPosition: string
  difficulty: Difficulty
  /** 关联简历 ID（可选） */
  resumeId?: string
}

/** 面试反馈报告 */
export interface InterviewReport {
  overallRating: string
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  skillScores: Array<{ name: string; score: number, comment: string, suggestions: string }>
  summary: string
}

/** 提交回答的结果 */
export interface SubmitAnswerResult {
  evaluation: {
    score: number
    feedback: string
    strengths: string[]
    weaknesses: string[]
  }
  nextQuestion?: {
    content: string
    questionType?: string
    referenceAnswer?: string[]
  }
  isComplete: boolean
  summary?: string
}

/** 语音提交回答的结果（含识别文本） */
export interface VoiceAnswerResult extends SubmitAnswerResult {
  recognizedText: string
}
