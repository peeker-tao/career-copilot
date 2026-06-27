/** 面试难度 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 面试状态 */
export type InterviewStatus = 'in_progress' | 'completed' | 'interrupted' | 'pending'

/** 消息角色 */
export type MessageRole = 'ai' | 'user' | 'assistant'

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

/** 面试消息 */
export interface InterviewMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  rating?: number | null
  questionType?: string
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
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  skillScores: Array<{ name: string; score: number }>
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
  }
  isComplete: boolean
  summary?: string
}
