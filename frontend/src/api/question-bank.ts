import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type { QuestionBankItem, QuestionCategory, QuestionOption, GenerateQuestionsRequest, GenerateQuestionsResult } from '@/types/question-bank'

/** 将后端题目映射为前端 QuestionBankItem */
function mapQuestion(item: any): QuestionBankItem {
  const content = item.content ?? {}
  const rawOptions = content.options
  let options: QuestionOption[] | undefined
  if (Array.isArray(rawOptions)) {
    options = rawOptions.map((opt: any, i: number) => {
      if (typeof opt === 'string') {
        return { label: String.fromCharCode(65 + i), text: opt }
      }
      return { label: opt.label ?? String.fromCharCode(65 + i), text: opt.text ?? opt.value ?? '' }
    })
  }
  return {
    id: item.id,
    question: content.question ?? item.title ?? '',
    type: item.type,
    category: item.category,
    difficulty: item.difficulty,
    tags: item.tags ?? [],
    options,
    answer: content.answer ?? '',
    hint: content.explanation ?? '',
  }
}

/** 浏览题库 */
export async function getQuestions(params?: {
  page?: number
  limit?: number
  category?: string
  difficulty?: string
  type?: string
}): Promise<ApiResponse<PaginationResult<QuestionBankItem>>> {
  const response: any = await apiClient.get('/question-bank', { params })
  const respData = response?.data ?? {}
  const rawList = respData?.items ?? respData?.list ?? []
  const list: QuestionBankItem[] = Array.isArray(rawList) ? rawList.map(mapQuestion) : []
  return {
    code: response.code,
    message: response.message,
    data: {
      list,
      page: respData?.page ?? 1,
      pageSize: respData?.limit ?? 20,
      total: respData?.total ?? 0,
    },
  }
}

/** 获取所有分类 */
export async function getCategories(): Promise<ApiResponse<QuestionCategory[]>> {
  const response: any = await apiClient.get('/question-bank/categories')
  // 后端返回 string[]，前端需要 { name, count }[]
  const raw: string[] = Array.isArray(response?.data) ? response.data : []
  const items: QuestionCategory[] = raw.map((name) => ({ name, count: 0 }))
  return { code: response.code, message: response.message, data: items }
}

/** 获取题目详情 */
export async function getQuestionById(id: string): Promise<ApiResponse<QuestionBankItem>> {
  const response: any = await apiClient.get(`/question-bank/${id}`)
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: mapQuestion(response?.data ?? {}),
  }
}

/** AI 生成面试题目 */
export async function generateQuestions(data: GenerateQuestionsRequest): Promise<ApiResponse<GenerateQuestionsResult>> {
  // 前端字段 → 后端 DTO 字段适配
  const body: Record<string, unknown> = {
    position: data.position,
    difficulty: data.difficulty,
    count: data.count,
  }
  // types 数组 → 取第一个作为后端 type 字符串
  if (data.types && data.types.length > 0) {
    body.type = data.types[0]
  }
  // skills 数组 → 发送给后端以增强 AI 出题相关性
  if (data.skills && data.skills.length > 0) {
    body.skills = data.skills
  }

  const response: any = await apiClient.post('/question-bank/generate', body)
  const rawData = response?.data ?? {}
  const rawQuestions = Array.isArray(rawData.questions) ? rawData.questions : []
  return {
    code: response?.code ?? 0,
    message: response?.message ?? 'ok',
    data: {
      questions: rawQuestions.map(mapQuestion),
    },
  }
}
