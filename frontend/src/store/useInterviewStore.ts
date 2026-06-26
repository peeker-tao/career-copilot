import { create } from 'zustand'
import type { Interview, InterviewMessage, InterviewReport } from '@/types/interview'
import type { SubmitAnswerResult } from '@/types/interview'
import type { InterviewStats } from '@/components/interview/HistoryStats'
import * as interviewApi from '@/api/interviews'
import { toast } from '@/store/useToastStore'

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
  report: InterviewReport | null

  // Pagination state
  total: number
  currentPage: number
  pageSize: number
  totalPages: number

  // 全量统计（不从当前页推算）
  stats: InterviewStats | null

  // WebSocket mode — true 时 sendMessage 走 WS 流式通道
  useWebSocket: boolean

  // Actions — REST / Shared
  fetchInterviews: (page?: number, limit?: number) => Promise<void>
  fetchInterview: (id: string) => Promise<void>
  startInterview: (position: string, difficulty: string) => Promise<string | null>
  loadMessages: (id: string) => Promise<void>
  sendMessage: (interviewId: string, content: string) => Promise<void>
  finishInterview: (interviewId: string) => Promise<void>
  fetchReport: (interviewId: string) => Promise<void>
  deleteInterview: (id: string) => Promise<void>
  clearError: () => void
  resetRoom: () => void

  // Actions — WebSocket
  setUseWebSocket: (enabled: boolean) => void
  appendWSChunk: (messageId: string, chunk: string) => void
  finalizeWSMessage: (data: {
    messageId: string
    fullContent: string
    feedback: string
    score: number
    strengths: string[]
    weaknesses: string[]
    isFollowUp: boolean
    nextAction: string
    followUpContent: string | null
    nextQuestion: string | null
  }) => void
  handleWSError: (code: number, message: string) => void
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
  total: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
  stats: null,
  useWebSocket: false,
  report: null,

  fetchInterviews: async (page = 1, limit = 10) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.getInterviews({ page, limit })
      set({
        interviews: res.data.items,
        total: res.data.total,
        currentPage: res.data.page,
        pageSize: res.data.limit,
        totalPages: res.data.totalPages,
        loading: false,
      })
      // 拉全量数据计算统计（数量已知，避免当前页推算不准）
      if (res.data.total > 0) {
        interviewApi.getInterviews({ limit: res.data.total }).then((allRes) => {
          const all = allRes.data.items
          const completed = all.filter((i: Interview) => i.status === 'completed')
          const scores = completed.map((i: Interview) => i.score ?? 0).filter((s: number) => s > 0)
          set({
            stats: {
              total: all.length,
              completed: completed.length,
              avgScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
              bestScore: scores.length ? Math.max(...scores) : 0,
            },
          })
        }).catch(() => {})
      }
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

    // WebSocket 模式：只添加用户消息，实际发送由 useInterviewWebSocket hook 处理
    if (useInterviewStore.getState().useWebSocket) {
      return
    }

    // REST 模式（原有逻辑）
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
      // 自动生成报告
      try {
        const reportRes = await interviewApi.getInterviewReport(interviewId)
        if (reportRes.data) {
          set({ report: reportRes.data })
        }
      } catch {
        // 报告生成失败不阻塞流程
      }
    } catch (err) {
      toast.error('标记面试完成失败: ' + (err as Error).message)
    }
  },

  fetchReport: async (interviewId) => {
    try {
      const reportRes = await interviewApi.getInterviewReport(interviewId)
      if (reportRes.data) {
        set({ report: reportRes.data })
      }
    } catch {
      // 静默失败，用户点击查看报告时再重试
    }
  },

  deleteInterview: async (id) => {
    set({ loading: true, error: null })
    try {
      await interviewApi.deleteInterview(id)
      // 删除后重新获取当前页，若当前页空了则回退一页
      const state = useInterviewStore.getState()
      const page = state.interviews.length <= 1 && state.currentPage > 1
        ? state.currentPage - 1
        : state.currentPage
      await useInterviewStore.getState().fetchInterviews(page)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
  resetRoom: () =>
    set({
      interview: null,
      currentMessages: [],
      isFinished: false,
      streamingId: null,
      aiResponding: false,
      useWebSocket: false,
      report: null,
    }),

  /* ══════════════════════════════════════════════
     WebSocket Actions
     ══════════════════════════════════════════════ */

  setUseWebSocket: (enabled) => set({ useWebSocket: enabled }),

  /**
   * 追加 WebSocket 流式文本块
   * - 第一个 chunk 创建新的 AI 消息
   * - 后续 chunk 追加到同一条消息的内容末尾
   */
  appendWSChunk: (messageId, chunk) => {
    set((state) => {
      const existingIdx = state.currentMessages.findIndex((m) => m.id === messageId)
      if (existingIdx >= 0) {
        // 追加到已有消息
        const updated = [...state.currentMessages]
        updated[existingIdx] = {
          ...updated[existingIdx],
          content: updated[existingIdx].content + chunk,
        }
        return { currentMessages: updated, streamingId: messageId }
      }
      // 第一个 chunk：新建消息
      const newMsg: InterviewMessage = {
        id: messageId,
        role: 'assistant',
        content: chunk,
        timestamp: new Date().toISOString(),
        rating: null,
      }
      return {
        currentMessages: [...state.currentMessages, newMsg],
        streamingId: messageId,
      }
    })
  },

  /**
   * WebSocket 流式传输完成 — 替换为最终内容，处理面试结束
   */
  finalizeWSMessage: (data) => {
    set((state) => {
      const messages = [...state.currentMessages]
      // 用完整内容替换流式消息
      const idx = messages.findIndex((m) => m.id === data.messageId)
      if (idx >= 0) {
        messages[idx] = {
          ...messages[idx],
          content: data.fullContent,
          rating: data.score,
        }
      }

      // 如果是追问，追加追问内容
      if (data.isFollowUp && data.followUpContent) {
        messages.push({
          id: `ai-followup-${Date.now()}`,
          role: 'assistant',
          content: data.followUpContent,
          timestamp: new Date().toISOString(),
          rating: null,
        })
      }

      return {
        currentMessages: messages,
        aiResponding: false,
        streamingId: null,
        isFinished: data.nextAction === 'complete',
      }
    })
  },

  /**
   * WebSocket 错误处理
   */
  handleWSError: (code, message) => {
    if (code === 400 && (message.includes('已结束') || message.includes('已完成'))) {
      set({ isFinished: true, aiResponding: false, streamingId: null })
    } else {
      toast.error(`面试错误 [${code}]: ${message}`)
      set({ aiResponding: false, streamingId: null })
    }
  },
}))
