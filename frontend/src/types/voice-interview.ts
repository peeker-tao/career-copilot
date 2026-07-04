/** 语音面试状态 */
export type VoiceInterviewStatus = 'in_progress' | 'paused' | 'completed'

/** 语音面试会话 */
export interface VoiceInterview {
  id: string
  position: string
  status: VoiceInterviewStatus
  score?: number
  duration?: number
  questions: string[]
  answers: string[]
  startedAt: string
  completedAt?: string
}

/** 语音面试摘要 */
export interface VoiceInterviewSummary {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  transcript: string
}

/** 创建语音面试请求 */
export interface CreateVoiceInterviewRequest {
  position: string
  difficulty?: 'easy' | 'medium' | 'hard'
  duration?: number
}

/** 保存转录请求 */
export interface SaveTranscriptRequest {
  content: string
  timestamp?: string
}

/** 语音面试列表项 */
export interface VoiceInterviewListItem {
  id: string
  position: string
  status: VoiceInterviewStatus
  score?: number
  duration?: number
  createdAt: string
}
