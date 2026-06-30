import { useState, useRef, useEffect, useCallback } from 'react'
import { SendOutlined, StopOutlined, CheckCircleOutlined, LoadingOutlined, AudioOutlined, SoundOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { MessageType } from '@/types/interview'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { toast } from '@/store/useToastStore'

export interface InputAreaProps {
  disabled?: boolean
  isFinished?: boolean
  interviewId?: string
  /** 发送消息，type 默认为 'text'，语音识别后传 'voice' */
  onSend: (text: string, type?: MessageType, audioUrl?: string, audioBlob?: Blob) => void
  onEnd: () => void
  /** 最后一条 AI 消息内容（用于 TTS 朗读） */
  lastAIContent?: string
}

export default function InputArea({ disabled, isFinished, interviewId, onSend, onEnd, lastAIContent }: InputAreaProps) {
  const [text, setText] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)

  // Voice store
  const voiceStore = useVoiceStore()
  const voiceEnabled = voiceStore.enabled
  const isProcessing = useVoiceStore((s) => s.isProcessing)
  const recognizedText = useVoiceStore((s) => s.recognizedText)
  const speakText = useVoiceStore((s) => s.speakText)
  const stopSpeaking = useVoiceStore((s) => s.stopSpeaking)
  const isSpeaking = useVoiceStore((s) => s.isSpeaking)
  const settings = useVoiceStore((s) => s.settings)
  const setRecording = useVoiceStore((s) => s.setRecording)
  const resetRecording = useVoiceStore((s) => s.resetRecording)

  const recorder = useMediaRecorder()
  useEffect(() => {
    if (!voiceStore.enabled) {
      voiceStore.setEnabled(true)
    }
  }, [voiceStore])
  
  useEffect(() => {
    if (!disabled && !isFinished) {
      inputRef.current?.focus()
    }
  }, [disabled, isFinished])

  // 组件卸载时清理音频 URL
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  // 录音计时器
  useEffect(() => {
    if (recorder.isRecording) {
      setRecordingTime(0)
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current)
        recordTimerRef.current = null
      }
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    }
  }, [recorder.isRecording])

  // 录音完成+ASR 识别后自动发送语音消息
  useEffect(() => {
    if (recognizedText !== null && settings.autoSend) {
      const trimmed = recognizedText.trim()
      const url = audioUrlRef.current
      audioUrlRef.current = null
      audioBlobRef.current = null
      onSend(trimmed, 'voice', url || undefined)
      resetRecording()
    }
  }, [recognizedText, settings.autoSend, onSend, resetRecording])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isFinished) return
    onSend(trimmed)
    setText('')
  }, [text, disabled, isFinished, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // 切换录音：停止后调 ASR 识别语音，识别结果触发 useEffect 自动发送
  const handleVoiceToggle = useCallback(async () => {
    if (recorder.isRecording) {
      setRecording(false)
      const blob = await recorder.stop()
      if (blob) {
        // 先清理之前的 URL
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }
        audioUrlRef.current = URL.createObjectURL(blob)
        audioBlobRef.current = blob
        // 调 ASR 识别语音，识别完成后设置 recognizedText 触发自动发送
        voiceStore.recognizeSpeech(blob)
      }
    } else {
      resetRecording()
      await recorder.start()
      setRecording(true)
    }
  }, [recorder, voiceStore, setRecording, resetRecording])

  // TTS 朗读最后一条 AI 消息
  const handleSpeakLast = useCallback(() => {
    if (!lastAIContent) return
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speakText(lastAIContent)
    }
  }, [lastAIContent, isSpeaking, speakText, stopSpeaking])

  // 取消已识别的文本（由 useEffect 触发发送前可手动取消）
  const handleCancelRecognition = useCallback(() => {
    resetRecording()
  }, [resetRecording])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 弹出错误toast
  useEffect(() => {
    if (recorder.error) {
      toast.error(`录音错误: ${recorder.error}`)
    }
  }, [recorder.error])
  if (isFinished) {
    return (
      <div className="input-area finished">
        <div className="finished-banner">
          <CheckCircleOutlined className="text-success fs-18" />
          <span>面试已结束</span>
          <Link to={`/interview/${interviewId || '1'}/report`} className="btn-report">
            查看报告
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          className="input-textarea"
          placeholder="输入你的回答... (Enter 发送, Shift+Enter 换行)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
        />

        {/* 语音按钮 */}
        <button
          className={`btn-voice ${recorder.isRecording ? 'recording' : ''} ${!voiceEnabled ? 'hidden' : ''}`}
          onClick={handleVoiceToggle}
          disabled={disabled || isProcessing}
          title={recorder.isRecording ? '点击停止录音' : '点击开始录音'}
        >
          {recorder.isRecording ? (
            <span className="voice-recording-icon">
              <span className="rec-dot" />
              {formatTime(recordingTime)}
            </span>
          ) : isProcessing ? (
            <LoadingOutlined />
          ) : (
            <AudioOutlined />
          )}
        </button>

        {/* TTS 朗读按钮 */}
        {lastAIContent && (
          <button
            className={`btn-voice ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleSpeakLast}
            disabled={disabled}
            title={isSpeaking ? '停止朗读' : '朗读 AI 回复'}
          >
            {isSpeaking ? <LoadingOutlined /> : <SoundOutlined />}
          </button>
        )}

        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || !text.trim() || isProcessing}
          title="发送"
        >
          {disabled ? <LoadingOutlined /> : <SendOutlined />}
        </button>
      </div>

      {/* 识别状态提示 */}
      {recorder.isRecording && (
        <div className="voice-status recording">
          <span className="rec-dot" />
          录音中... 点击麦克风停止
        </div>
      )}
      {isProcessing && (
        <div className="voice-status processing">
          <LoadingOutlined /> 正在识别...
        </div>
      )}
      {recognizedText && !settings.autoSend && (
        <div className="voice-status recognized">
          <span>识别: {recognizedText}</span>
          <button className="voice-status-btn" onClick={() => {
            const url = audioUrlRef.current
            audioUrlRef.current = null
            onSend(recognizedText?.trim() || '', 'voice', url || undefined)
            resetRecording()
          }}>
            <SendOutlined /> 发送
          </button>
          <button className="voice-status-btn cancel" onClick={handleCancelRecognition}>
            取消
          </button>
        </div>
      )}


      {/* 语音按钮始终渲染但通过 CSS 控制显隐 */}

      <button className="btn-end" onClick={onEnd}>
        <StopOutlined /> 结束面试
      </button>
    </div>
  )
}
