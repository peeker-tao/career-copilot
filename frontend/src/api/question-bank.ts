import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { QuestionBankItem, QuestionCategory, GenerateQuestionsRequest, GenerateQuestionsResult } from '@/types/question-bank'

/** 浏览题库 */
export async function getQuestions(params?: {
  page?: number
  limit?: number
  category?: string
  difficulty?: string
  type?: string
}): Promise<ApiResponse<PaginationResult<QuestionBankItem>>> {
  const response: any = await apiClient.get('/question-bank', { params })
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data?.list ?? response.data ?? [],
      page: response.data?.pagination?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? 20,
      total: response.data?.pagination?.total ?? 0,
    },
  }
}

/** 获取所有分类 */
export async function getCategories(): Promise<ApiResponse<QuestionCategory[]>> {
  const response: any = await apiClient.get('/question-bank/categories')
  return { code: response.code, message: response.message, data: response.data ?? [] }
}

/** 获取题目详情 */
export async function getQuestionById(id: string): Promise<ApiResponse<QuestionBankItem>> {
  return apiClient.get(`/question-bank/${id}`)
}

/** AI 生成面试题目 */
export async function generateQuestions(data: GenerateQuestionsRequest): Promise<ApiResponse<GenerateQuestionsResult>> {
  const response: any = await apiClient.post('/question-bank/generate', data)
  return { code: response.code, message: response.message, data: response.data }
}
