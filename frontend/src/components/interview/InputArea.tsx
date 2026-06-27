import { useState, useRef, useEffect, useCallback } from 'react'
import { SendOutlined, StopOutlined, CheckCircleOutlined, LoadingOutlined, AudioOutlined, AudioMutedOutlined, SoundOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'

export interface InputAreaProps {
  disabled?: boolean
  isFinished?: boolean
  interviewId?: string
  onSend: (text: string) => void
  onEnd: () => void
}

export default function InputArea({ disabled, isFinished, interviewId, onSend, onEnd }: InputAreaProps) {
  const [text, setText] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Voice store
  const voiceEnabled = useVoiceStore((s) => s.enabled)
  const isProcessing = useVoiceStore((s) => s.isProcessing)
  const recognizedText = useVoiceStore((s) => s.recognizedText)
  const speakText = useVoiceStore((s) => s.speakText)
  const stopSpeaking = useVoiceStore((s) => s.stopSpeaking)
  const isSpeaking = useVoiceStore((s) => s.isSpeaking)
  const toggleEnabled = useVoiceStore((s) => s.toggleEnabled)
  const settings = useVoiceStore((s) => s.settings)
  const recognizeSpeech = useVoiceStore((s) => s.recognizeSpeech)
  const setRecording = useVoiceStore((s) => s.setRecording)
  const resetRecording = useVoiceStore((s) => s.resetRecording)

  const recorder = useMediaRecorder()

  useEffect(() => {
    if (!disabled && !isFinished) {
      inputRef.current?.focus()
    }
  }, [disabled, isFinished])

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

  // 识别完成后自动填入文本并发送
  useEffect(() => {
    if (recognizedText && settings.autoSend) {
      const trimmed = recognizedText.trim()
      if (trimmed) {
        onSend(trimmed)
      }
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

  // 切换录音
  const handleVoiceToggle = useCallback(async () => {
    if (recorder.isRecording) {
      setRecording(false)
      const blob = await recorder.stop()
      if (blob) {
        await recognizeSpeech(blob)
      }
    } else {
      resetRecording()
      await recorder.start()
      setRecording(true)
    }
  }, [recorder, setRecording, resetRecording, recognizeSpeech])

  // TTS 朗读最后一条 AI 消息
  const handleSpeakLast = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      // 由父组件传入朗读内容会更精确，这里只是框架预留
    }
  }, [isSpeaking, stopSpeaking])

  // 取消已识别的文本（由 useEffect 触发发送前可手动取消）
  const handleCancelRecognition = useCallback(() => {
    resetRecording()
  }, [resetRecording])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

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

        {/* 语音开关 */}
        <button
          className={`btn-voice-toggle ${voiceEnabled ? 'active' : ''}`}
          onClick={toggleEnabled}
          title={voiceEnabled ? '关闭语音输入' : '开启语音输入'}
        >
          {voiceEnabled ? <SoundOutlined /> : <AudioMutedOutlined />}
        </button>

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
          <button className="voice-status-btn" onClick={() => { onSend(recognizedText); resetRecording() }}>
            <SendOutlined /> 发送
          </button>
          <button className="voice-status-btn cancel" onClick={handleCancelRecognition}>
            取消
          </button>
        </div>
      )}
      {recorder.error && (
        <div className="voice-status error">
          录音错误: {recorder.error}
        </div>
      )}

      {/* 语音按钮始终渲染但通过 CSS 控制显隐 */}

      <button className="btn-end" onClick={onEnd}>
        <StopOutlined /> 结束面试
      </button>
    </div>
  )
}
