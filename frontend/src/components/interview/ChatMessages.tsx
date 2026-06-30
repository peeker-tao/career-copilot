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
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={msg.id === aiStreamingId}
          instantStreaming={instantStreaming}
          onRetry={onRetry}
          voiceInterviewMode={voiceInterviewMode}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
