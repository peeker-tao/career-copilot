import { useState, useEffect } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'

export interface InterviewTimerProps {
  startedAt: string
  onTimeUpdate?: (seconds: number) => void
}

export default function InterviewTimer({ startedAt, onTimeUpdate }: InterviewTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => {
      const start = new Date(startedAt).getTime()
      const now = Date.now()
      const diff = Math.floor((now - start) / 1000)
      setElapsed(diff)
      if (onTimeUpdate) onTimeUpdate(diff)
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
