import { create } from 'zustand'
import type { Interview, InterviewMessage } from '@/types/interview'
import type { SubmitAnswerResult } from '@/types/interview'
import * as interviewApi from '@/api/interviews'

interface InterviewState {
  // State
  interviews: Interview[]
  interview: Interview | null
  currentMessages: InterviewMessage[]
  streamingId: string | null
  aiResponding: boolean
  isFinished: boolean
  loading: boolean
  error: string | null

  // Actions
  fetchInterviews: () => Promise<void>
  fetchInterview: (id: string) => Promise<void>
  startInterview: (position: string, difficulty: string) => Promise<string | null>
  loadMessages: (id: string) => Promise<void>
  sendMessage: (interviewId: string, content: string) => Promise<void>
  finishInterview: (interviewId: string) => Promise<void>
  deleteInterview: (id: string) => Promise<void>
  clearError: () => void
  resetRoom: () => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  interviews: [],
  interview: null,
  currentMessages: [],
  streamingId: null,
  aiResponding: false,
  isFinished: false,
  loading: false,
  error: null,

  fetchInterviews: async () => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.getInterviews()
      const interviews = Array.isArray(res.data) ? res.data : []
      set({ interviews, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchInterview: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.getInterviewById(id)
      const interview = res.data
      set({
        interview,
        loading: false,
        isFinished: interview.status === 'completed',
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  startInterview: async (position, difficulty) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.createInterview({
        targetPosition: position,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
      })
      set({ loading: false, isFinished: false, currentMessages: [] })
      return res.data.id
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  loadMessages: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.getInterviewMessages(id)
      set({ currentMessages: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  sendMessage: async (interviewId, content) => {
    const userMsg: InterviewMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      rating: null,
    }

    set((state) => ({
      currentMessages: [...state.currentMessages, userMsg],
      aiResponding: true,
    }))

    try {
      const res = await interviewApi.submitAnswer(interviewId, content)
      const result: SubmitAnswerResult = res.data

      if (result.isComplete) {
        set({ isFinished: true })
      }

      const newAIMsgs: InterviewMessage[] = []

      // 1. 先展示 AI 对回答的点评
      if (result.evaluation?.feedback) {
        newAIMsgs.push({
          id: `ai-feedback-${Date.now()}`,
          role: 'ai',
          content: result.evaluation.feedback,
          timestamp: new Date().toISOString(),
          rating: result.evaluation.score,
        })
      }

      // 2. 再展示下一道题
      if (result.nextQuestion) {
        newAIMsgs.push({
          id: `ai-question-${Date.now() + 1}`,
          role: 'ai',
          content: result.nextQuestion.content,
          timestamp: new Date().toISOString(),
          rating: null,
          questionType: result.nextQuestion.questionType,
        })
      }

      if (newAIMsgs.length > 0) {
        const lastMsg = newAIMsgs[newAIMsgs.length - 1]

        set((state) => ({
          currentMessages: [...state.currentMessages, ...newAIMsgs],
          streamingId: lastMsg.id,
          aiResponding: false,
        }))

        // 流式打字机效果（只对最后一条 AI 消息）
        setTimeout(() => {
          set({ streamingId: null })
        }, lastMsg.content.length * 25 + 500)
      } else {
        set({ aiResponding: false, streamingId: null })
      }
    } catch (err) {
      const msg = (err as Error).message || ''
      // 后端 400 表示面试已结束（题目答完或已被用户结束），不视为错误
      if (msg.includes('面试已结束') || msg.includes('已完成')) {
        set({ isFinished: true, aiResponding: false })
      } else {
        set({ error: msg, aiResponding: false })
      }
    }
  },

  finishInterview: async (interviewId) => {
    set({ isFinished: true })
    try {
      await interviewApi.completeInterview(interviewId)
    } catch (err) {
      console.warn('标记面试完成失败:', err)
    }
  },

  deleteInterview: async (id) => {
    set({ loading: true, error: null })
    try {
      await interviewApi.deleteInterview(id)
      set((state) => ({
        interviews: state.interviews.filter((i) => i.id !== id),
        loading: false,
      }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
  resetRoom: () => set({ interview: null, currentMessages: [], isFinished: false, streamingId: null, aiResponding: false }),
}))
