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
  tags?: string[]
}): Promise<ApiResponse<PaginationResult<LearningResource>>> {
  const response: any = await apiClient.get('/learning-resources', {
    params: {
      ...params,
      search: params?.keyword, // 后端字段名为 search
      keyword: undefined,
      tags: params?.tags?.length ? params.tags : undefined,
    },
  })
  const respData = response?.data ?? {}
  return {
    code: response.code,
    message: response.message,
    data: {
      list: respData?.items ?? respData?.list ?? [],
      page: respData?.page ?? 1,
      pageSize: respData?.limit ?? 20,
      total: respData?.total ?? 0,
    },
  }
}

/** 获取所有资源分类 */
export async function getCategories(): Promise<ApiResponse<ResourceCategory[]>> {
  const response: any = await apiClient.get('/learning-resources/categories')
  // 后端返回 string[]，前端需要 { name, count }[]
  const raw: string[] = Array.isArray(response?.data) ? response.data : []
  const items: ResourceCategory[] = raw.map((name) => ({ name, count: 0 }))
  return { code: response.code, message: response.message, data: items }
}

/** 获取单个资源详情 */
export async function getResourceById(id: string): Promise<ApiResponse<LearningResource>> {
  return apiClient.get(`/learning-resources/${id}`)
}

/** AI 个性化资源推荐 */
export async function getRecommendations(data: ResourceRecommendationRequest): Promise<ApiResponse<RecommendedResource[]>> {
  const response: any = await apiClient.post('/learning-resources/recommendations', {
    targetPosition: data.targetPosition,
    gapSkills: data.skillGaps,  // 前端用 skillGaps，后端用 gapSkills
    count: data.limit ?? 5,
  })
  // 后端返回 { source, gapSkills, targetPosition, recommendations[] }
  const body = response?.data ?? {}
  const list = body.recommendations ?? (Array.isArray(body) ? body : [])
  return { code: response.code, message: response.message, data: list }
}
