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
  const response: any = await apiClient.get('/learning-resources', { params })
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data?.list ?? response.data ?? [],
      page: response.data?.pagination?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? 20,
      total: response.data?.pagination?.total ?? 0,
    },
  }
}

/** 获取所有资源分类 */
export async function getCategories(): Promise<ApiResponse<ResourceCategory[]>> {
  const response: any = await apiClient.get('/learning-resources/categories')
  return { code: response.code, message: response.message, data: response.data ?? [] }
}

/** 获取单个资源详情 */
export async function getResourceById(id: string): Promise<ApiResponse<LearningResource>> {
  return apiClient.get(`/learning-resources/${id}`)
}

/** AI 个性化资源推荐 */
export async function getRecommendations(data: ResourceRecommendationRequest): Promise<ApiResponse<RecommendedResource[]>> {
  const response: any = await apiClient.post('/learning-resources/recommendations', data)
  return { code: response.code, message: response.message, data: response.data ?? [] }
}
