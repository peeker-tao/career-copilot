import { Link } from 'react-router-dom'
import { AimOutlined, CalendarOutlined, TagsOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'

export interface PlanCardPlan {
  id: string
  targetPosition: string
  progress: number
  createdAt: string
  skills: string[]
}

export interface PlanCardProps {
  plan: PlanCardPlan
  onDeleteRequest: (plan: PlanCardPlan) => void
}

export default function PlanCard({ plan, onDeleteRequest }: PlanCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeleteRequest?.(plan)
  }

  return (
    <Link to={`/career-plan/${plan.id}`} className="plan-card">
      <div className="plan-card-top">
        <div className="plan-card-icon">
          <AimOutlined />
        </div>
        <div className="plan-card-info">
          <h3 className="plan-card-title">{plan.targetPosition}</h3>
          <span className="plan-card-date">
            <CalendarOutlined /> {plan.createdAt}
          </span>
        </div>
        <div className="plan-card-actions">
          <button
            className="plan-action-btn view"
            title="查看详情"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/career-plan/${plan.id}`
            }}
          >
            <EyeOutlined />
          </button>
          <button
            className="plan-action-btn delete"
            title="删除规划"
            onClick={handleDelete}
          >
            <DeleteOutlined />
          </button>
        </div>
      </div>

      <div className="plan-card-progress">
        <div className="progress-header">
          <span>学习进度</span>
          <span className="progress-value">{plan.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${plan.progress}%` }}
          />
        </div>
      </div>

      <div className="plan-card-skills">
        <TagsOutlined className="mr-6" />
        {plan.skills.map((skill) => (
          <span key={skill} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  )
}
