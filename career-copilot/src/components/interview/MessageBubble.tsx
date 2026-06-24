import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import type { InterviewMessage } from '@/types/interview'
import { useStreamingText } from '@/hooks/useStreamingText'
import StarRating from './StarRating'

export interface MessageBubbleProps {
  message: InterviewMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isAI = message.role === 'ai' || message.role === 'assistant'
  const streamingText = useStreamingText(isStreaming ? message.content : '', 25)

  const displayContent = isStreaming ? streamingText : message.content
  const isComplete = !isStreaming || streamingText.length >= message.content.length
  const formattedTime = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`message-row ${isAI ? 'ai' : 'user'}`}>
      <div className="message-avatar">
        {isAI ? <RobotOutlined /> : <UserOutlined />}
      </div>
      <div className={`message-bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
        {isAI && (
          <div className="message-sender">AI 面试官</div>
        )}
        <div className="message-content">
          {displayContent.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p> /*\u00A0可以防止单词或数字在换行时被分隔*/
          ))}
          {isStreaming && !isComplete && (
            <span className="streaming-cursor">|</span>
          )}
        </div>
        <div className="message-footer">
          {isAI && message.rating != null && <StarRating rating={message.rating / 20} />}
          <span className="message-time">{formattedTime}</span>
        </div>
      </div>
    </div>
  )
}
