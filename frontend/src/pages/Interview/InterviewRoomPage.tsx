import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  SettingOutlined,
  SoundOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { MessageType, InterviewMessage } from '@/types/interview'
import { EmptyState } from '@/components/common'
import { ChatMessages, InputArea, InterviewTimer, InterviewerAvatar, VoiceSettings } from '@/components/interview'
import { useInterviewStore } from '@/store/useInterviewStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { VOICE_DISPLAY_NAMES } from '@/api/voice'
import { useInterviewWebSocket } from '@/hooks/useInterviewWebSocket'
import { useResumeStore } from '@/store/useResumeStore'
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
  const report = useInterviewStore((s) => s.report)

  // Resume store
  const resumes = useResumeStore((s) => s.resumes)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)

  // New interview setup state
  const [targetPosition, setTargetPosition] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [starting, setStarting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [showResumeDropdown, setShowResumeDropdown] = useState(false)
  // 防止 finishInterview 被重复调用
  const finishingRef = useRef(false)
  // 语音音色设置弹窗
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false)
  // 面试语音预设
  const [setupVoiceMode, setSetupVoiceMode] = useState(false)
  const [setupTtsEnabled, setSetupTtsEnabled] = useState(false)
  const [setupVoice, setSetupVoice] = useState('alloy')
  const [showVoiceSetup, setShowVoiceSetup] = useState(false)
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false)
  const voiceSelectRef = useRef<HTMLDivElement>(null)

  // 语音下拉菜单点击外部关闭
  useEffect(() => {
    if (!showVoiceDropdown) return
    const handler = (e: MouseEvent) => {
      if (voiceSelectRef.current && !voiceSelectRef.current.contains(e.target as Node)) {
        setShowVoiceDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showVoiceDropdown])

  // 进入新面试页时加载简历列表
  useEffect(() => {
    if (isNew) {
      fetchResumes()
    }
  }, [isNew, fetchResumes])

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
  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'
  const wsEnabled = !isNew && !!id && !isMockMode
  useEffect(() => {
    setUseWebSocket(wsEnabled)
    console.log(`WebSocket ${wsEnabled ? 'enabled' : 'disabled'} for interview room`)
  }, [wsEnabled, setUseWebSocket])

  // 被动结束（如题目答完）时自动完成面试并拉取报告
  useEffect(() => {
    if (isFinished && id && !isNew && !report && !finishingRef.current) {
      finishingRef.current = true
      finishInterview(id)
    }
  }, [isFinished, id, isNew, report, finishInterview])

  const { sendAnswer: wsSendAnswer, connected: wsConnected } = useInterviewWebSocket({
    interviewId: id,
    enabled: wsEnabled,
    onChunk: appendWSChunk,
    onDone: finalizeWSMessage,
    onError: handleWSError,
  })

  const handleStartInterview = async () => {
    const pos = targetPosition.trim()
    if (!pos) {
      setSetupError('请输入目标岗位')
      return
    }
    if (pos.length < 2) {
      setSetupError('岗位名称至少需要 2 个字符')
      return
    }
    if (pos.length > 50) {
      setSetupError('岗位名称不能超过 50 个字符')
      return
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\/+\-]+$/.test(pos)) {
      setSetupError('岗位名称只能包含中文、英文字母、数字、空格和少量符号（/ + -）')
      return
    }
    setSetupError(null)
    setStarting(true)
    try {
      const store = useInterviewStore.getState()
      const newId = await store.startInterview(
        pos,
        difficulty,
        selectedResumeId || undefined,
      )
      if (newId) {
        // 应用语音预设
        const voiceStore = useVoiceStore.getState()
        if (setupVoiceMode && !voiceStore.voiceInterviewMode) {
          voiceStore.toggleVoiceInterviewMode()
        }
        if (setupTtsEnabled && !voiceStore.ttsEnabled) {
          voiceStore.toggleTtsEnabled()
        }
        voiceStore.setVoice(setupVoice)
        // 创建面试成功后立即加载消息
        await store.loadMessages(newId)
        navigate(`/interview/${newId}`, { replace: true })
      }
    } catch (err) {
      const msg = (err as Error).message || '面试创建失败'
      // 超时场景给出具体提示
      if (/timeout|timed out|超时/i.test(msg)) {
        setSetupError(
          '⏱️ 首题生成超时，可能是 AI 响应较慢。\n' +
          '请稍后点击下方按钮重试，或在设置中调整后重新开始。',
        )
      } else {
        setSetupError(msg)
      }
    } finally {
      setStarting(false)
    }
  }

  const addMessage = useInterviewStore((s) => s.addMessage)

  // handleSend 从 store 中获取最新引用
  const handleSend = useCallback((content: string, type?: MessageType, audioUrl?: string, audioBlob?: Blob) => {
    if (id && !isNew) {
      const msgId = addMessage(content, type || 'text', audioUrl)
      if (wsEnabled && wsConnected) {
        // WebSocket 已连接：走 WS 流式通道，REST 只标记 sent
        sendMessage(id, msgId, content, type || 'text', audioUrl, audioBlob)
        wsSendAnswer(content)
      } else if (wsEnabled && !wsConnected) {
        // WebSocket 未连接：降级到 REST API，同时发出警告
        console.warn('[WS] WebSocket 未连接，降级到 REST API 提交回答')
        sendMessage(id, msgId, content, type || 'text', audioUrl, audioBlob, true)
      } else {
        // 普通 REST 模式
        sendMessage(id, msgId, content, type || 'text', audioUrl, audioBlob)
      }
    }
  }, [id, isNew, addMessage, sendMessage, wsEnabled, wsConnected, wsSendAnswer])

  // 最后一条 AI 消息内容，用于 TTS 朗读
  const lastAIContent = useMemo(() => {
    const aiMsgs = messages.filter((m) => m.role === 'ai')
    return aiMsgs.length > 0 ? aiMsgs[aiMsgs.length - 1].content : ''
  }, [messages])

  // Voice store for TTS
  const speakText = useVoiceStore((s) => s.speakText)
  const stopSpeaking = useVoiceStore((s) => s.stopSpeaking)
  const ttsEnabled = useVoiceStore((s) => s.ttsEnabled)
  const toggleTtsEnabled = useVoiceStore((s) => s.toggleTtsEnabled)
  const isSpeaking = useVoiceStore((s) => s.isSpeaking)
  const voiceInterviewMode = useVoiceStore((s) => s.voiceInterviewMode)
  const toggleVoiceInterviewMode = useVoiceStore((s) => s.toggleVoiceInterviewMode)

  // 自动 TTS: 新 AI 消息到达时自动朗读
  const prevTtsContentRef = useRef('')
  useEffect(() => {
    if (ttsEnabled && lastAIContent && lastAIContent !== prevTtsContentRef.current) {
      prevTtsContentRef.current = lastAIContent
      speakText(lastAIContent)
    }
  }, [lastAIContent, ttsEnabled, speakText])

  // 切换 TTS 时如果关闭则停止朗读
  useEffect(() => {
    if (!ttsEnabled && isSpeaking) {
      stopSpeaking()
    }
  }, [ttsEnabled, isSpeaking, stopSpeaking])

  // 重试发送失败的消息：先更新状态为 sending，再重新发送
  const handleRetry = useCallback((message: InterviewMessage) => {
    if (id && !isNew) {
      sendMessage(id, message.id, message.content, message.type, message.audioUrl)
    }
  }, [id, isNew, sendMessage])

  const handleEnd = useCallback(async () => {
    const confirmed = window.confirm('确定要结束当前面试吗？结束后将自动生成面试报告。')
    if (!confirmed) return

    finishingRef.current = true
    await finishInterview(id!)
  }, [id, finishInterview])

  // 新面试 - 设置页面
  if (isNew) {
    return (
      <div className="room-page page-full">
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

            {/* 简历选择 */}
            <div className="setup-field">
              <label className="setup-label">关联简历（可选）</label>
              <div className="resume-selector">
                <button
                  className={`resume-selector-trigger ${selectedResumeId ? 'has-value' : ''}`}
                  onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                  type="button"
                >
                  <FileTextOutlined />
                  <span className="resume-selector-label">
                    {selectedResumeId
                      ? resumes.find((r) => r.id === selectedResumeId)?.title || '已选择简历'
                      : '不选择简历（空手面试）'}
                  </span>
                  <span className="resume-selector-arrow">{showResumeDropdown ? '▲' : '▼'}</span>
                </button>
                {showResumeDropdown && (
                  <div className="resume-selector-dropdown">
                    <div
                      className={`resume-option ${!selectedResumeId ? 'active' : ''}`}
                      onClick={() => { setSelectedResumeId(''); setShowResumeDropdown(false) }}
                    >
                      <span className="resume-option-label">不选择简历</span>
                      <span className="resume-option-desc">空手开始面试</span>
                    </div>
                    {resumes
                      .filter((r) => r.status === 'completed')
                      .map((r) => (
                        <div
                          key={r.id}
                          className={`resume-option ${selectedResumeId === r.id ? 'active' : ''}`}
                          onClick={() => { setSelectedResumeId(r.id); setShowResumeDropdown(false) }}
                        >
                          <span className="resume-option-label">{r.name || r.title}</span>
                          <span className="resume-option-desc">
                            {r.skills.slice(0, 3).join('、')}{r.skills.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
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

            {/* 语音设置 */}
            <div className="setup-field">
              <div
                className="setup-collapsible-header"
                onClick={() => setShowVoiceSetup(!showVoiceSetup)}
              >
                <SoundOutlined />
                <span>语音设置</span>
                <span className={`setup-collapsible-arrow ${showVoiceSetup ? 'open' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`setup-voice-body ${showVoiceSetup ? 'open' : ''}`}>
                <label className="setup-voice-row">
                  <span className="setup-voice-label">语音面试模式</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      aria-label="启用语音面试模式"
                      checked={setupVoiceMode}
                      onChange={(e) => setSetupVoiceMode(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </label>
                <label className="setup-voice-row">
                  <span className="setup-voice-label">AI 自动朗读</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      aria-label="启用 AI 自动朗读"
                      checked={setupTtsEnabled}
                      onChange={(e) => setSetupTtsEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </label>
                <div className="setup-voice-row">
                  <span className="setup-voice-label">语音音色</span>
                  <div className="setup-voice-custom-select" ref={voiceSelectRef}>
                    <button
                      type="button"
                      className="setup-voice-select-trigger"
                      onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                    >
                      <span>{VOICE_DISPLAY_NAMES[setupVoice] || setupVoice}</span>
                      <span className={`setup-voice-select-arrow ${showVoiceDropdown ? 'open' : ''}`}>▼</span>
                    </button>
                    <div className={`setup-voice-dropdown ${showVoiceDropdown ? 'open' : ''}`}>
                      {Object.entries(VOICE_DISPLAY_NAMES).map(([key, name]) => (
                        <div
                          key={key}
                          className={`setup-voice-option ${setupVoice === key ? 'active' : ''}`}
                          onClick={() => { setSetupVoice(key); setShowVoiceDropdown(false) }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
      <div className="room-page page-full">
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

  // 消息加载失败（面试存在但消息获取出错）
  if (error && interview && !isNew) {
    return (
      <div className="room-page page-full">
        <div className="room-topbar">
          <Link to="/interview" className="topbar-back">
            <ArrowLeftOutlined />
          </Link>
          <div className="topbar-info">
            <span className="topbar-position">{interview?.targetPosition || '-'}</span>
          </div>
        </div>
        <div className="room-body-error">
          <EmptyState
            icon={<ExclamationCircleOutlined />}
            title="加载消息失败"
            description={
              /timeout|timed out|超时/i.test(error)
                ? '⏱️ AI 首题生成超时，请稍后重试'
                : error
            }
            actionText="重新加载"
            onAction={() => loadMessages(id!)}
          />
        </div>
      </div>
    )
  }

  // 面试不存在
  if (!loading && !interview && !isNew) {
    return (
      <div className="room-page page-full">
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
    <div className="room-page page-full">
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
          {/* AI 自动朗读开关 */}
          <label className="toggle-switch" title={ttsEnabled ? '关闭 AI 自动朗读' : '开启 AI 自动朗读'}>
            <input type="checkbox" checked={ttsEnabled} onChange={toggleTtsEnabled} />
            <span className="toggle-slider" />
            <span className="toggle-label">自动朗读</span>
          </label>
          {/* 语音面试开关 */}
          <label className="toggle-switch" title={voiceInterviewMode ? '关闭语音面试模式' : '开启语音面试模式'}>
            <input type="checkbox" checked={voiceInterviewMode} onChange={toggleVoiceInterviewMode} />
            <span className="toggle-slider" />
            <span className="toggle-label">语音面试</span>
          </label>
          {/* 音色设置 */}
          <button
            className="btn-voice-settings"
            onClick={() => setVoiceSettingsOpen(true)}
            title="语音音色设置"
          >
            <SettingOutlined />
          </button>
          <span className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}>
            <ApiOutlined />
          </span>
          {interview?.startedAt && <InterviewTimer startedAt={interview.startedAt} />}
        </div>
      </div>

      <div className="room-body">
        <InterviewerAvatar
          speaking={aiResponding}
          listening={!!messages.length && !aiResponding && !isFinished}
          finished={isFinished}
          position={interview?.targetPosition}
        />
        <ChatMessages
          messages={messages}
          aiStreamingId={streamingId}
          instantStreaming={wsEnabled}
          onRetry={handleRetry}
          voiceInterviewMode={voiceInterviewMode}
          onRetryLoadMessages={id ? () => loadMessages(id) : undefined}
          loading={loading}
        />
      </div>

      <InputArea
        disabled={aiResponding}
        isFinished={isFinished}
        interviewId={id}
        onSend={handleSend}
        lastAIContent={lastAIContent}
        onEnd={handleEnd}
      />

      {/* 语音音色设置弹窗 */}
      <VoiceSettings
        open={voiceSettingsOpen}
        onClose={() => setVoiceSettingsOpen(false)}
      />
    </div>
  )
}
