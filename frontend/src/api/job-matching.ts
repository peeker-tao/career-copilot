import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { JobRecommendation, JobMatch, JobMatchStatus, MatchAnalysis, JobMatchStats, SeedResult } from '@/types/job-matching'

/** 获取 AI 智能岗位推荐 */
export async function getRecommendations(limit?: number): Promise<ApiResponse<JobRecommendation[]>> {
  const response: any = await apiClient.get('/job-matching/recommendations', { params: { limit } })
  // 后端经 ResponseInterceptor 包装: { code, message, data: { items: [...], source: '...' } }
  // axios 拦截器已取 response.data，所以 response = { code, message, data: { items, source } }
  const respData = response?.data ?? {}
  const rawItems = Array.isArray(respData)
    ? respData
    : Array.isArray(respData?.items)
      ? respData.items
      : []
  const items: JobRecommendation[] = rawItems.map((item: any) => ({
    id: item.id,
    position: item.position,
    company: item.company ?? '',
    location: item.location ?? '',
    matchScore: item.matchScore ?? 0,
    reason: item.matchDetails?.suggestions?.[0] ?? item.description ?? '',
    skills: item.requirements ?? item.matchDetails?.matchedSkills ?? [],
    url: item.applyUrl ?? undefined,
  }))
  return { code: response?.code ?? 0, message: response?.message ?? 'ok', data: items }
}

/** 获取用户保存的岗位列表 */
export async function getMatches(params?: {
  page?: number
  limit?: number
  status?: JobMatchStatus
}): Promise<ApiResponse<PaginationResult<JobMatch>>> {
  const response: any = await apiClient.get('/job-matching/matches', { params })
  // 后端经 ResponseInterceptor 包装后: { code, message, data: { items, total, page, limit, totalPages } }
  const respData = response?.data ?? {}
  const list = Array.isArray(respData?.list)
    ? respData.list
    : Array.isArray(respData?.items)
      ? respData.items
      : []
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: {
      list,
      page: respData?.page ?? 1,
      pageSize: respData?.limit ?? 20,
      total: respData?.total ?? 0,
    },
  }
}

/** 更新岗位状态 */
export async function updateMatchStatus(id: string, status: JobMatchStatus): Promise<ApiResponse<null>> {
  return apiClient.patch(`/job-matching/matches/${id}/status`, { status })
}

/** 分析简历与目标岗位匹配度 */
export async function analyzeMatch(resumeId: string, position: string): Promise<ApiResponse<MatchAnalysis>> {
  const response: any = await apiClient.post('/job-matching/analyze', { resumeId, position })
  // 后端返回: { position, matchScore, matchedSkills, missingSkills, suggestions }
  // 前端 MatchAnalysis 需要: { overallScore, skillMatch: { matched, missing, score }, experienceMatch: {...}, suggestions }
  const d = response?.data ?? {}
  const score = d.matchScore ?? 0
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: {
      overallScore: score,
      skillMatch: {
        matched: d.matchedSkills ?? [],
        missing: d.missingSkills ?? [],
        score,
      },
      experienceMatch: {
        requiredYears: 0,
        actualYears: 0,
        score: 0,
      },
      suggestions: d.suggestions ?? [],
    },
  }
}

/** 获取岗位匹配数据库统计 */
export async function getStats(): Promise<ApiResponse<JobMatchStats>> {
  const response: any = await apiClient.get('/job-matching/stats')
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: response?.data ?? {},
  }
}

/** 一键导入默认基准数据（Kaggle 简历数据集） */
export async function seedDefault(): Promise<ApiResponse<SeedResult>> {
  const response: any = await apiClient.post('/job-matching/seed-default')
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: response?.data ?? {},
  }
}
