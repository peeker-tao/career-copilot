import { useMemo } from 'react'
import { MessageOutlined, StarOutlined } from '@ant-design/icons'

interface InterviewItem {
  status: string
  score?: number | null
}

/** 预计算好的全量统计值，传了就不再从 interviews 推算 */
export interface InterviewStats {
  total: number
  completed: number
  avgScore: number
  bestScore: number
}

export interface HistoryStatsProps {
  interviews: InterviewItem[]
  /** 全量统计值，优先使用 */
  stats?: InterviewStats
}

export default function HistoryStats({ interviews, stats: statsProp }: HistoryStatsProps) {
  const stats = useMemo(() => {
    if (statsProp) return statsProp
    const completed = interviews.filter((i) => i.status === 'completed')
    const avgScore = completed.length
      ? Math.round(completed.reduce((s, i) => s + (i.score ?? 0), 0) / completed.length)
      : 0
    return {
      total: interviews.length,
      completed: completed.length,
      avgScore,
      bestScore: completed.length ? Math.max(...completed.map((i) => i.score ?? 0)) : 0,
    }
  }, [interviews, statsProp])

  const items = [
    { label: '总面试', value: stats.total, color: '#1890ff', icon: <MessageOutlined /> },
    { label: '已完成', value: stats.completed, color: '#52c41a', icon: <StarOutlined /> },
    { label: '平均分', value: stats.avgScore, suffix: '分', color: '#7c3aed', icon: <MessageOutlined /> },
    { label: '最高分', value: stats.bestScore, suffix: '分', color: '#fa8c16', icon: <StarOutlined /> },
  ]

  return (
    <div className="history-stats">
      {items.map((item) => (
        <div key={item.label} className="history-stat-card">
          <div
            className="history-stat-icon"
            style={{ background: `${item.color}15`, color: item.color }}
          >
            {item.icon}
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
