/** 资源类型 */
export type ResourceType = 'video' | 'article' | 'course' | 'book'

/** 难度等级 */
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced'

/** 学习资源 */
export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  category: string
  difficulty: ResourceDifficulty
  url: string
  description: string
  rating: number
  tags?: string[]
  duration?: string
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
