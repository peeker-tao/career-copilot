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
import './CareerPlanDetail.css'

const MOCK_DETAIL = {
  id: '1',
  targetPosition: '后端开发工程师',
  progress: 45,
  createdAt: '2026-06-13',
  possessedSkills: ['Java', 'Spring Boot', 'MySQL', 'Git', 'Linux'],
  targetSkills: ['Redis', '消息队列', '微服务架构', 'Docker', 'Kubernetes'],
  stages: [
    {
      id: 's1',
      title: '阶段一：基础巩固',
      duration: '2 周',
      goal: '熟练掌握 Spring Boot 开发框架',
      resources: [
        { name: 'Spring Boot 官方文档', type: '文档', url: '#' },
        { name: '尚硅谷 Spring Boot 教程', type: '视频', url: '#' },
        { name: '《Spring Boot 实战》', type: '书籍', url: '#' },
      ],
      learned: false,
    },
    {
      id: 's2',
      title: '阶段二：中间件进阶',
      duration: '3 周',
      goal: '掌握 Redis、消息队列等主流中间件',
      resources: [
        { name: '《Redis 设计与实现》', type: '书籍', url: '#' },
        { name: 'Kafka 官方文档', type: '文档', url: '#' },
        { name: 'RabbitMQ 实战教程', type: '视频', url: '#' },
      ],
      learned: false,
    },
    {
      id: 's3',
      title: '阶段三：微服务与云原生',
      duration: '4 周',
      goal: '掌握微服务架构设计和容器化部署',
      resources: [
        { name: 'Docker 从入门到实践', type: '文档', url: '#' },
        { name: 'Kubernetes 官方教程', type: '文档', url: '#' },
        { name: 'Spring Cloud Alibaba 教程', type: '视频', url: '#' },
        { name: '《微服务架构设计模式》', type: '书籍', url: '#' },
      ],
      learned: false,
    },
  ],
}

interface Stage {
  id: string
  title: string
  duration: string
  goal: string
  resources: Array<{ name: string; type: string; url: string }>
  learned: boolean
}

interface PlanDetail {
  id: string
  targetPosition: string
  progress: number
  createdAt: string
  possessedSkills: string[]
  targetSkills: string[]
  stages: Stage[]
}

const CareerPlanDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [progress, setProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setPlan({ ...MOCK_DETAIL, id: id ?? MOCK_DETAIL.id })
      setProgress(MOCK_DETAIL.progress)
      setLoading(false)
    }, 400)
  }, [id])

  const handleToggleLearn = (stageId: string) => {
    setPlan((prev) => {
      if (!prev) return null
      return {
        ...prev,
        stages: prev.stages.map((s) =>
          s.id === stageId ? { ...s, learned: !s.learned } : s
        ),
      }
    })
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    setProgress(val)
  }

  if (loading) {
    return (
      <div className="detail-page">
        <Loading skeleton className="pad-24-0" />
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
            {plan.stages.map((stage: Stage, i: number) => (
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
        onConfirm={() => {
          setShowDeleteConfirm(false)
          navigate('/career-plan')
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

export default CareerPlanDetailPage
