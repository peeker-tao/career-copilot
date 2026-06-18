import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { CareerPlan, CareerPlanSummary, MarketInsight } from '@/types/career'
import { MOCK_PLAN_SUMMARIES, MOCK_PLAN_DETAIL, MOCK_MARKET_INSIGHT } from '@/mock'

const useMock = import.meta.env.DEV
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 获取规划列表 */
export async function getCareerPlans(): Promise<ApiResponse<CareerPlanSummary[]>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: MOCK_PLAN_SUMMARIES }
  }
  return apiClient.get('/career/plans')
}

/** 获取规划详情 */
export async function getCareerPlanById(id: string): Promise<ApiResponse<CareerPlan>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: { ...MOCK_PLAN_DETAIL, id } }
  }
  return apiClient.get(`/career/plans/${id}`)
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
  return apiClient.post('/career/plan', params)
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
  progress: number
): Promise<ApiResponse<CareerPlan>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '更新成功', data: { ...MOCK_PLAN_DETAIL, progress } }
  }
  return apiClient.patch(`/career/plans/${id}/progress`, { progress })
}

/** 获取市场洞察 */
export async function getMarketInsight(
  position: string
): Promise<ApiResponse<MarketInsight>> {
  if (useMock) {
    await delay(500)
    return { code: 200, message: 'success', data: MOCK_MARKET_INSIGHT }
  }
  return apiClient.get('/career/market-insight', { params: { position } })
}
