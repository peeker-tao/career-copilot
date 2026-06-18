import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import { PlanCard, GeneratePlanForm } from '../../components/career-plan'
import './CareerPlan.css'

const MOCK_PLANS = [
  {
    id: '1',
    targetPosition: '后端开发工程师',
    progress: 45,
    createdAt: '2026-06-13',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Git'],
  },
  {
    id: '2',
    targetPosition: '前端开发工程师',
    progress: 20,
    createdAt: '2026-06-10',
    skills: ['JavaScript', 'React', 'CSS'],
  },
  {
    id: '3',
    targetPosition: '全栈开发工程师',
    progress: 60,
    createdAt: '2026-05-28',
    skills: ['Java', 'React', 'Node.js', 'Docker', 'PostgreSQL'],
  },
]

const CareerPlanPage = () => {
  const [plans, setPlans] = useState<Array<{ id: string; targetPosition: string; progress: number; createdAt: string; skills: string[] }>>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; targetPosition: string; progress: number; createdAt: string; skills: string[] } | null>(null)

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (mounted) {
        setPlans([...MOCK_PLANS])
        setLoading(false)
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id))
    setDeleteTarget(null)
  }

  const handleGenerated = () => {
    setLoading(true)
    setTimeout(() => {
      setPlans([...MOCK_PLANS])
      setLoading(false)
    }, 400)
  }

  return (
    <div className="career-plan-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">职业规划</h1>
          <p className="page-desc">制定专属学习路线，稳步迈向目标岗位</p>
        </div>
        <Link to="/career-plan/market-insight" className="market-link">
          市场洞察 <RightOutlined className="fs-12" />
        </Link>
      </div>

      <div className="page-layout">
        <div className="plans-column">
          <h2 className="section-title">
            我的规划
            <span className="plans-count">{plans.length}</span>
          </h2>

          {loading ? (
            <Loading skeleton />
          ) : plans.length === 0 ? (
            <EmptyState
              title="还没有职业规划"
              description="去右侧生成你的第一个职业规划吧！"
            />
          ) : (
            <div className="plans-list">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDeleteRequest={(p) => setDeleteTarget(p)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="generate-column">
          <GeneratePlanForm onGenerated={handleGenerated} />
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="确认删除"
        message={deleteTarget ? `确认删除「${deleteTarget.targetPosition}」的职业规划？删除后无法恢复。` : ''}
        type="danger"
        confirmText="删除"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default CareerPlanPage
