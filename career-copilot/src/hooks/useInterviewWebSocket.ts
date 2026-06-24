import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from '@/store/useToastStore'

// WebSocket 事件回调类型
export interface InterviewWSCallbacks {
  onChunk: (messageId: string, chunk: string) => void
  onDone: (data: {
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
  onError: (code: number, message: string) => void
}

type UseInterviewWebSocketOptions = {
  interviewId: string | undefined
  enabled: boolean
} & InterviewWSCallbacks

export function useInterviewWebSocket({
  interviewId,
  enabled,
  onChunk,
  onDone,
  onError,
}: UseInterviewWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !interviewId) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('未登录，无法连接面试服务')
      return
    }

    // 连接 Socket.IO — namespace /ws/interview，经 Vite proxy → NestJS
    const socket = io('/ws/interview', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('🔌 WebSocket 已连接:', socket.id)
      setConnected(true)
    })

    socket.on('ai_message_chunk', (data: { messageId: string; chunk: string }) => {
      onChunk(data.messageId, data.chunk)
    })

    socket.on('ai_message_done', (data: {
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
    }) => {
      onDone(data)
    })

    socket.on('error', (data: { code: number; message: string }) => {
      onError(data.code, data.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket 已断开:', reason)
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket 连接失败:', err.message)
      toast.error('面试服务连接失败，请检查后端是否启动')
      setConnected(false)
    })

    socketRef.current = socket

    return () => {
      console.log('🧹 清理 WebSocket 连接')
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, enabled])

  const sendAnswer = useCallback(
    (content: string) => {
      if (socketRef.current?.connected && interviewId) {
        socketRef.current.emit('user_answer', { interviewId, content })
      } else {
        toast.error('面试连接已断开，请刷新页面重试')
      }
    },
    [interviewId],
  )

  return { sendAnswer, connected }
}
