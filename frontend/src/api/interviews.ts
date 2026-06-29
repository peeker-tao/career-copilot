import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { Interview, InterviewMessage, CreateInterviewRequest, InterviewReport, SubmitAnswerResult } from '@/types/interview'
import { MOCK_INTERVIEWS, MOCK_INITIAL_MESSAGES, AI_FEEDBACKS, AI_NEXT_QUESTIONS } from '@/mock'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

let mockResponseIndex = 0

/** 面试列表分页结果 */
export interface InterviewListResult {
  items: Interview[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** 获取面试历史 */
export async function getInterviews(params?: {
  page?: number
  limit?: number
}): Promise<ApiResponse<InterviewListResult>> {
  if (useMock) {
    await delay(400)
    const page = params?.page ?? 1
    const limit = params?.limit ?? 10
    const start = (page - 1) * limit
    const pagedItems = MOCK_INTERVIEWS.slice(start, start + limit)
    return {
      code: 200,
      message: 'success',
      data: {
        items: pagedItems,
        total: MOCK_INTERVIEWS.length,
        page,
        limit,
        totalPages: Math.ceil(MOCK_INTERVIEWS.length / limit),
      },
    }
  }
  const response: any = await apiClient.get('/interviews', { params })
  // 后端返回 { items: [...], total, page, limit, totalPages }
  const data = response.data
  return {
    code: response.code,
    message: response.message,
    data: {
      items: Array.isArray(data?.items) ? data.items : [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      limit: data?.limit ?? 10,
      totalPages: data?.totalPages ?? 1,
    },
  }
}

/** 获取面试详情 */
export async function getInterviewById(id: string): Promise<ApiResponse<Interview>> {
  if (useMock) {
    await delay(300)
    return {
      code: 200,
      message: 'success',
      data: MOCK_INTERVIEWS.find((i) => i.id === id) || MOCK_INTERVIEWS[0],
    }
  }
  return apiClient.get(`/interviews/${id}`)
}

/** 获取面试消息 */
export async function getInterviewMessages(id: string): Promise<ApiResponse<InterviewMessage[]>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: 'success', data: MOCK_INITIAL_MESSAGES }
  }
  return apiClient.get(`/interviews/${id}/messages`)
}

/** 创建面试会话 */
export async function createInterview(data: CreateInterviewRequest): Promise<ApiResponse<Interview>> {
  if (useMock) {
    await delay(500)
    const mockInterview: Interview = {
      id: Date.now().toString(),
      targetPosition: data.targetPosition,
      difficulty: data.difficulty,
      status: 'in_progress',
      score: null,
      rounds: 0,
      duration: '-',
      startedAt: new Date().toISOString(),
    }
    return {
      code: 200,
      message: '创建成功',
      data: mockInterview,
    }
  }
  return apiClient.post('/interviews', data)
}

/** 提交回答（模拟 AI 回复） */
export async function submitAnswer(
  interviewId: string,
  content: string
): Promise<ApiResponse<SubmitAnswerResult>> {
  if (useMock) {
    await delay(1000)
    const feedback = AI_FEEDBACKS[mockResponseIndex % AI_FEEDBACKS.length]
    const nextQuestion = AI_NEXT_QUESTIONS[mockResponseIndex % AI_NEXT_QUESTIONS.length]
    mockResponseIndex++
    return {
      code: 200,
      message: 'success',
      data: {
        evaluation: {
          score: Math.floor(Math.random() * 3) + 3,
          feedback,
          strengths: ['基础知识扎实', '表达清晰'],
          weaknesses: ['可以结合更多实际案例'],
        },
        nextQuestion: {
          content: nextQuestion,
          questionType: 'technical',
        },
        isComplete: mockResponseIndex >= 5,
      },
    }
  }
  return apiClient.post(`/interviews/${interviewId}/answer`, { content })
}

// 后端 FeedbackReport 原始结构（来自 AI prompt 输出 + interview-report.service）
interface BackendFeedbackReport {
  overallScore: number
  overallRating: string
  summary: string
  questionScores: Array<{ questionIndex: number; score: number; comment: string; strength: string; weakness: string }>
  dimensions: Array<{ name: string; score: number; comment: string; suggestions: string }>
  strengths: string[]
  weaknesses: string[]
  learningSuggestions: Array<{ area: string; priority: string; reason: string; resources: string[] }>
}

// 异步反馈任务响应
interface FeedbackAsyncResponse {
  type: 'cached' | 'queued'
  data?: BackendFeedbackReport
  jobId?: string
  message?: string
}

// 轮询状态响应
interface FeedbackStatusResponse {
  status: string
  data?: BackendFeedbackReport
}

/** 轮询等待报告生成完成 */
async function pollUntilReady(interviewId: string, jobId: string, maxRetries = 30): Promise<BackendFeedbackReport> {
  for (let i = 0; i < maxRetries; i++) {
    const pollRes: ApiResponse<FeedbackStatusResponse> = await apiClient.get(
      `/interviews/${interviewId}/feedback/status`,
      { params: { jobId } },
    )
    if (pollRes.data?.status === 'completed' && pollRes.data?.data) {
      return pollRes.data.data
    }
    if (pollRes.data?.status === 'failed') {
      throw new Error('报告生成失败')
    }
    // 等待 2 秒再试
    await delay(2000)
  }
  throw new Error('报告生成超时，请稍后重试')
}

/** 将后端 FeedbackReport 映射为前端 InterviewReport */
function mapToInterviewReport(fb: BackendFeedbackReport): InterviewReport {
  return {
    overallRating: fb.overallRating || '',
    overallScore: fb.overallScore ?? 0,
    summary: fb.summary || '',
    strengths: fb.strengths || [],
    weaknesses: fb.weaknesses || [],
    suggestions: (fb.learningSuggestions || []).map((s) => s.area),
    skillScores: fb.dimensions || [],
  }
}

/** 获取面试报告（支持异步生成+轮询） */
export async function getInterviewReport(id: string): Promise<ApiResponse<InterviewReport | null>> {
  if (useMock) {
    await delay(600)
    return {
      code: 200,
      message: 'success',
      data: {
        overallRating: 'B',
        overallScore: 85,
        strengths: ['技术基础扎实', '表达清晰', '逻辑思维强'],
        weaknesses: ['系统设计经验不足', '部分细节理解不够深入'],
        suggestions: ['加强系统设计方面的练习', '多了解分布式系统的实际案例'],
        skillScores: [
          { name: 'Java', score: 85, comment: '基础知识扎实', suggestions: '可以进一步深入学习高级特性' },
          { name: 'Spring Boot', score: 80, comment: '能够熟练使用', suggestions: '建议多关注最新版本的特性和最佳实践' },
          { name: 'MySQL', score: 75, comment: '基本操作熟练', suggestions: '需要加强索引优化和性能调优方面的知识' },
          { name: 'Redis', score: 70, comment: '了解基本用法', suggestions: '建议深入学习数据结构和应用场景' },
          { name: '系统设计', score: 60, comment: '基础概念掌握', suggestions: '需要积累更多实际项目经验' },
        ],
        summary: '整体表现良好，但在系统设计方面有待加强。',
      },
    }
  }

  // Step 1: POST /interviews/:id/feedback → 返回 202 { type: 'cached' | 'queued', data?, jobId? }
  const response: ApiResponse<FeedbackAsyncResponse> = await apiClient.post(`/interviews/${id}/feedback`)
  const payload = response.data

  if (response.code !== 200 && response.code !== 201 && response.code !== 202) {
    throw new Error(response.message || '获取报告失败')
  }

  if (!payload) {
    return { code: response.code, message: response.message, data: null }
  }

  let fb: BackendFeedbackReport

  if (payload.type === 'cached') {
    // 已有缓存，直接使用
    fb = payload.data as BackendFeedbackReport
  } else if (payload.type === 'queued' && payload.jobId) {
    // 异步生成中，轮询等待
    fb = await pollUntilReady(id, payload.jobId)
  } else {
    // 兼容旧版同步返回
    fb = payload as unknown as BackendFeedbackReport
  }

  return {
    code: response.code,
    message: response.message,
    data: mapToInterviewReport(fb),
  }
}

/** 结束面试（标记为 completed） */
export async function completeInterview(id: string): Promise<ApiResponse<Interview>> {
  if (useMock) {
    await delay(300)
    const interview = MOCK_INTERVIEWS.find((i) => i.id === id) || MOCK_INTERVIEWS[0]
    return {
      code: 200,
      message: '面试已结束',
      data: { ...interview, status: 'completed' },
    }
  }
  return apiClient.post(`/interviews/${id}/complete`)
}

/** 删除面试记录 */
export async function deleteInterview(id: string): Promise<ApiResponse<null>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '删除成功', data: null }
  }
  return apiClient.delete(`/interviews/${id}`)
}
