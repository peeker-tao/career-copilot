import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { JobRecommendation, JobMatch, JobMatchStatus, MatchAnalysis } from '@/types/job-matching'

/** 获取 AI 智能岗位推荐 */
export async function getRecommendations(limit?: number): Promise<ApiResponse<JobRecommendation[]>> {
  const response: any = await apiClient.get('/job-matching/recommendations', { params: { limit } })
  const raw = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.items ?? response.data?.list ?? []))
  return {
    code: response.code ?? 200,
    message: response.message ?? 'success',
    data: raw.map((item: any) => ({
      id: item.id,
      position: item.position,
      company: item.company || '',
      location: item.location || '',
      matchScore: item.matchScore ?? 0,
      reason: item.matchDetails?.suggestions?.[0] || item.description || '',
      skills: item.matchDetails?.matchedSkills || item.requirements || [],
      url: item.applyUrl,
    })),
  }
}

/** 获取用户保存的岗位列表 */
export async function getMatches(params?: {
  page?: number
  limit?: number
  status?: JobMatchStatus
}): Promise<ApiResponse<PaginationResult<JobMatch>>> {
  const response: any = await apiClient.get('/job-matching/matches', { params })
  const data = response.data ?? response
  return {
    code: response.code ?? 200,
    message: response.message ?? 'success',
    data: {
      list: Array.isArray(data) ? data : (data?.items ?? data?.list ?? []),
      page: data?.pagination?.page ?? data?.page ?? 1,
      pageSize: data?.pagination?.pageSize ?? data?.pagination?.limit ?? data?.limit ?? 20,
      total: data?.pagination?.total ?? data?.total ?? 0,
    },
  }
}

/** 更新岗位状态 */
export async function updateMatchStatus(id: string, status: JobMatchStatus): Promise<ApiResponse<null>> {
  return apiClient.patch(`/job-matching/matches/${id}/status`, { status })
}

/** 导入单条岗位匹配数据 */
export async function importJobMatch(data: {
  position: string
  company?: string
  location?: string
  description?: string
  matchScore: number
  status?: string
}): Promise<ApiResponse<any>> {
  return apiClient.post('/job-matching/import', data)
}

/** 一键导入默认岗位基准数据（Kaggle 简历数据集） */
export async function seedDefaultJobMatches(): Promise<ApiResponse<{ total: number; success: number; skipped: number; errors: string[] }>> {
  const response: any = await apiClient.post('/job-matching/seed-default')
  return { code: response.code, message: response.message, data: response.data }
}

/** 分析简历与目标岗位匹配度 */
export async function analyzeMatch(resumeId: string, position: string): Promise<ApiResponse<MatchAnalysis>> {
  const response: any = await apiClient.post('/job-matching/analyze', { resumeId, position })
  const d = response.data ?? response
  return {
    code: response.code ?? 200,
    message: response.message ?? 'success',
    data: {
      overallScore: d.matchScore ?? d.overallScore ?? 0,
      skillMatch: {
        matched: d.matchedSkills ?? d.skillMatch?.matched ?? [],
        missing: d.missingSkills ?? d.skillMatch?.missing ?? [],
        score: d.matchScore ?? d.skillMatch?.score ?? 0,
      },
      experienceMatch: {
        requiredYears: d.experienceMatch?.requiredYears ?? 0,
        actualYears: d.experienceMatch?.actualYears ?? 0,
        score: d.experienceMatch?.score ?? d.matchScore ?? 0,
      },
      suggestions: d.suggestions ?? [],
    },
  }
}
