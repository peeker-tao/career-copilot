import { create } from 'zustand'
import type { Interview, InterviewMessage } from '@/types/interview'
import * as interviewApi from '@/api/interviews'

interface InterviewState {
  // State
  interviews: Interview[]
  currentMessages: InterviewMessage[]
  streamingId: string | null
  aiResponding: boolean
  isFinished: boolean
  loading: boolean
  error: string | null

  // Actions
  fetchInterviews: () => Promise<void>
  startInterview: (position: string, difficulty: string) => Promise<string | null>
  loadMessages: (id: string) => Promise<void>
  sendMessage: (interviewId: string, content: string) => Promise<void>
  finishInterview: () => void
  clearError: () => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  interviews: [],
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
      set({ interviews: res.data, loading: false })
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

      // 模拟流式输出
      const aiMsg = res.data
      set((state) => ({
        currentMessages: [...state.currentMessages, aiMsg],
        streamingId: aiMsg.id,
        aiResponding: false,
      }))

      // 延迟清除流式 ID（模拟打字机完成）
      setTimeout(() => {
        set({ streamingId: null })
      }, aiMsg.content.length * 30 + 500)
    } catch (err) {
      set({ error: (err as Error).message, aiResponding: false })
    }
  },

  finishInterview: () => {
    set({ isFinished: true })
  },

  clearError: () => set({ error: null }),
}))
