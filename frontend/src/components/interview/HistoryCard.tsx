import { Link } from 'react-router-dom'
import { ClockCircleOutlined, CodeOutlined, DeleteOutlined } from '@ant-design/icons'

interface InterviewData {
  id: string
  position: string
  difficulty: string
  score?: number | null
  date: string
  rounds: number
  duration: string
  status: string
}

export interface HistoryCardProps {
  interview: InterviewData
  onDelete: (id: string) => void
}

const DIFFICULTY_MAP: Record<string, { label: string; cls: string }> = {
  easy: { label: '简单', cls: 'easy' },
  medium: { label: '中等', cls: 'medium' },
  hard: { label: '困难', cls: 'hard' },
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: '已完成', cls: 'completed' },
  interrupted: { label: '未完成', cls: 'interrupted' },
  pending: { label: '待开始', cls: 'pending' },
}

export default function HistoryCard({ interview, onDelete }: HistoryCardProps) {
  const diff = DIFFICULTY_MAP[interview.difficulty] || { label: '未知', cls: 'medium' }
  const statusInfo = STATUS_MAP[interview.status] || { label: '未知', cls: '' }

  // 统一进入面试房间，由房间内的 InputArea 根据状态决定是否允许继续答题
  const targetPath = `/interview/${interview.id}`

  return (
    <Link to={targetPath} className="history-card">
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
