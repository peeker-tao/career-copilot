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
}

export default function ChatMessages({ messages, aiStreamingId, instantStreaming }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-messages">
      {messages.length === 0 && (
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
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
