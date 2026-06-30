/** 题型 */
export type QuestionType = 'choice' | 'short_answer' | 'coding'

/** 题目难度 */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

/** 题库题目 */
export interface QuestionBankItem {
  id: string
  question: string
  type: QuestionType
  category: string
  difficulty: QuestionDifficulty
  tags: string[]
  options?: string[]
  answer?: string
  hint?: string
}

/** 题库分类 */
export interface QuestionCategory {
  name: string
  count: number
}

/** AI 生成题目请求 */
export interface GenerateQuestionsRequest {
  position: string
  skills: string[]
  difficulty?: QuestionDifficulty
  count?: number
  types?: QuestionType[]
}

/** AI 生成题目结果 */
export interface GenerateQuestionsResult {
  questions: QuestionBankItem[]
}
