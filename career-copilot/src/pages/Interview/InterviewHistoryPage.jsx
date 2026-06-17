import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageOutlined,
  RightOutlined,
  PlusOutlined,
  CodeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  StarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import './InterviewHistory.css'

/* Mock 数据 */
const MOCK_INTERVIEWS = [
  { id: '1', position: '前端开发工程师', difficulty: 'medium', score: 85, date: '2026-06-15', rounds: 8, duration: '28分钟', status: 'completed' },
  { id: '2', position: '后端开发工程师', difficulty: 'hard', score: 92, date: '2026-06-10', rounds: 8, duration: '32分钟', status: 'completed' },
  { id: '3', position: '算法工程师', difficulty: 'easy', score: 78, date: '2026-06-05', rounds: 6, duration: '22分钟', status: 'completed' },
  { id: '4', position: '产品经理', difficulty: 'medium', score: 70, date: '2026-05-28', rounds: 8, duration: '30分钟', status: 'completed' },
  { id: '5', position: '全栈开发工程师', difficulty: 'hard', score: 88, date: '2026-05-20', rounds: 8, duration: '35分钟', status: 'completed' },
  { id: '6', position: '数据分析师', difficulty: 'medium', score: null, date: '2026-06-12', rounds: 3, duration: '12分钟', status: 'interrupted' },
  { id: '7', position: 'DevOps 工程师', difficulty: 'hard', score: null, date: '2026-06-18', rounds: 0, duration: '-', status: 'pending' },
]

const DIFFICULTY_MAP = {
  easy: { label: '简单', cls: 'easy' },
  medium: { label: '中等', cls: 'medium' },
  hard: { label: '困难', cls: 'hard' },
}

const STATUS_MAP = {
  completed: { label: '已完成', cls: 'completed' },
  interrupted: { label: '未完成', cls: 'interrupted' },
  pending: { label: '待开始', cls: 'pending' },
}

/* 统计头部 */
function StatsBar({ interviews }) {
  const stats = useMemo(() => {
    const completed = interviews.filter((i) => i.status === 'completed')
    const avgScore = completed.length
      ? Math.round(completed.reduce((s, i) => s + i.score, 0) / completed.length)
      : 0
    return {
      total: interviews.length,
      completed: completed.length,
      avgScore,
      bestScore: completed.length ? Math.max(...completed.map((i) => i.score)) : 0,
    }
  }, [interviews])

  const items = [
    { label: '总面试', value: stats.total, color: '#1890ff' },
    { label: '已完成', value: stats.completed, color: '#52c41a' },
    { label: '平均分', value: stats.avgScore, suffix: '分', color: '#7c3aed' },
    { label: '最高分', value: stats.bestScore, suffix: '分', color: '#fa8c16' },
  ]

  return (
    <div className="history-stats">
      {items.map((item) => (
        <div key={item.label} className="history-stat-card">
          <div
            className="history-stat-icon"
            style={{ background: `${item.color}15`, color: item.color }}
          >
            {item.label === '总面试' && <MessageOutlined />}
            {item.label === '已完成' && <StarOutlined />}
            {item.label === '平均分' && <MessageOutlined />}
            {item.label === '最高分' && <StarOutlined />}
          </div>
          <div className="history-stat-info">
            <div className="history-stat-value">
              {item.value}{item.suffix ?? ''}
            </div>
            <div className="history-stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* 单条面试记录 */
function InterviewCard({ interview, onDelete }) {
  const diff = DIFFICULTY_MAP[interview.difficulty] || { label: '未知', cls: 'medium' }
  const statusInfo = STATUS_MAP[interview.status] || { label: '未知', cls: '' }

  return (
    <Link to={`/interview/${interview.id}`} className="history-card">
      <div className="history-card-left">
        <div className="history-card-icon">
          <CodeOutlined />
        </div>
        <div className="history-card-info">
          <div className="history-card-title">{interview.position}</div>
          <div className="history-card-meta">
            <span className={`difficulty-tag ${diff.cls}`}>{diff.label}</span>
            <span className="meta-sep">·</span>
            <span>{interview.date}</span>
            <span className="meta-sep">·</span>
            <span>{interview.rounds} 轮</span>
            <span className="meta-sep">·</span>
            <span><ClockCircleOutlined /> {interview.duration}</span>
          </div>
        </div>
      </div>
      <div className="history-card-right">
        <span className={`status-tag ${statusInfo.cls}`}>{statusInfo.label}</span>
        {interview.score != null && (
          <span className="history-card-score">{interview.score}<small>分</small></span>
        )}
        <button
          className="card-delete-btn"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(interview.id)
          }}
          title="删除记录"
        >
          <DeleteOutlined />
        </button>
      </div>
    </Link>
  )
}

/* 主组件 */
const InterviewHistoryPage = () => {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const confirmDelete = () => {
    setInterviews((prev) => prev.filter((i) => i.id !== deleteTarget))
    setDeleteTarget(null)
  }

  /* --- 加载状态 --- */
  if (loading) {
    return (
      <div className="history-page">
        <Loading skeleton rows={6} style={{ padding: '24px 0' }} />
      </div>
    )
  }

  /* --- 错误状态 --- */
  if (error) {
    return (
      <div className="history-page">
        <EmptyState
          icon={ExclamationCircleOutlined}
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
      {/* 页面标题 */}
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

      {/* 统计卡片 */}
      <StatsBar interviews={interviews} />

      {/* 排序筛选 */}
      <div className="history-toolbar">
        <span className="toolbar-count">共 {interviews.length} 条记录</span>
      </div>

      {/* 面试列表 */}
      {interviews.length === 0 ? (
        <EmptyState
          icon={MessageOutlined}
          title="暂无面试记录"
          description="开始你的第一次模拟面试吧"
          actionText="开始新面试"
          onAction={() => navigate('/interview/new')}
        />
      ) : (
        <div className="history-list">
          {interviews.map((item) => (
            <InterviewCard
              key={item.id}
              interview={item}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 删除确认弹窗 */}
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

export default InterviewHistoryPage
