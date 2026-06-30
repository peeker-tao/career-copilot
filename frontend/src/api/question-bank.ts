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
      list: (response.data?.items ?? response.data?.list ?? []).map((item: any) => ({
        id: item.id,
        question: item.content?.question || item.title || '',
        type: item.type,
        category: item.category,
        difficulty: item.difficulty,
        tags: item.tags || [],
        options: item.content?.options || undefined,
        answer: item.content?.answer || '',
        hint: item.content?.explanation || '',
      })),
      page: response.data?.pagination?.page ?? response.data?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? response.data?.pagination?.limit ?? response.data?.limit ?? 20,
      total: response.data?.pagination?.total ?? response.data?.total ?? 0,
    },
  }
}

/** 获取所有分类 */
export async function getCategories(): Promise<ApiResponse<QuestionCategory[]>> {
  const response: any = await apiClient.get('/question-bank/categories')
  const cats = Array.isArray(response.data) ? response.data : []
  return {
    code: response.code,
    message: response.message,
    data: cats.map((c: any) => (typeof c === 'string' ? { name: c, count: 0 } : c)),
  }
}

/** 获取题目详情 */
export async function getQuestionById(id: string): Promise<ApiResponse<QuestionBankItem>> {
  return apiClient.get(`/question-bank/${id}`)
}

/** AI 生成面试题目 */
export async function generateQuestions(data: GenerateQuestionsRequest): Promise<ApiResponse<GenerateQuestionsResult>> {
  const { skills, types, ...rest } = data
  const body: Record<string, any> = { ...rest }
  if (skills?.length) body.position = `${body.position || ''}（技能: ${skills.join(', ')}）`
  if (types?.length) body.type = types.join(',')
  const response: any = await apiClient.post('/question-bank/generate', body)
  return {
    code: response.code,
    message: response.message,
    data: {
      questions: (response.data?.questions ?? []).map((item: any) => ({
        id: item.id,
        question: item.content?.question || item.title || '',
        type: item.type,
        category: item.category,
        difficulty: item.difficulty,
        tags: item.tags || [],
        options: item.content?.options || undefined,
        answer: item.content?.answer || '',
        hint: item.content?.explanation || '',
      })),
    },
  }
}
