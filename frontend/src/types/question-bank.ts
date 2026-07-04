/** 题型 */
export type QuestionType = 'choice' | 'short_answer' | 'coding'

/** 题目难度 */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

/** 题目选项（仅选择题） */
export interface QuestionOption {
  label: string
  text: string
}

/** 题库题目 */
export interface QuestionBankItem {
  id: string
  question: string
  type: QuestionType
  category: string
  difficulty: QuestionDifficulty
  tags: string[]
  options?: QuestionOption[]
  answer?: string
  hint?: string
}

/** 题库分类 */
export interface QuestionCategory {
  name: string
  count: number
}

/** AI 生成题目请求
 *  - skills / types 会在 API 层自动映射为后端 DTO 兼容格式
 */
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
