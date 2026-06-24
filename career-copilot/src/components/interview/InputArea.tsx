import { useState, useRef, useEffect, useCallback } from 'react'
import { SendOutlined, StopOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

export interface InputAreaProps {
  disabled?: boolean
  isFinished?: boolean
  interviewId?: string
  onSend: (text: string) => void
  onEnd: () => void
}

export default function InputArea({ disabled, isFinished, interviewId, onSend, onEnd }: InputAreaProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!disabled && !isFinished) {
      inputRef.current?.focus()
    }
  }, [disabled, isFinished])

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
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title="发送"
        >
          {disabled ? <LoadingOutlined /> : <SendOutlined />}
        </button>
      </div>
      <button className="btn-end" onClick={onEnd}>
        <StopOutlined /> 结束面试
      </button>
    </div>
  )
}
