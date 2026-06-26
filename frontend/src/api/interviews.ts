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
    return {
      code: 200,
      message: '创建成功',
      data: {
        id: Date.now().toString(),
        targetPosition: data.targetPosition,
        difficulty: data.difficulty,
        status: 'in_progress',
        score: null,
        rounds: 0,
        duration: '-',
        startedAt: new Date().toISOString(),
      },
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

/** 获取面试报告 */
export async function getInterviewReport(id: string): Promise<ApiResponse<InterviewReport>> {
  if (useMock) {
    await delay(600)
    return {
      code: 200,
      message: 'success',
      data: {
        overallScore: 85,
        strengths: ['技术基础扎实', '表达清晰', '逻辑思维强'],
        weaknesses: ['系统设计经验不足', '部分细节理解不够深入'],
        suggestions: [
          '加强系统设计方面的练习',
          '多了解分布式系统的实际案例',
        ],
        skillScores: [
          { name: 'Java', score: 85 },
          { name: 'Spring Boot', score: 80 },
          { name: 'MySQL', score: 75 },
          { name: 'Redis', score: 70 },
          { name: '系统设计', score: 60 },
        ],
      },
    }
  }
  // 后端 POST /interviews/:id/feedback，NestJS ResponseInterceptor 返回 code=201
  const response: any = await apiClient.post(`/interviews/${id}/feedback`)
  const fb = response.data
  if (!fb) {
    throw new Error(response.message || '获取报告失败')
  }
  return {
    code: response.code,
    message: response.message,
    data: {
      overallScore: fb.overallScore,
      strengths: fb.strengths || [],
      weaknesses: fb.weaknesses || [],
      suggestions: (fb.learningSuggestions || []).map(
        (s: { area: string }) => s.area
      ),
      skillScores: fb.dimensions
        ? (fb.dimensions as Array<{ name: string; score: number }>).map((d) => ({
            name: d.name,
            score: d.score,
          }))
        : [],
    },
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
