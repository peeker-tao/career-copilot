import { useState, useEffect } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'

export interface InterviewTimerProps {
  startedAt: string
  onTimeUpdate?: (seconds: number) => void
}

/** 安全解析时间戳，兼容 ISO 和 MySQL datetime 格式，返回时间戳毫秒数 */
function safeParseTime(timestamp: string): number {
  if (!timestamp) return 0
  let d = new Date(timestamp)
  if (isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(timestamp)) {
    d = new Date(timestamp.replace(' ', 'T') + '+08:00')
  }
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

export default function InterviewTimer({ startedAt, onTimeUpdate }: InterviewTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => {
      const start = safeParseTime(startedAt)
      if (start === 0) return
      const now = Date.now()
      const diff = Math.floor((now - start) / 1000)
      setElapsed(Math.max(0, diff))
      if (onTimeUpdate) onTimeUpdate(Math.max(0, diff))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt, onTimeUpdate])

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <span className="timer-display">
      <ClockCircleOutlined /> {minutes}:{seconds}
    </span>
  )
}
