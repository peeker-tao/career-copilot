import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  AimOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import { StageCard, SkillGapPanel } from '../../components/career-plan'
import type { CareerPlan, StudyStage } from '@/types/career'
import { getCareerPlanById, deleteCareerPlan, updatePlanProgress } from '@/api/career'
import { toast } from '@/store/useToastStore'
import './CareerPlan.css'
import './CareerPlanDetail.css'



const CareerPlanDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<CareerPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCareerPlan = async () => {
      try {
        const response = await getCareerPlanById(id)
        if (response.code !== 200) {
          throw new Error(response.message || 'Failed to fetch career plan')
        }
        const careerPlan = response.data
        setPlan(careerPlan)
        setError(null)
        setProgress(careerPlan.progress)
      } catch (err) {
        console.error('Failed to fetch career plan detail:', err)
        const errorMessage = err instanceof Error ? err.message : '加载规划失败，请重试'
        setError(errorMessage)
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCareerPlan()
  }, [id])

  const handleToggleLearn = (stageId: string) => {
    setPlan((prev) => {
      if (!prev) return prev
      const updated = {
        ...prev,
        stages: prev.stages.map((s) =>
          s.id === stageId ? { ...s, learned: !s.learned } : s
        ),
      }
      // 计算进度并调用 API 持久化
      const learnedCount = updated.stages.filter((s) => s.learned).length
      const newProgress = updated.stages.length > 0
        ? Math.round((learnedCount / updated.stages.length) * 100)
        : 0
      setProgress(newProgress)
      updatePlanProgress(id, newProgress).catch((err) =>
        console.error('更新进度失败:', err)
      )
      return updated
    })
  }

  // handleProgressChange 保留以备将来接入 PATCH 接口
  // const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const val = parseInt(e.target.value, 10)
  //   setProgress(val)
  // }

  if (loading) {
    return (
      <div className="detail-page">
        <Loading skeleton className="pad-24-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="detail-page">
        <EmptyState
          title="加载失败"
          description={error}
          actionText="返回职业规划"
          onAction={() => navigate('/career-plan')}
        />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="detail-page">
        <EmptyState
          title="规划不存在或已被删除"
          actionText="返回职业规划"
          onAction={() => navigate('/career-plan')}
        />
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-topbar">
        <Link to="/career-plan" className="back-link">
          <ArrowLeftOutlined /> 返回
        </Link>
        <div className="detail-actions">
          <button className="plan-action-btn view" title="编辑">
            <EditOutlined />
          </button>
          <button
            className="plan-action-btn delete"
            title="删除"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <DeleteOutlined />
          </button>
        </div>
      </div>

      <div className="detail-header">
        <div className="detail-icon">
          <AimOutlined />
        </div>
        <div className="detail-header-info">
          <h1 className="detail-title">{plan.targetPosition}</h1>
          <span className="detail-date">创建于 {plan.createdAt}</span>
        </div>
      </div>

      <div className="progress-control">
        <div className="progress-control-header">
          <span>整体进度</span>
          <span className="progress-value">{progress}%</span>
        </div>
        {/* <input
          title='progress'
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="progress-slider"
        /> */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="detail-layout">
        <div className="stages-column">
          <h2 className="section-title">📚 分阶段学习路线</h2>
          <div className="stages-list">
            {plan.stages.map((stage: StudyStage, i: number) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={i}
                onToggleLearn={handleToggleLearn}
              />
            ))}
          </div>
        </div>

        <div className="skills-column">
          <h2 className="section-title">📊 技能差距分析</h2>
          <SkillGapPanel
            possessedSkills={plan.possessedSkills}
            targetSkills={plan.targetSkills}
          />
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="确认删除"
        message="删除后无法恢复，确定要删除此规划吗？"
        type="danger"
        confirmText="删除"
        onConfirm={async () => {
          setDeleting(true)
          try {
            await deleteCareerPlan(id)
          } catch (err) {
            toast.error('删除规划失败: ' + (err as Error).message)
          }
          setDeleting(false)
          setShowDeleteConfirm(false)
          navigate('/career-plan')
        }}
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

export default CareerPlanDetailPage
