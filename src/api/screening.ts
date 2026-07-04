import apiClient from './client'
import type { ApiResponse } from '@/types/api'

export interface BenchmarkStats {
  jobRole: string
  total: number
  avgAiScore: number
  minScore: number
  maxScore: number
  decisionDistribution: Record<string, number>
  topCandidates: Array<{
    name: string
    aiScore: number
    decision: string
    experienceYears: number
    education: string
  }>
}

export interface EvaluationResult {
  evaluation: {
    skillMatch: number
    experienceRelevance: number
    educationFit: number
    overallScore: number
    recommendation: 'hire' | 'review' | 'reject'
    strengths: string[]
    weaknesses: string[]
    comment: string
  }
  benchmark: BenchmarkStats | { jobRole: string; total: number; message: string }
}

export interface SeedResult {
  success: boolean
  imported?: number
  message: string
}

export interface ImportRecord {
  resumeId: number
  name: string
  skills: string[]
  experienceYears: number
  education: string
  certifications?: string
  jobRole: string
  recruiterDecision: string
  salaryExpectation: number
  projectsCount: number
  aiScore: number
}

/** 种子数据：从系统 CSV 导入 1000 条基准记录 */
export async function seedBenchmarks(): Promise<ApiResponse<SeedResult>> {
  const response: any = await apiClient.post('/resumes/screening/benchmark-seed')
  return { code: response.code, message: response.message, data: response.data }
}

/** 批量导入基准记录 */
export async function importBenchmarks(records: ImportRecord[]): Promise<ApiResponse<SeedResult>> {
  const response: any = await apiClient.post('/resumes/screening/benchmark-import', { records })
  return { code: response.code, message: response.message, data: response.data }
}

/** 获取基准统计 */
export async function getBenchmarkStats(jobRole?: string): Promise<ApiResponse<BenchmarkStats[]>> {
  const params = jobRole ? { jobRole } : undefined
  const response: any = await apiClient.get('/resumes/screening/benchmark-stats', { params })
  const data = response.data?.roles ?? (response.data ? [response.data] : [])
  return { code: response.code, message: response.message, data }
}

/** 评估候选人匹配度 */
export async function evaluateCandidate(data: {
  jobRole: string
  skills: string[]
  experienceYears: number
  education: string
  certifications?: string
  projectsCount?: number
}): Promise<ApiResponse<EvaluationResult>> {
  const response: any = await apiClient.post('/resumes/screening/evaluate', data)
  return { code: response.code, message: response.message, data: response.data }
}