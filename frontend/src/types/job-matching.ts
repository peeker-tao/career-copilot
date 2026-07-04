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
export type JobMatchStatus = 'pending' | 'saved' | 'applied' | 'archived'

/** 已保存的岗位匹配 */
export interface JobMatch {
  id: string
  position: string
  company: string
  location?: string
  salaryRange?: string
  status: JobMatchStatus
  matchScore: number
  requirements?: string[]
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

/** 数据库统计 */
export interface JobMatchStats {
  total: number
  statusDistribution: Record<string, number>
  sourceDistribution: Record<string, number>
  scoreStats: {
    average: number
    max: number
    min: number
  }
  topPositions: {
    position: string
    count: number
    avgMatchScore: number
  }[]
  topCompanies: {
    company: string | null
    count: number
    avgMatchScore: number
  }[]
}

/** 种子数据导入结果 */
export interface SeedResult {
  total: number
  success: number
  skipped: number
  errors: string[]
}
