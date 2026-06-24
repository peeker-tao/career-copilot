import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import { PlanCard, GeneratePlanForm } from '../../components/career-plan'
import { getCareerPlans } from '@/api/career'
import { toast } from '@/store/useToastStore'
import './CareerPlan.css'

const CareerPlanPage = () => {
  const [plans, setPlans] = useState<Array<{ id: string; targetPosition: string; progress: number; createdAt: string; skills?: string[] }>>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; targetPosition: string; progress: number; createdAt: string; skills?: string[] } | null>(null)

  useEffect(() => {
    let mounted = true
    setTimeout(async () => {
      if (mounted) {
        try {
          const response = await getCareerPlans()
          if (response.code !== 200 && response.code !== 201) {
            throw new Error(response.message || 'Failed to fetch career plans')
          }
          console.log('Fetched career plans:', response)
          setPlans(response.data)
        } catch (error) {
          toast.error('获取职业规划列表失败: ' + (error as Error).message)
        } finally {
          setLoading(false)
        }
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
    setTimeout(async () => {
      try {
        const response = await getCareerPlans()
        if (response.code !== 200 && response.code !== 201) {
          throw new Error(response.message || 'Failed to generate career plan')
        }
        const newPlan = response.data
        setPlans(newPlan)
      } catch (error) {
        toast.error('获取职业规划列表失败: ' + (error as Error).message)
      } finally {
        setLoading(false)
      }
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
