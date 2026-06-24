import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { CareerPlan, CareerPlanSummary, MarketInsight, SalaryRange } from '@/types/career'
import { MOCK_PLAN_SUMMARIES, MOCK_PLAN_DETAIL, MOCK_MARKET_INSIGHT } from '@/mock'

const useMock = import.meta.env.USE_MOCK

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 获取规划列表 */
export async function getCareerPlans(): Promise<ApiResponse<CareerPlanSummary[]>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: MOCK_PLAN_SUMMARIES }
  }
  // 后端 getPlans 直接返回数组，ResponseInterceptor 包裹为 {code, data: [...]}
  const response: any = await apiClient.get('/career/plans')
  const list = Array.isArray(response.data) ? response.data : (response.data?.items || response.data?.list || [])
  return {
    code: response.code,
    message: response.message,
    data: list.map((plan: any) => ({
      id: plan.id,
      targetPosition: plan.targetPosition,
      progress: plan.progress,
      createdAt: plan.createdAt,
      skills: plan.currentSkills || plan.skills || [],
    }))
  }
}

/** 获取规划详情 */
export async function getCareerPlanById(id: string): Promise<ApiResponse<CareerPlan>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: { ...MOCK_PLAN_DETAIL, id } }
  }
  const response : ApiResponse<any> = await apiClient.get(`/career/plans/${id}`)
  console.log('API response for getCareerPlanById:', response)
  return {
    code: response.code,
    message: response.message,
    data: {
      ...response.data,
      possessedSkills: response.data.currentSkills,
      targetSkills: response.data.gapSkills,
      stages: response.data.roadmap.map((stage: any, index: number) => ({
        ...stage,
        id: index,
        title: stage.title,
        goal: stage.goal,
        resources: stage.resources.map((res: any) => ({
          name: res.name,
          type: res.type,
          description: res.description,
          url: res.url,
        })),
        skills: stage.skills,
        duration: stage.estimatedWeeks ? `${stage.estimatedWeeks}周` : '',
      }))
    }
  }
}

/** 生成职业规划 */
export async function generateCareerPlan(params: {
  targetPosition: string
  skills?: string[]
}): Promise<ApiResponse<CareerPlan>> {
  if (useMock) {
    await delay(3000)
    return {
      code: 200,
      message: '生成成功',
      data: { ...MOCK_PLAN_DETAIL, id: Date.now().toString() },
    }
  }
  return apiClient.post('/career/plan', { targetPosition: params.targetPosition, currentSkills: params.skills })
}

/** 删除规划 */
export async function deleteCareerPlan(id: string): Promise<ApiResponse<null>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '删除成功', data: null }
  }
  return apiClient.delete(`/career/plans/${id}`)
}

/** 更新规划进度 */
export async function updatePlanProgress(
  id: string,
  progress: number,
  phase?: number
): Promise<ApiResponse<CareerPlan>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '更新成功', data: { ...MOCK_PLAN_DETAIL, progress } }
  }
  // 后端 PATCH /career/plans/:id/progress 要求 body: { phase: number, progress: number }
  return apiClient.patch(`/career/plans/${id}/progress`, { phase: phase ?? 1, progress })
}

/** Parse averageSalary string like "15K-35K" to min/max */
function parseSalaryRange(averageSalary: string, position: string): SalaryRange[] {
  const match = averageSalary?.match(/(\d+)\s*K?\s*-\s*(\d+)\s*K?/i)
  if (match) {
    return [{ position, min: parseInt(match[1]), max: parseInt(match[2]) }]
  }
  return [{ position, min: 10, max: 30 }]
}

/** Generate trend numbers from demand trend description */
function trendFromDescription(demandTrend: string): number[] {
  const trend = [60, 65, 70, 72, 75, 78, 82, 85, 88, 90, 92, 95]
  if (!demandTrend) return trend
  if (demandTrend.includes('下降') || demandTrend.includes('减少')) {
    return trend.map((v, i) => Math.round(v * (1 - i * 0.02)))
  }
  if (demandTrend.includes('稳定') || demandTrend.includes('平稳')) {
    return trend.map(() => 75 + Math.round(Math.random() * 10 - 5))
  }
  return trend
}

/** 获取市场洞察 */
export async function getMarketInsight(
  position: string
): Promise<ApiResponse<MarketInsight>> {
  if (useMock) {
    await delay(500)
    return { code: 200, message: 'success', data: MOCK_MARKET_INSIGHT }
  }
  // Backend returns MarketInsightResult which has a different shape from frontend MarketInsight
  const response: any = await apiClient.get('/career/market-insight', { params: { position } })
  const backend = response.data
  const expDist = backend.experienceDistribution || {}
  return {
    code: response.code,
    message: response.message,
    data: {
      salary: parseSalaryRange(backend.averageSalary, position),
      trend: trendFromDescription(backend.demandTrend),
      topSkills: (backend.topSkills || []).map((name: string, i: number) => ({
        name,
        count: Math.round(95 - i * (70 / Math.max(backend.topSkills.length - 1, 1))),
      })),
      experienceDistribution: [
        { name: '应届（<1年）', value: parseInt(expDist.entry) || 20 },
        { name: '1-3 年', value: parseInt(expDist.junior) || 35 },
        { name: '3-5 年', value: parseInt(expDist.mid) || 30 },
        { name: '5-10 年', value: parseInt(expDist.senior) || 15 },
      ],
    },
  }
}
