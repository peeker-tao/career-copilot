import { MessageOutlined, FileTextOutlined, StarOutlined, ScheduleOutlined } from '@ant-design/icons'

export interface Stats {
  totalInterviews: number
  avgScore: number
  resumeCount: number
  activePlans: number
}

export interface StatsCardsProps {
  stats: Stats | null
  loading: boolean
}

const items = [
  { icon: <MessageOutlined />, color: 'blue', label: '面试次数', key: 'totalInterviews' as const },
  { icon: <StarOutlined />, color: 'green', label: '平均评分', key: 'avgScore' as const, suffix: '分' },
  { icon: <FileTextOutlined />, color: 'purple', label: '简历数量', key: 'resumeCount' as const },
  { icon: <ScheduleOutlined />, color: 'orange', label: '进行中规划', key: 'activePlans' as const },
]

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="loading-skeleton" style={{ width: '100%', padding: 0 }}>
              <div className="skeleton-item" style={{ height: 48, width: 48, borderRadius: 12 }} />
              <div className="skeleton-item" style={{ width: '60%', marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="stats-grid">
      {items.map((item) => {
        const value = stats?.[item.key]
        return (
          <div key={item.key} className="stat-card">
            <div className={`stat-icon ${item.color}`}>{item.icon}</div>
            <div className="stat-info">
              <div className="stat-number">
                {value ?? '—'}
                {item.suffix ?? ''}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
