/** 资源类型 */
export type ResourceType = 'video' | 'article' | 'course' | 'book' | 'documentation'

/** 难度等级 */
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced'

/** 推荐来源 */
export type RecommendationSource = 'database' | 'ai_generated' | 'database_fallback'

/** 学习资源 */
export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  category: string
  difficulty: ResourceDifficulty
  url: string
  description: string
  rating?: number
  tags?: string[]
  duration?: string
  usageCount?: number
  relevanceScore?: number
  aiGenerated?: boolean
  source?: RecommendationSource
}

/** 资源分类 */
export interface ResourceCategory {
  name: string
  count: number
}

/** 推荐资源（含推荐理由） */
export interface RecommendedResource extends LearningResource {
  reason?: string
  relevanceScore?: number
}

/** AI 个性化推荐请求 */
export interface ResourceRecommendationRequest {
  skillGaps: string[]
  targetPosition: string
  preferredType?: ResourceType
  limit?: number
}

/** 推荐响应（后端完整结构） */
export interface RecommendationResponse {
  source: RecommendationSource
  gapSkills: string[]
  targetPosition: string
  recommendations: LearningResource[]
}
