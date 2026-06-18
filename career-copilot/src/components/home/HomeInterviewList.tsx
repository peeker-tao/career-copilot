import { MessageOutlined, CodeOutlined } from '@ant-design/icons'

export interface Interview {
  id: number
  position: string
  difficulty: string
  score: number
  date: string
}

export interface HomeInterviewListProps {
  interviews: Interview[]
  loading: boolean
}

const DIFFICULTY_MAP: Record<string, { label: string; cls: string }> = {
  easy: { label: '简单', cls: 'easy' },
  medium: { label: '中等', cls: 'medium' },
  hard: { label: '困难', cls: 'hard' },
}

const HomeInterviewList: React.FC<HomeInterviewListProps> = ({ interviews, loading }) => {
  if (loading) {
    return (
      <div className="loading-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-item" style={{ height: 52, marginBottom: 8 }} />
        ))}
      </div>
    )
  }

  if (!interviews || interviews.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <MessageOutlined />
        </div>
        <p>暂无面试记录，快去开始第一次面试吧！</p>
      </div>
    )
  }

  return (
    <ul className="interview-list">
      {interviews.map((item) => {
        const diff = DIFFICULTY_MAP[item.difficulty] || { label: '未知', cls: 'medium' }
        return (
          <li key={item.id} className="interview-item">
            <div className="position-icon">
              <CodeOutlined />
            </div>
            <div className="item-info">
              <div className="item-title">{item.position}</div>
              <div className="item-meta">
                <span className={`difficulty-tag ${diff.cls}`}>{diff.label}</span>
                <span>{item.date}</span>
              </div>
            </div>
            <div className="item-score">{item.score}</div>
          </li>
        )
      })}
    </ul>
  )
}

export default HomeInterviewList
