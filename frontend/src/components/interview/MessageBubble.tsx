import { useState } from 'react'
import { RobotOutlined, UserOutlined, SoundOutlined, LoadingOutlined } from '@ant-design/icons'
import type { InterviewMessage } from '@/types/interview'
import { useStreamingText } from '@/hooks/useStreamingText'
import StarRating from './StarRating'

export interface MessageBubbleProps {
  message: InterviewMessage
  isStreaming?: boolean
  /** true=实时流式(WebSocket)，直接展示；false/undefined=打字机动画(REST) */
  instantStreaming?: boolean
}

/** 安全解析时间戳，兼容 ISO 字符串、MySQL datetime 等格式 */
function safeFormatTime(timestamp: string): string {
  if (!timestamp) return ''
  // 尝试直接解析
  let d = new Date(timestamp)
  // MySQL datetime 格式 "2026-06-27 10:00:00" 在部分浏览器解析失败，替换 T 后重试
  if (isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(timestamp)) {
    d = new Date(timestamp.replace(' ', 'T') + '+08:00')
  }
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isStreaming, instantStreaming }: MessageBubbleProps) {
  const isAI = message.role === 'ai' || message.role === 'assistant'
  const isVoice = message.type === 'voice' && !!message.audioUrl
  const [voicePlaying, setVoicePlaying] = useState(false)

  // WebSocket 真实流式：speed=0 即时展示；REST 假流式：speed=25 打字机效果
  const streamingSpeed = instantStreaming ? 0 : 25
  const streamingText = useStreamingText(isStreaming ? message.content : '', streamingSpeed)

  const displayContent = isStreaming ? streamingText : message.content
  const isComplete = !isStreaming || streamingText.length >= message.content.length
  const formattedTime = safeFormatTime(message.timestamp)

  const handlePlayVoice = () => {
    if (!message.audioUrl) return
    const audio = new Audio(message.audioUrl)
    ;(window as any).__currentVoiceAudio?.pause()
    ;(window as any).__currentVoiceAudio = audio
    setVoicePlaying(true)
    audio.onended = () => setVoicePlaying(false)
    audio.onerror = () => setVoicePlaying(false)
    audio.play()
  }

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
            <p key={i}>{line || '\u00A0'}</p>
          ))}
          {isStreaming && !isComplete && (
            <span className="streaming-cursor">|</span>
          )}
        </div>
        {isVoice && (
          <button
            className="btn-play-voice"
            onClick={handlePlayVoice}
            disabled={voicePlaying}
            title="播放语音"
          >
            {voicePlaying ? <LoadingOutlined /> : <SoundOutlined />}
            <span className="voice-label">播放语音</span>
          </button>
        )}
        <div className="message-footer">
          {isAI && message.rating != null && <StarRating rating={message.rating / 20} />}
          <span className="message-time">{formattedTime}</span>
        </div>
      </div>
    </div>
  )
}
