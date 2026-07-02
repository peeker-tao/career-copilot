import { useState, useRef, useEffect } from 'react'
import { RobotOutlined, UserOutlined, LoadingOutlined, ExclamationCircleOutlined, PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons'
import type { InterviewMessage } from '@/types/interview'
import { useStreamingText } from '@/hooks/useStreamingText'
import { textToSpeech } from '@/api/voice'
import { useVoiceStore } from '@/store/useVoiceStore'
import { toast } from '@/store/useToastStore'
import StarRating from './StarRating'

export interface MessageBubbleProps {
  message: InterviewMessage
  isStreaming?: boolean
  /** true=实时流式(WebSocket)，直接展示；false/undefined=打字机动画(REST) */
  instantStreaming?: boolean
  /** 重试发送失败的消息 */
  onRetry?: (message: InterviewMessage) => void
  /** 语音面试模式：AI 消息显示 TTS 播放按钮 */
  voiceInterviewMode?: boolean
  /** 前一条用户回答的 AI 评价信息（在 AI 消息侧展示） */
  prevUserEval?: {
    feedback: string
    rating?: number | null
    strengths?: string[]
    weaknesses?: string[]
  } | null
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

export default function MessageBubble({ message, isStreaming, instantStreaming, onRetry, voiceInterviewMode, prevUserEval }: MessageBubbleProps) {
  const isAI = message.role === 'ai' || message.role === 'assistant'
  const isVoice = message.type === 'voice' && !!message.audioUrl
  const isFailed = message.status === 'failed'
  const isSending = message.status === 'sending'
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  // TTS 播放状态（语音面试模式）
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [ttsDuration, setTtsDuration] = useState(0)
  const [ttsCurrentTime, setTtsCurrentTime] = useState(0)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)
  const ttsAnimRef = useRef<number>(0)
  const [textExpanded, setTextExpanded] = useState(false)
  // 评价 TTS 播放状态
  const [evalTtsLoading, setEvalTtsLoading] = useState(false)
  const [evalTtsPlaying, setEvalTtsPlaying] = useState(false)
  const [evalTtsDuration, setEvalTtsDuration] = useState(0)
  const [evalTtsCurrentTime, setEvalTtsCurrentTime] = useState(0)
  // TTS 错误状态（用于按钮视觉反馈）
  const [ttsError, setTtsError] = useState(false)
  const [evalTtsError, setEvalTtsError] = useState(false)
  const evalTtsAudioRef = useRef<HTMLAudioElement | null>(null)
  const evalTtsAnimRef = useRef<number>(0)

  // WebSocket 真实流式：speed=0 即时展示；REST 假流式：speed=25 打字机效果
  const streamingSpeed = instantStreaming ? 0 : 25
  const streamingText = useStreamingText(isStreaming ? message.content : '', streamingSpeed)

  const displayContent = isStreaming ? streamingText : message.content
  const isComplete = !isStreaming || streamingText.length >= message.content.length
  const formattedTime = safeFormatTime(message.timestamp)

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      audioRef.current?.pause()
      if (ttsAnimRef.current) cancelAnimationFrame(ttsAnimRef.current)
      ttsAudioRef.current?.pause()
      if (evalTtsAnimRef.current) cancelAnimationFrame(evalTtsAnimRef.current)
      evalTtsAudioRef.current?.pause()
    }
  }, [])

  const updateProgress = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    if (audio.currentTime < audio.duration) {
      animFrameRef.current = requestAnimationFrame(updateProgress)
    }
  }

  const handlePlayVoice = () => {
    if (!message.audioUrl) return
    const prev = (window as any).__currentVoiceAudio
    if (prev && prev !== audioRef.current) {
      prev.pause()
      // 触发其他 voice 条的同步
      const evt = new CustomEvent('voice-stopped', { detail: prev })
      window.dispatchEvent(evt)
    }
    if (audioRef.current && voicePlaying) {
      audioRef.current.pause()
      setVoicePlaying(false)
      cancelAnimationFrame(animFrameRef.current)
      return
    }
    if (!audioRef.current) {
      const audio = new Audio(message.audioUrl)
      audioRef.current = audio
      audio.onloadedmetadata = () => setVoiceDuration(audio.duration)
      audio.onended = () => { setVoicePlaying(false); setCurrentTime(0) }
      audio.onerror = () => { setVoicePlaying(false); setCurrentTime(0) }
    }
    ;(window as any).__currentVoiceAudio = audioRef.current
    audioRef.current.play()
    setVoicePlaying(true)
    animFrameRef.current = requestAnimationFrame(updateProgress)
  }

  /** TTS 播放进度更新 */
  const updateTtsProgress = () => {
    const audio = ttsAudioRef.current
    if (!audio) return
    setTtsCurrentTime(audio.currentTime)
    if (audio.currentTime < audio.duration) {
      ttsAnimRef.current = requestAnimationFrame(updateTtsProgress)
    }
  }

  /** 语音面试模式：播放/暂停 AI 消息的 TTS 语音 */
  const handleTtsPlay = async () => {
    if (!message.content.trim()) return
    // 如果已有音频且正在播放，暂停
    if (ttsAudioRef.current && ttsPlaying) {
      ttsAudioRef.current.pause()
      setTtsPlaying(false)
      cancelAnimationFrame(ttsAnimRef.current)
      return
    }
    // 如果已有音频但已暂停，恢复播放
    if (ttsAudioRef.current && !ttsPlaying) {
      ttsAudioRef.current.play()
      setTtsPlaying(true)
      ttsAnimRef.current = requestAnimationFrame(updateTtsProgress)
      return
    }
    // 否则生成新的 TTS 音频
    setTtsLoading(true)
    try {
      // 使用用户选中的音色
      const selectedVoice = useVoiceStore.getState().settings.voice
      const res = await textToSpeech(message.content, selectedVoice)
      const audio = new Audio(res.data.audioUrl)
      ttsAudioRef.current = audio
      audio.onloadedmetadata = () => setTtsDuration(audio.duration)
      audio.onended = () => { setTtsPlaying(false); setTtsCurrentTime(0) }
      audio.onerror = () => { setTtsPlaying(false); setTtsCurrentTime(0); setTtsLoading(false) }
      setTtsLoading(false)
      audio.play()
      setTtsPlaying(true)
      ttsAnimRef.current = requestAnimationFrame(updateTtsProgress)
    } catch (err) {
      setTtsLoading(false)
      setTtsError(true)
      setTimeout(() => setTtsError(false), 3000)
      const msg = err instanceof Error ? err.message : 'TTS 播放失败'
      toast.error(msg, 4000)
    }
  }

  /** 评价 TTS 播放进度更新 */
  const updateEvalTtsProgress = () => {
    const audio = evalTtsAudioRef.current
    if (!audio) return
    setEvalTtsCurrentTime(audio.currentTime)
    if (audio.currentTime < audio.duration) {
      evalTtsAnimRef.current = requestAnimationFrame(updateEvalTtsProgress)
    }
  }

  /** 播放/暂停评价 TTS 语音 */
  const handleEvalTtsPlay = async () => {
    const text = prevUserEval?.feedback
    if (!text?.trim()) return
    // 如果主 TTS 正在播放，先暂停
    if (ttsAudioRef.current && ttsPlaying) {
      ttsAudioRef.current.pause()
      setTtsPlaying(false)
      cancelAnimationFrame(ttsAnimRef.current)
    }
    // 如果已有评价音频且正在播放，暂停
    if (evalTtsAudioRef.current && evalTtsPlaying) {
      evalTtsAudioRef.current.pause()
      setEvalTtsPlaying(false)
      cancelAnimationFrame(evalTtsAnimRef.current)
      return
    }
    // 如果已有评价音频但已暂停，恢复播放
    if (evalTtsAudioRef.current && !evalTtsPlaying) {
      evalTtsAudioRef.current.play()
      setEvalTtsPlaying(true)
      evalTtsAnimRef.current = requestAnimationFrame(updateEvalTtsProgress)
      return
    }
    // 否则生成新的 TTS 音频
    setEvalTtsLoading(true)
    try {
      const selectedVoice = useVoiceStore.getState().settings.voice
      const res = await textToSpeech(text, selectedVoice)
      const audio = new Audio(res.data.audioUrl)
      evalTtsAudioRef.current = audio
      audio.onloadedmetadata = () => setEvalTtsDuration(audio.duration)
      audio.onended = () => { setEvalTtsPlaying(false); setEvalTtsCurrentTime(0) }
      audio.onerror = () => { setEvalTtsPlaying(false); setEvalTtsCurrentTime(0); setEvalTtsLoading(false) }
      setEvalTtsLoading(false)
      audio.play()
      setEvalTtsPlaying(true)
      evalTtsAnimRef.current = requestAnimationFrame(updateEvalTtsProgress)
    } catch (err) {
      setEvalTtsLoading(false)
      setEvalTtsError(true)
      setTimeout(() => setEvalTtsError(false), 3000)
      const msg = err instanceof Error ? err.message : '评价 TTS 播放失败'
      toast.error(msg, 4000)
    }
  }

  /** 格式化时间 mm:ss */
  const fmtDur = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /** 生成波形条（6 条柱状条） */
  const ttsWaveformBars = () =>
    Array.from({ length: 6 }, (_, i) => (
      <span key={i} className={`vw-bar vw-bar-${i} ${ttsPlaying ? 'active' : ''}`} />
    ))

  const waveformBars = () =>
    Array.from({ length: 6 }, (_, i) => (
      <span key={i} className={`vw-bar vw-bar-${i} ${voicePlaying ? 'active' : ''}`} />
    ))

  return (
    <div className={`message-row ${isAI ? 'ai' : 'user'} ${isFailed ? 'failed' : ''} ${isSending ? 'sending' : ''}`}>
      <div className="message-avatar">
        {isAI ? <RobotOutlined /> : <UserOutlined />}
      </div>
      <div className={`message-bubble ${isAI ? 'ai-bubble' : 'user-bubble'} ${isFailed ? 'bubble-failed' : ''}`}>
        {isAI && (
          <div className="message-sender">AI 面试官</div>
        )}

        {/* 评价卡片：展示上一条用户回答的 AI 评估结果（面试官的评价） */}
        {isAI && prevUserEval?.feedback && (
          <div className="eval-card">
            <div className="eval-header">
              <span className="eval-label">📊 回答评价</span>
              <div className="eval-header-right">
                {message.rating != null && (
                  <span className="eval-score">得分：{message.rating}</span>
                )}
                <span
                  className={`eval-tts-btn ${evalTtsPlaying ? 'playing' : ''} ${evalTtsError ? 'error' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleEvalTtsPlay() }}
                  title={evalTtsPlaying ? '暂停' : '朗读评价'}
                >
                  {evalTtsLoading ? <LoadingOutlined /> : evalTtsPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
                </span>
              </div>
            </div>
            <div className="eval-body">
              {prevUserEval.feedback.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>
            {evalTtsPlaying && (
              <div className="eval-tts-timer">{fmtDur(evalTtsCurrentTime)} / {fmtDur(evalTtsDuration)}</div>
            )}
          </div>
        )}

        {/* 参考答案（可折叠）— 独立于评价卡片，始终显示 */}
        {isAI && message.referenceAnswer && message.referenceAnswer.length > 0 && (
          <details className="eval-ref" style={{ marginTop: message.feedback ? 4 : 8 }}>
            <summary className="eval-ref-summary"><span>💡 参考答案</span></summary>
            <div className="eval-ref-body">
              {message.referenceAnswer.map((point, i) => (
                <p key={i}>{i + 1}. {point || '\u00A0'}</p>
              ))}
            </div>
          </details>
        )}

        {/* 语音面试模式：AI 消息 — TTS 播放器在上，文字默认折叠 */}
        {isAI && voiceInterviewMode && !isFailed && (
          <>
            <div className={`voice-wave-wrapper voice-wave-tts ${ttsPlaying ? 'playing' : ''} ${ttsError ? 'error' : ''}`} onClick={handleTtsPlay}>
              <span className="voice-play-btn">
                {ttsLoading ? <LoadingOutlined /> : ttsPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
              </span>
              <span className="voice-wave-bars">
                {ttsWaveformBars()}
              </span>
              <span className="voice-duration">
                {ttsPlaying ? fmtDur(ttsCurrentTime) : fmtDur(ttsDuration || 0)}
              </span>
            </div>
            <div className={`message-content message-content-collapsed ${textExpanded ? 'expanded' : ''}`}>
              <div className="content-text">
                {displayContent.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
                {isStreaming && !isComplete && (
                  <span className="streaming-cursor">|</span>
                )}
                {isSending && (
                  <span className="sending-indicator"><LoadingOutlined /> 发送中...</span>
                )}
              </div>
              <button className="btn-text-toggle" onClick={() => setTextExpanded((v) => !v)}>
                {textExpanded ? '隐藏文本' : '显示文本'}
              </button>
            </div>
          </>
        )}

        {/* 非语音面试模式：正常显示文字 */}
        {(!isAI || !voiceInterviewMode) && (displayContent.trim() || !isVoice) && (
          <div className="message-content">
            {displayContent.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
            {isStreaming && !isComplete && (
              <span className="streaming-cursor">|</span>
            )}
            {isSending && (
              <span className="sending-indicator"><LoadingOutlined /> 发送中...</span>
            )}
          </div>
        )}
        {isVoice && !isFailed && (
          <div className={`voice-wave-wrapper ${voicePlaying ? 'playing' : ''}`} onClick={handlePlayVoice}>
            <span className="voice-play-btn">
              {voicePlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
            </span>
            <span className="voice-wave-bars">
              {waveformBars()}
            </span>
            <span className="voice-duration">
              {voicePlaying ? fmtDur(currentTime) : fmtDur(voiceDuration)}
            </span>
          </div>
        )}
        {isFailed && !isAI && (
          <button
            className="btn-retry"
            onClick={() => onRetry?.(message)}
            title="点击重试"
          >
            <ExclamationCircleOutlined />
            <span className="retry-label">发送失败，点击重试</span>
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
