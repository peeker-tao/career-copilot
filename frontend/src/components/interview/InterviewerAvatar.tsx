import { useState, useEffect } from 'react'

export interface InterviewerAvatarProps {
  /** AI 正在回复中 */
  speaking?: boolean
  /** 面试已结束 */
  finished?: boolean
  /** 用户正在输入 */
  listening?: boolean
  /** 目标岗位名称 */
  position?: string
}

type Expression = 'idle' | 'speaking' | 'listening' | 'finished'

export default function InterviewerAvatar({ speaking, finished, listening, position }: InterviewerAvatarProps) {
  const [expression, setExpression] = useState<Expression>('idle')
  const [blink, setBlink] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(false)

  // 表情状态同步
  useEffect(() => {
    if (finished) {
      setExpression('finished')
    } else if (speaking) {
      setExpression('speaking')
    } else if (listening) {
      setExpression('listening')
    } else {
      setExpression('idle')
    }
  }, [speaking, finished, listening])

  // 眨眼动画（随机间隔）
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000
      return setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 150)
        blinkTimer = scheduleBlink()
      }, delay)
    }
    let blinkTimer = scheduleBlink()
    return () => clearTimeout(blinkTimer)
  }, [])

  // 说话时嘴巴开合
  useEffect(() => {
    if (expression !== 'speaking') {
      setMouthOpen(false)
      return
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev)
    }, 300 + Math.random() * 200)
    return () => clearInterval(interval)
  }, [expression])

  const statusLabel =
    expression === 'speaking' ? '正在提问...' :
    expression === 'listening' ? '正在倾听...' :
    expression === 'finished' ? '面试已结束' :
    position ? `模拟面试 · ${position}` : '模拟面试'

  return (
    <div className={`interviewer-avatar ${expression}`}>
      {/* 背景光晕 */}
      <div className="avatar-glow" />

      {/* 人物主体 */}
      <div className="avatar-figure">
        {/* 头部 */}
        <div className="avatar-head">
          {/* 头发 */}
          <div className="avatar-hair" />
          {/* 脸部 */}
          <div className="avatar-face">
            {/* 眼睛 */}
            <div className="avatar-eyes">
              <div className={`avatar-eye left-eye ${blink ? 'blink' : ''}`}>
                <div className="eye-pupil" />
              </div>
              <div className={`avatar-eye right-eye ${blink ? 'blink' : ''}`}>
                <div className="eye-pupil" />
              </div>
            </div>
            {/* 嘴巴 */}
            <div className={`avatar-mouth ${mouthOpen ? 'open' : ''}`} />
          </div>
          {/* 耳朵 */}
          <div className="avatar-ear left-ear" />
          <div className="avatar-ear right-ear" />
        </div>

        {/* 身体 - 西装外套 */}
        <div className="avatar-body">
          <div className="body-collar" />
          <div className="body-lapel left-lapel" />
          <div className="body-lapel right-lapel" />
        </div>

        {/* 状态指示脉冲 */}
        <div className="avatar-pulse" />
      </div>

      {/* 底部信息 */}
      <div className="avatar-footer">
        <div className="avatar-name">AI 面试官</div>
        <div className="avatar-status">{statusLabel}</div>
      </div>
    </div>
  )
}
