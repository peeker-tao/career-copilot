import { create } from 'zustand'
import type { Interview, InterviewMessage, InterviewReport, MessageType } from '@/types/interview'
import type { InterviewStats } from '@/components/interview/HistoryStats'
import * as interviewApi from '@/api/interviews'
import { toast } from '@/store/useToastStore'

/** 后端返回的 referenceAnswer 是字符串，前端需要归一化为 string[] */
function normalizeReferenceAnswer(val: unknown): string[] | undefined {
  if (Array.isArray(val)) return val.length > 0 ? val : undefined
  if (typeof val === 'string' && val.trim()) {
    // 按换行或数字序号分割，兼容多种格式
    return val.split('\n').map(s => s.trim()).filter(Boolean)
  }
  return undefined
}

/** aiResponding 自动复位定时器：防止因 WS/REST 未返回导致界面永久卡死 */
let aiRespondingTimer: ReturnType<typeof setTimeout> | null = null
function resetAiRespondingTimer() {
  if (aiRespondingTimer) clearTimeout(aiRespondingTimer)
  aiRespondingTimer = setTimeout(() => {
    const state = useInterviewStore.getState()
    if (state.aiResponding) {
      console.warn('[aiResponding] 60s 超时，自动复位')
      useInterviewStore.setState({ aiResponding: false })
    }
  }, 60000)
}
function clearAiRespondingTimer() {
  if (aiRespondingTimer) {
    clearTimeout(aiRespondingTimer)
    aiRespondingTimer = null
  }
}

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
  startInterview: (position: string, difficulty: string, resumeId?: string) => Promise<string | null>
  loadMessages: (id: string) => Promise<void>
  /** 本地添加消息（同步，永远成功），返回消息 id */
  addMessage: (content: string, type?: MessageType, audioUrl?: string) => string
  /** 发送消息（异步），只更新已有消息的状态 */
  sendMessage: (interviewId: string, msgId: string, content: string, type?: MessageType, audioUrl?: string, audioBlob?: Blob, forceRest?: boolean) => Promise<void>
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
    nextQuestionReferenceAnswer?: string[] | null
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

  startInterview: async (position, difficulty, resumeId) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.createInterview({
        targetPosition: position,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        resumeId,
      })
      // 📋 对话日志：创建面试结果
      console.groupCollapsed(`[对话] 创建面试 结果 (${res.data.id})`)
      console.log('岗位:', position)
      console.log('难度:', difficulty)
      console.log('简历:', resumeId || '无')
      console.log('响应:', res)
      console.groupEnd()

      set({ loading: false, isFinished: false, currentMessages: [] })
      return res.data.id
    } catch (err) {
      const msg = (err as Error).message || '面试创建失败'
      console.error(`[对话] 创建面试失败:`, msg)
      set({ error: msg, loading: false })
      throw err
    }
  },

  loadMessages: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await interviewApi.getInterviewMessages(id)
      // 📋 对话日志：加载历史消息
      console.groupCollapsed(`[对话] 加载消息 (${id})`)
      console.log('消息数:', res.data?.length ?? 0)
      if (res.data?.length) {
        res.data.forEach((m, i) => {
          console.log(`[${i}] ${m.role}: ${(m.content || '').slice(0, 60)}${m.content?.length > 60 ? '...' : ''}`, m)
        })
      }
      console.groupEnd()
      const messages = Array.isArray(res.data) ? res.data : [];
      // 归一化 referenceAnswer（后端存的是字符串，前端需要 string[]）
      const normalized = messages.map((m) => ({
        ...m,
        referenceAnswer: normalizeReferenceAnswer(m.referenceAnswer),
      }))
      set({ currentMessages: normalized, loading: false })
    } catch (err) {
      console.error(`[对话] 加载消息失败 (${id}):`, (err as Error).message)
      set({ error: (err as Error).message, loading: false })
    }
  },

  /** 本地添加消息（同步，永远成功），返回消息 id */
  addMessage: (content, type, audioUrl) => {
    const id = `user-${Date.now()}`
    const msg: InterviewMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      rating: null,
      type: type || 'text',
      audioUrl: audioUrl,
      status: 'sending',
    }
    set((state) => ({
      currentMessages: [...state.currentMessages, msg],
      aiResponding: true,
    }))
    // 安全网：60s 后自动复位 aiResponding（防止 WS/REST 未返回导致界面卡死）
    resetAiRespondingTimer()
    return id
  },

  /** 发送消息（异步）：用 msgId 找到已有消息并更新其状态 */
  sendMessage: async (interviewId, msgId, content, type, audioUrl, audioBlob, forceRest) => {
    // WebSocket 模式：实际发送由 useInterviewWebSocket hook 处理，这里只标记 sent
    // 除非 forceRest=true（例如 WS 未连接时的降级）
    if (useInterviewStore.getState().useWebSocket && !forceRest) {
      set((state) => ({
        currentMessages: state.currentMessages.map((m) =>
          m.id === msgId ? { ...m, status: 'sent' as const } : m
        ),
      }))
      return
    }

    try {
      // 纯语音消息（无识别文本）：不调后端，仅标记 sent
      if (type === 'voice' && !content.trim()) {
        set((state) => ({
          currentMessages: state.currentMessages.map((m) =>
            m.id === msgId ? { ...m, status: 'sent' as const } : m
          ),
          aiResponding: false,
        }))
        return
      }

      // 文字/语音消息：提交回答
      const res = await interviewApi.submitAnswer(interviewId, content)
      const result = res.data
      const recognizedText = content

      // 📋 对话日志：提交回答后的完整响应（可折叠）
      console.groupCollapsed(`[对话] submitAnswer 响应 (${interviewId})`)
      console.log('原始响应:', res)
      console.log('评估(score):', result.evaluation?.score)
      console.log('评估(feedback):', result.evaluation?.feedback)
      console.log('评估(strengths):', result.evaluation?.strengths)
      console.log('评估(weaknesses):', result.evaluation?.weaknesses)
      console.log('下一题:', result.nextQuestion?.content)
      console.log('题型:', result.nextQuestion?.questionType)
      console.log('参考答案:', result.nextQuestion?.referenceAnswer)
      console.log('isComplete:', result.isComplete)
      console.groupEnd()

      if (result.isComplete) {
        set({ isFinished: true })
      }

      // 更新用户消息：用识别文本替换内容，标记为 sent
      set((state) => ({
        currentMessages: state.currentMessages.map((m) =>
          m.id === msgId
            ? { ...m, content: recognizedText, status: 'sent' as const }
            : m
        ),
      }))

      // 评价+对话+答案模式：合并为一条 AI 消息
      // content 只放下一题内容；若追问内容与 feedback 相同则跳过（避免重复）
      const qContent = (result.nextQuestion?.content || '').trim()
      const fbContent = (result.evaluation?.feedback || '').trim()
      const hasScore = result.evaluation?.score != null
      const aiContent = qContent && qContent !== fbContent ? qContent : (fbContent || '')
      // 无任何内容 → 不添加空白消息，仅复位状态并发出警告
      if (!aiContent && !hasScore) {
        console.warn('[sendMessage] AI 返回空内容，跳过添加消息')
        clearAiRespondingTimer()
        set({ aiResponding: false, streamingId: null })
        return
      }
      const aiMsg: InterviewMessage = {
        id: `ai-response-${Date.now()}`,
        role: 'ai',
        content: aiContent,
        timestamp: new Date().toISOString(),
        rating: result.evaluation?.score ?? null,
        questionType: result.nextQuestion?.questionType,
        feedback: result.evaluation?.feedback || undefined,
        referenceAnswer: normalizeReferenceAnswer(result.nextQuestion?.referenceAnswer),
      }

      clearAiRespondingTimer()
      set((state) => ({
        currentMessages: [...state.currentMessages, aiMsg],
        streamingId: aiMsg.id,
        aiResponding: false,
      }))

      // 流式打字机效果
      setTimeout(() => {
        set({ streamingId: null })
      }, aiMsg.content.length * 25 + 500)
    } catch (err) {
      const msg = (err as Error).message || ''
      // 后端 400 表示面试已结束，不视为错误
      if (msg.includes('面试已结束') || msg.includes('已完成')) {
        set({ isFinished: true, aiResponding: false })
      } else if (/timeout|timed out|超时/i.test(msg)) {
        // AI 超时：标记为失败，显示超时提示
        set((state) => ({
          currentMessages: state.currentMessages.map((m) =>
            m.id === msgId ? { ...m, status: 'failed' as const } : m
          ),
          error: '⏱️ AI 响应超时，请稍后重试',
          aiResponding: false,
        }))
        toast.error('⏱️ AI 响应超时，请点击失败消息上的重试按钮重新发送')
      } else {
        // 标记用户消息为失败（消息本身永远留在列表中）
        set((state) => ({
          currentMessages: state.currentMessages.map((m) =>
            m.id === msgId ? { ...m, status: 'failed' as const } : m
          ),
          error: msg,
          aiResponding: false,
        }))
      }
    }
  },

  finishInterview: async (interviewId) => {
    console.groupCollapsed(`[对话] 结束面试 (${interviewId})`)
    console.log('开始结束面试')
    set({ isFinished: true })
    try {
      await interviewApi.completeInterview(interviewId)
      console.log('标记完成成功')
      // 自动生成报告
      try {
        const reportRes = await interviewApi.getInterviewReport(interviewId)
        if (reportRes.data) {
          console.log('报告:', reportRes.data)
          set({ report: reportRes.data })
        }
      } catch {
        console.warn('报告获取失败（不阻塞）')
      }
      console.groupEnd()
    } catch (err) {
      console.error('标记面试完成失败:', (err as Error).message)
      console.groupEnd()
      toast.error('标记面试完成失败: ' + (err as Error).message)
    }
  },

  fetchReport: async (interviewId) => {
    console.groupCollapsed(`[对话] 获取报告 (${interviewId})`)
    try {
      const reportRes = await interviewApi.getInterviewReport(interviewId)
      if (reportRes.data) {
        console.log('报告数据:', reportRes.data)
        set({ report: reportRes.data })
      }
      console.groupEnd()
    } catch {
      console.warn('报告获取失败（静默）')
      console.groupEnd()
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
  resetRoom: () => {
    clearAiRespondingTimer()
    set({
      interview: null,
      currentMessages: [],
      isFinished: false,
      streamingId: null,
      aiResponding: false,
      useWebSocket: false,
      report: null,
    })
  },

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
    console.groupCollapsed(`[对话] WS chunk (${messageId})`)
    console.log('chunk:', chunk)
    console.groupEnd()
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
    // 📋 对话日志：WebSocket 完整响应（可折叠）
    console.groupCollapsed(`[对话] WS 消息完成 (${data.messageId})`)
    console.log('fullContent:', data.fullContent)
    console.log('feedback:', data.feedback)
    console.log('score:', data.score)
    console.log('strengths:', data.strengths)
    console.log('weaknesses:', data.weaknesses)
    console.log('isFollowUp:', data.isFollowUp)
    console.log('followUpContent:', data.followUpContent)
    console.log('nextQuestion:', data.nextQuestion)
    console.log('nextAction:', data.nextAction)
    console.log('参考回答:', data.nextQuestionReferenceAnswer)
    console.groupEnd()

    clearAiRespondingTimer()
    set((state) => {
      const messages = [...state.currentMessages]
      // 用完整内容替换流式消息，同时保存 feedback
      const idx = messages.findIndex((m) => m.id === data.messageId)
      if (idx >= 0) {
        // 评价+对话+答案模式：提取下一题内容作为消息文本（同 REST 模式行为）
        const qContent = (data.nextQuestion || '').trim()
        const fbContent = (data.feedback || '').trim()
        const msgContent = qContent && qContent !== fbContent ? qContent : ''

        messages[idx] = {
          ...messages[idx],
          content: msgContent,
          rating: data.score,
          feedback: data.feedback || undefined,
          referenceAnswer: normalizeReferenceAnswer(data.nextQuestionReferenceAnswer),
        }
      }

      // 如果是追问，追加追问内容为独立消息
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
    clearAiRespondingTimer()
    if (code === 400 && (message.includes('已结束') || message.includes('已完成'))) {
      set({ isFinished: true, aiResponding: false, streamingId: null })
    } else {
      toast.error(`面试错误 [${code}]: ${message}`)
      set({ aiResponding: false, streamingId: null })
    }
  },
}))
