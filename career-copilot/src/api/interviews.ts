import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { Interview, InterviewMessage, CreateInterviewRequest, InterviewReport } from '@/types/interview'
import { MOCK_INTERVIEWS, MOCK_INITIAL_MESSAGES, AI_RESPONSES } from '@/mock'

const useMock = import.meta.env.DEV
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

let mockResponseIndex = 0

/** 获取面试历史 */
export async function getInterviews(): Promise<ApiResponse<Interview[]>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: MOCK_INTERVIEWS }
  }
  return apiClient.get('/interviews')
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
): Promise<ApiResponse<InterviewMessage>> {
  if (useMock) {
    await delay(1000)
    const response = AI_RESPONSES[mockResponseIndex % AI_RESPONSES.length]
    mockResponseIndex++
    return {
      code: 200,
      message: 'success',
      data: {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
        rating: Math.floor(Math.random() * 2) + 3,
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
  return apiClient.get(`/interviews/${id}/report`)
}
