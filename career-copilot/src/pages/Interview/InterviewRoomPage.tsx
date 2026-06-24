import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { EmptyState } from '@/components/common'
import { ChatMessages, InputArea, InterviewTimer } from '@/components/interview'
import { useInterviewStore } from '@/store/useInterviewStore'
import { useInterviewWebSocket } from '@/hooks/useInterviewWebSocket'
import './InterviewRoom.css'

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  // Store state
  const interview = useInterviewStore((s) => s.interview)
  const messages = useInterviewStore((s) => s.currentMessages)
  const streamingId = useInterviewStore((s) => s.streamingId)
  const aiResponding = useInterviewStore((s) => s.aiResponding)
  const isFinished = useInterviewStore((s) => s.isFinished)
  const loading = useInterviewStore((s) => s.loading)
  const error = useInterviewStore((s) => s.error)
  const fetchInterview = useInterviewStore((s) => s.fetchInterview)
  const loadMessages = useInterviewStore((s) => s.loadMessages)
  const sendMessage = useInterviewStore((s) => s.sendMessage)
  const finishInterview = useInterviewStore((s) => s.finishInterview)
  const resetRoom = useInterviewStore((s) => s.resetRoom)
  const setUseWebSocket = useInterviewStore((s) => s.setUseWebSocket)
  const appendWSChunk = useInterviewStore((s) => s.appendWSChunk)
  const finalizeWSMessage = useInterviewStore((s) => s.finalizeWSMessage)
  const handleWSError = useInterviewStore((s) => s.handleWSError)

  // New interview setup state
  const [targetPosition, setTargetPosition] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [starting, setStarting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // 加载已有面试
  useEffect(() => {
    if (!isNew && id) {
      fetchInterview(id)
      loadMessages(id)
    }
    return () => {
      resetRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // WebSocket 流式通道 — 非 mock 模式下，进入面试房间后自动连接
  const wsEnabled = !isNew && !!id && !import.meta.env.VITE_USE_MOCK
  useEffect(() => {
    setUseWebSocket(wsEnabled)
  }, [wsEnabled, setUseWebSocket])

  const { sendAnswer: wsSendAnswer, connected: wsConnected } = useInterviewWebSocket({
    interviewId: id,
    enabled: wsEnabled,
    onChunk: appendWSChunk,
    onDone: finalizeWSMessage,
    onError: handleWSError,
  })

  const handleStartInterview = async () => {
    if (!targetPosition.trim()) {
      setSetupError('请输入目标岗位')
      return
    }
    setSetupError(null)
    setStarting(true)
    try {
      const store = useInterviewStore.getState()
      const newId = await store.startInterview(targetPosition.trim(), difficulty)
      if (newId) {
        // 创建面试成功后立即加载消息
        await store.loadMessages(newId)
        navigate(`/interview/${newId}`, { replace: true })
      } else {
        setSetupError('面试创建失败，请重试')
      }
    } catch (err) {
      setSetupError((err as Error).message || '面试创建失败，请重试')
    } finally {
      setStarting(false)
    }
  }

  const handleSend = useCallback((content: string) => {
    if (id && !isNew) {
      sendMessage(id, content)
      // WebSocket 模式下才真正发出
      if (wsEnabled) {
        wsSendAnswer(content)
      }
    }
  }, [id, isNew, sendMessage, wsEnabled, wsSendAnswer])

  const handleEnd = useCallback(async () => {
    const confirmed = window.confirm('确定要结束当前面试吗？结束后将生成面试报告。')
    if (!confirmed) return

    await finishInterview(id!)
    navigate(`/interview/${id}/report`)
  }, [id, navigate, finishInterview])

  // 新面试 - 设置页面
  if (isNew) {
    return (
      <div className="room-page">
        <div className="room-topbar">
          <Link to="/interview" className="topbar-back">
            <ArrowLeftOutlined />
          </Link>
          <div className="topbar-info">
            <span className="topbar-position">开始新面试</span>
          </div>
        </div>
        <div className="setup-container">
          <div className="setup-card">
            <h2 className="setup-title">模拟面试设置</h2>
            <p className="setup-desc">选择目标岗位和难度，AI 将为你生成定制面试题</p>

            <div className="setup-field">
              <label className="setup-label">目标岗位</label>
              <input
                className="setup-input"
                type="text"
                placeholder="例如：后端开发工程师、Java 工程师"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartInterview()}
              />
            </div>

            <div className="setup-field">
              <label className="setup-label">面试难度</label>
              <div className="setup-difficulties">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    className={`setup-difficulty-btn ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                  </button>
                ))}
              </div>
            </div>

            {setupError && <p className="setup-error">{setupError}</p>}

            <button
              className="btn-start-setup"
              onClick={handleStartInterview}
              disabled={starting}
            >
              {starting ? '正在生成面试题...' : '开始面试'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 加载中
  if (loading && messages.length === 0) {
    return (
      <div className="room-page">
        <div className="room-loading">
          <div className="loading-header-skeleton" />
          <div className="loading-body-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-message">
                <div className="skeleton-avatar-sm" />
                <div className="skeleton-lines">
                  <div className="skeleton-line" style={{ width: '70%' }} />
                  <div className="skeleton-line" style={{ width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 错误或不存在的面试
  if (error || (!loading && !interview && !isNew)) {
    return (
      <div className="room-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="面试不存在或已被删除"
          description={error || undefined}
          actionText="返回面试列表"
          onAction={() => navigate('/interview')}
        />
      </div>
    )
  }

  return (
    <div className="room-page">
      <div className="room-topbar">
        <Link to="/interview" className="topbar-back">
          <ArrowLeftOutlined />
        </Link>
        <div className="topbar-info">
          <span className="topbar-position">{interview?.targetPosition || '-'}</span>
          <span className="topbar-divider">·</span>
          <span className="topbar-difficulty">
            {interview?.difficulty === 'easy' ? '简单' : interview?.difficulty === 'hard' ? '困难' : '中等'}
          </span>
        </div>
        <div className="topbar-right">
          {isFinished && (
            <Link to={`/interview/${id}/report`} className="topbar-report-link">
              查看报告
            </Link>
          )}
          <span className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}>
            <ApiOutlined />
          </span>
          {interview?.startedAt && <InterviewTimer startedAt={interview.startedAt} />}
        </div>
      </div>

      <ChatMessages messages={messages} aiStreamingId={streamingId} instantStreaming={wsEnabled} />

      <InputArea
        disabled={aiResponding}
        isFinished={isFinished}
        interviewId={id}
        onSend={handleSend}
        onEnd={handleEnd}
      />
    </div>
  )
}
