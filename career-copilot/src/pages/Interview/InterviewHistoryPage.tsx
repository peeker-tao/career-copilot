import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { HistoryStats, HistoryCard } from '@/components/interview'
import './InterviewHistory.css'

interface InterviewRecord {
  id: string
  position: string
  difficulty: string
  score?: number | null
  date: string
  rounds: number
  duration: string
  status: string
}

const MOCK_INTERVIEWS: InterviewRecord[] = [
  { id: '1', position: '前端开发工程师', difficulty: 'medium', score: 85, date: '2026-06-15', rounds: 8, duration: '28分钟', status: 'completed' },
  { id: '2', position: '后端开发工程师', difficulty: 'hard', score: 92, date: '2026-06-10', rounds: 8, duration: '32分钟', status: 'completed' },
  { id: '3', position: '算法工程师', difficulty: 'easy', score: 78, date: '2026-06-05', rounds: 6, duration: '22分钟', status: 'completed' },
  { id: '4', position: '产品经理', difficulty: 'medium', score: 70, date: '2026-05-28', rounds: 8, duration: '30分钟', status: 'completed' },
  { id: '5', position: '全栈开发工程师', difficulty: 'hard', score: 88, date: '2026-05-20', rounds: 8, duration: '35分钟', status: 'completed' },
  { id: '6', position: '数据分析师', difficulty: 'medium', score: null, date: '2026-06-12', rounds: 3, duration: '12分钟', status: 'interrupted' },
  { id: '7', position: 'DevOps 工程师', difficulty: 'hard', score: null, date: '2026-06-18', rounds: 0, duration: '-', status: 'pending' },
]

export default function InterviewHistoryPage() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (!mounted) return
      try {
        setInterviews([...MOCK_INTERVIEWS])
      } catch {
        if (mounted) setError('加载面试记录失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = () => {
    setInterviews((prev) => prev.filter((i) => i.id !== deleteTarget))
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="history-page">
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="加载失败"
          description={error}
          actionText="重新加载"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">AI 面试</h1>
          <p className="history-subtitle">查看历史面试记录，开始新一轮模拟面试</p>
        </div>
        <button
          className="btn-start-interview"
          onClick={() => navigate('/interview/new')}
        >
          <PlusOutlined /> 开始新面试
        </button>
      </div>

      <HistoryStats interviews={interviews} />

      <div className="history-toolbar">
        <span className="toolbar-count">共 {interviews.length} 条记录</span>
      </div>

      {interviews.length === 0 ? (
        <EmptyState
          icon={<MessageOutlined />}
          title="暂无面试记录"
          description="开始你的第一次模拟面试吧"
          actionText="开始新面试"
          onAction={() => navigate('/interview/new')}
        />
      ) : (
        <div className="history-list">
          {interviews.map((item) => (
            <HistoryCard
              key={item.id}
              interview={item}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="删除面试记录"
        message="删除后无法恢复，确定要删除这条记录吗？"
        type="danger"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
