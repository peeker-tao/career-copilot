import { useState } from 'react'
import { CheckOutlined, BookOutlined, RightOutlined } from '@ant-design/icons'

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  文档: '#1890ff',
  视频: '#52c41a',
  书籍: '#7c3aed',
}

export interface StageResource {
  name: string
  type: string
  url: string
}

export interface Stage {
  id: string
  title: string
  duration: string
  goal: string
  resources: StageResource[]
  learned: boolean
}

export interface StageCardProps {
  stage: Stage
  index: number
  onToggleLearn: (stageId: string) => void
}

export default function StageCard({ stage, index, onToggleLearn }: StageCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`stage-card ${stage.learned ? 'learned' : ''}`}>
      <div className="stage-header" onClick={() => setExpanded(!expanded)}>
        <div className="stage-index">{index + 1}</div>
        <div className="stage-info">
          <h3 className="stage-title">
            {stage.title}
            <span className="stage-duration">{stage.duration}</span>
          </h3>
          <p className="stage-goal">{stage.goal}</p>
        </div>
        <div className="stage-actions">
          <button
            className={`btn-learn ${stage.learned ? 'learned' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleLearn(stage.id)
            }}
            title={stage.learned ? '标记为未学' : '标记为已学'}
          >
            {stage.learned ? <CheckOutlined /> : <BookOutlined />}
            <span>{stage.learned ? '已学' : '标记已学'}</span>
          </button>
          <RightOutlined
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--text)',
              fontSize: 12,
            }}
          />
        </div>
      </div>

      {expanded && (
        <div className="stage-body">
          <h4 className="resources-title">学习资源</h4>
          <ul className="resources-list">
            {stage.resources.map((res, i) => (
              <li key={i} className="resource-item">
                <div className="resource-info">
                  <span className="resource-name">{res.name}</span>
                  <span
                    className="resource-type"
                    style={{
                      background: `${RESOURCE_TYPE_COLORS[res.type] || '#1890ff'}15`,
                      color: RESOURCE_TYPE_COLORS[res.type] || '#1890ff',
                    }}
                  >
                    {res.type}
                  </span>
                </div>
                <a href={res.url} className="resource-link" target="_blank" rel="noopener noreferrer">
                  查看
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
