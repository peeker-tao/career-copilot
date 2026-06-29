import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { JobRecommendation, JobMatch, JobMatchStatus, MatchAnalysis } from '@/types/job-matching'

/** 获取 AI 智能岗位推荐 */
export async function getRecommendations(limit?: number): Promise<ApiResponse<JobRecommendation[]>> {
  const response: any = await apiClient.get('/job-matching/recommendations', { params: { limit } })
  return { code: response.code, message: response.message, data: response.data ?? [] }
}

/** 获取用户保存的岗位列表 */
export async function getMatches(params?: {
  page?: number
  limit?: number
  status?: JobMatchStatus
}): Promise<ApiResponse<PaginationResult<JobMatch>>> {
  const response: any = await apiClient.get('/job-matching/matches', { params })
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data?.list ?? response.data ?? [],
      page: response.data?.pagination?.page ?? response.data?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? response.data?.limit ?? 20,
      total: response.data?.pagination?.total ?? response.data?.total ?? 0,
    },
  }
}

/** 更新岗位状态 */
export async function updateMatchStatus(id: string, status: JobMatchStatus): Promise<ApiResponse<null>> {
  return apiClient.patch(`/job-matching/matches/${id}/status`, { status })
}

/** 分析简历与目标岗位匹配度 */
export async function analyzeMatch(resumeId: string, position: string): Promise<ApiResponse<MatchAnalysis>> {
  return apiClient.post('/job-matching/analyze', { resumeId, position })
}
