import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { EmptyState } from '@/components/common'
import { ChatMessages, InputArea, InterviewTimer } from '@/components/interview'
import type { InterviewMessage } from '@/types/interview'
import './InterviewRoom.css'

interface RoomInterview {
  id: string
  targetPosition: string
  difficulty: string
  totalRounds: number
  currentRound: number
  startedAt: string
}

const MOCK_INTERVIEW: RoomInterview = {
  id: '1',
  targetPosition: '后端开发工程师',
  difficulty: '中等',
  totalRounds: 8,
  currentRound: 3,
  startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
}

const INITIAL_MESSAGES: InterviewMessage[] = [
  {
    id: 'm1',
    role: 'ai',
    content: '你好！我是你的 AI 面试官，今天我们将进行一次后端开发工程师岗位的模拟面试。面试共 8 道题，预计需要 20-30 分钟。准备好了我们就开始吧！',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm2',
    role: 'ai',
    content: '请先简单介绍一下你自己，以及为什么想应聘后端开发工程师岗位？',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm3',
    role: 'user',
    content: '您好！我是一名计算机科学与技术专业的应届毕业生，熟练掌握 Java、Spring Boot、MySQL 等技术栈。在校期间参与过多个后端项目开发，对后端开发有浓厚的兴趣，希望能够在这个领域深耕发展。',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm4',
    role: 'ai',
    content: '很好的开场！从你的自我介绍中能感受到你的热情。\n\n接下来我们进入技术问题环节。请听题：\n\n请介绍一下 Java 中 HashMap 的实现原理，包括底层数据结构、put 和 get 方法的执行流程。',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    rating: 4,
  },
]

const AI_RESPONSES = [
  '回答得不错！你对 HashMap 的核心原理理解得比较清楚。\n\n不过我想补充一点：在 Java 8 中，当链表长度超过阈值（8）时，链表会转换为红黑树，这是为了解决哈希碰撞严重时查询效率从 O(n) 退化的问题。\n\n能说一下你对负载因子（load factor）的理解吗？',
  '很好的回答！负载因子默认是 0.75，这是时间成本和空间成本的平衡点。\n\n那我来问一个数据库相关的问题：MySQL 中索引的底层数据结构是什么？为什么要选择这种结构？',
  'B+ 树确实是 InnoDB 引擎索引的底层结构。它能很好地支持范围查询和排序操作。\n\n接下来聊聊 Redis 吧：Redis 支持哪些数据类型？分别适用于什么场景？',
  '很好，你对 Redis 的五种基本数据类型掌握得不错。\n\n最后一个问题：在分布式系统中，什么是 CAP 定理？在实际系统设计中你是如何权衡的？',
  '非常好！你对分布式系统的基本理论有清晰的认识。\n\n现在我们来到系统设计题：请设计一个短链接生成服务，需要考虑哪些核心功能和技术选型？',
]

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [interview, setInterview] = useState<RoomInterview | null>(null)
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [aiResponding, setAiResponding] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(3)
  const [isFinished, setIsFinished] = useState(false)
  const [connectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')
  const aiResponseIndexRef = useRef(0)

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      if (!mounted) return
      setInterview({ ...MOCK_INTERVIEW, id: id ?? '1' })
      setMessages([...INITIAL_MESSAGES])
      setCurrentRound(MOCK_INTERVIEW.currentRound)
      setLoading(false)
    }, 500)
    return () => { mounted = false; clearTimeout(timer) }
  }, [id])

  const handleSend = useCallback((content: string) => {
    const userMsg: InterviewMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    const aiMsgId = `ai_${Date.now()}`
    const aiResponse = AI_RESPONSES[aiResponseIndexRef.current % AI_RESPONSES.length]
    aiResponseIndexRef.current += 1

    const aiMsg: InterviewMessage = {
      id: aiMsgId,
      role: 'ai',
      content: aiResponse,
      timestamp: new Date(Date.now() + 500).toISOString(),
      rating: Math.floor(Math.random() * 2) + 3,
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setAiResponding(true)
    setStreamingId(aiMsgId)

    setCurrentRound((prev) => prev + 1)

    const totalLength = aiResponse.length
    const typingDuration = totalLength * 25 + 500
    setTimeout(() => {
      setAiResponding(false)
      setStreamingId(null)
    }, typingDuration)
  }, [])

  const handleEnd = useCallback(() => {
    const confirmed = window.confirm('确定要结束当前面试吗？结束后将生成面试报告。')
    if (!confirmed) return

    setIsFinished(true)
    setAiResponding(false)
    setStreamingId(null)

    setTimeout(() => {
      navigate(`/interview/${id}/report`)
    }, 1200)
  }, [id, navigate])

  if (loading) {
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

  if (!interview) {
    return (
      <div className="room-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="面试不存在或已被删除"
          actionText="返回面试准备"
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
          <span className="topbar-position">{interview.targetPosition}</span>
          <span className="topbar-divider">·</span>
          <span className="topbar-difficulty">{interview.difficulty}</span>
          <span className="topbar-divider">·</span>
           <span className="topbar-round">
             第 {currentRound}/{interview.totalRounds} 轮
           </span>
        </div>
        <div className="topbar-right">
          <span
            className={`connection-status ${connectionStatus}`}
            title={
              connectionStatus === 'connected'
                ? '已连接'
                : connectionStatus === 'reconnecting'
                  ? '重连中...'
                  : '已断开'
            }
          >
            <ApiOutlined />
          </span>
          <InterviewTimer startedAt={interview.startedAt} />
        </div>
      </div>

      <ChatMessages messages={messages} aiStreamingId={streamingId} />

      <InputArea
        disabled={aiResponding}
        isFinished={isFinished}
        onSend={handleSend}
        onEnd={handleEnd}
      />
    </div>
  )
}
