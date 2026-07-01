import { useRef, useEffect } from 'react'
import { RobotOutlined } from '@ant-design/icons'
import type { InterviewMessage } from '@/types/interview'
import { EmptyState } from '@/components/common'
import MessageBubble from './MessageBubble'

export interface ChatMessagesProps {
  messages: InterviewMessage[]
  aiStreamingId?: string | null
  /** true=实时流式(WebSocket)，直接展示；false/undefined=打字机动画(REST) */
  instantStreaming?: boolean
  /** 重试发送失败的消息 */
  onRetry?: (message: InterviewMessage) => void
  /** 语音面试模式：AI 消息显示 TTS 播放按钮 */
  voiceInterviewMode?: boolean
  /** 首题加载失败时重试 */
  onRetryLoadMessages?: () => void
  /** 是否正在加载消息 */
  loading?: boolean
}

/** 从消息列表中提取上一条用户消息的评价信息，供 AI 消息展示 */
function getPrevUserEval(messages: InterviewMessage[], currentIdx: number) {
  // 从 currentIdx 往前找最近一条 role=user 的消息
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].feedback) {
      return {
        feedback: messages[i].feedback,
        rating: messages[i].rating,
        strengths: messages[i].strengths,
        weaknesses: messages[i].weaknesses,
      }
    }
    // 遇到上一条 AI 消息就停止（避免跨题匹配）
    if (messages[i].role === 'assistant' || messages[i].role === 'ai') break
  }
  return null
}

export default function ChatMessages({ messages, aiStreamingId, instantStreaming, onRetry, voiceInterviewMode, onRetryLoadMessages, loading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-messages">
      {messages.length === 0 && !loading && (
        <EmptyState
          icon={<RobotOutlined />}
          title="暂无面试题目"
          description="首题生成可能失败，请点击下方按钮重试"
          size="small"
          className="pt-80"
          actionText={onRetryLoadMessages ? '重新加载' : undefined}
          onAction={onRetryLoadMessages}
        />
      )}
      {messages.length === 0 && loading && (
        <EmptyState
          icon={<RobotOutlined />}
          title="正在准备面试题目..."
          size="small"
          className="pt-80"
        />
      )}
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={msg.id === aiStreamingId}
          instantStreaming={instantStreaming}
          onRetry={onRetry}
          voiceInterviewMode={voiceInterviewMode}
          prevUserEval={msg.role === 'ai' || msg.role === 'assistant' ? getPrevUserEval(messages, idx) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
