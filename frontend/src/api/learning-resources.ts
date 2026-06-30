import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { LearningResource, ResourceCategory, RecommendedResource, ResourceRecommendationRequest } from '@/types/learning-resources'

/** 浏览学习资源 */
export async function getResources(params?: {
  page?: number
  limit?: number
  category?: string
  keyword?: string
  difficulty?: string
  type?: string
}): Promise<ApiResponse<PaginationResult<LearningResource>>> {
  const { keyword, ...rest } = params || {}
  const queryParams = keyword ? { ...rest, search: keyword } : rest
  const response: any = await apiClient.get('/learning-resources', { params: queryParams })
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data?.items ?? response.data?.list ?? [],
      page: response.data?.pagination?.page ?? response.data?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? response.data?.pagination?.limit ?? response.data?.limit ?? 20,
      total: response.data?.pagination?.total ?? response.data?.total ?? 0,
    },
  }
}

/** 获取所有资源分类 */
export async function getCategories(): Promise<ApiResponse<ResourceCategory[]>> {
  const response: any = await apiClient.get('/learning-resources/categories')
  const cats = Array.isArray(response.data) ? response.data : []
  return {
    code: response.code,
    message: response.message,
    data: cats.map((c: any) => (typeof c === 'string' ? { name: c, count: 0 } : c)),
  }
}

/** 获取单个资源详情 */
export async function getResourceById(id: string): Promise<ApiResponse<LearningResource>> {
  return apiClient.get(`/learning-resources/${id}`)
}

/** AI 个性化资源推荐 */
export async function getRecommendations(data: ResourceRecommendationRequest): Promise<ApiResponse<RecommendedResource[]>> {
  const response: any = await apiClient.post('/learning-resources/recommendations', {
    gapSkills: data.skillGaps,
    targetPosition: data.targetPosition,
    count: data.limit ?? 5,
  })
  return {
    code: response.code,
    message: response.message,
    data: response.data?.recommendations ?? response.data ?? [],
  }
}
