/** 岗位推荐 */
export interface JobRecommendation {
  id: string
  position: string
  company: string
  location: string
  matchScore: number
  reason: string
  skills: string[]
  url?: string
}

/** 岗位匹配状态 */
export type JobMatchStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected'

/** 已保存的岗位匹配 */
export interface JobMatch {
  id: string
  position: string
  company: string
  status: JobMatchStatus
  matchScore: number
  notes?: string
  createdAt: string
}

/** 匹配度分析 */
export interface MatchAnalysis {
  overallScore: number
  skillMatch: {
    matched: string[]
    missing: string[]
    score: number
  }
  experienceMatch: {
    requiredYears: number
    actualYears: number
    score: number
  }
  suggestions: string[]
}
