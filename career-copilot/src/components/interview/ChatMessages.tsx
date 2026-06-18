import { useRef, useEffect } from 'react'
import { RobotOutlined } from '@ant-design/icons'
import type { InterviewMessage } from '@/types/interview'
import { EmptyState } from '@/components/common'
import MessageBubble from './MessageBubble'

export interface ChatMessagesProps {
  messages: InterviewMessage[]
  aiStreamingId?: string | null
}

export default function ChatMessages({ messages, aiStreamingId }: ChatMessagesProps) {
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
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
