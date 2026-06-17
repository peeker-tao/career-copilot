import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  AimOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import './CareerPlanDetail.css'

/* Mock 数据 */
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

const RESOURCE_TYPE_COLORS = {
  文档: '#1890ff',
  视频: '#52c41a',
  书籍: '#7c3aed',
}

/* 子组件：阶段卡片 */
function StageCard({ stage, index, onToggleLearn }) {
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
                      background: `${RESOURCE_TYPE_COLORS[res.type]}15`,
                      color: RESOURCE_TYPE_COLORS[res.type],
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

/* 主组件 */
const CareerPlanDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [progress, setProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    // 模拟 GET /career/plans/:id
    setTimeout(() => {
      setPlan({ ...MOCK_DETAIL, id })
      setProgress(MOCK_DETAIL.progress)
      setLoading(false)
    }, 400)
  }, [id])

  const handleToggleLearn = (stageId) => {
    setPlan((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId ? { ...s, learned: !s.learned } : s
      ),
    }))
  }

  const handleProgressChange = (e) => {
    const val = parseInt(e.target.value, 10)
    setProgress(val)
  }

  if (loading) {
    return (
      <div className="detail-page">
        <Loading skeleton style={{ padding: '24px 0' }} />
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
      {/* 返回 + 头部操作 */}
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

      {/* 规划标题 */}
      <div className="detail-header">
        <div className="detail-icon">
          <AimOutlined />
        </div>
        <div className="detail-header-info">
          <h1 className="detail-title">{plan.targetPosition}</h1>
          <span className="detail-date">创建于 {plan.createdAt}</span>
        </div>
      </div>

      {/* 进度控制 */}
      <div className="progress-control">
        <div className="progress-control-header">
          <span>整体进度</span>
          <span className="progress-value">{progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="progress-slider"
        />
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="detail-layout">
        {/* 主内容：分阶段学习路线 */}
        <div className="stages-column">
          <h2 className="section-title">📚 分阶段学习路线</h2>
          <div className="stages-list">
            {plan.stages.map((stage, i) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={i}
                onToggleLearn={handleToggleLearn}
              />
            ))}
          </div>
        </div>

        {/* 侧边栏：技能差距分析 */}
        <div className="skills-column">
          <h2 className="section-title">📊 技能差距分析</h2>

          <div className="skill-gap-section">
            <h3 className="skill-gap-title">
              <CheckOutlined style={{ color: '#52c41a' }} /> 已掌握
            </h3>
            <div className="skill-gap-tags">
              {plan.possessedSkills.map((skill) => (
                <span key={skill} className="gap-tag possessed">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="skill-gap-section">
            <h3 className="skill-gap-title">
              <BookOutlined style={{ color: 'var(--accent)' }} /> 待学习
            </h3>
            <div className="skill-gap-tags">
              {plan.targetSkills.map((skill) => (
                <span key={skill} className="gap-tag target">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="skill-summary">
            <div className="summary-stat">
              <span className="summary-num">{plan.possessedSkills.length}</span>
              <span className="summary-label">已掌握</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-stat">
              <span className="summary-num">{plan.targetSkills.length}</span>
              <span className="summary-label">待学习</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-stat">
              <span className="summary-num highlight">
                {Math.round(
                  (plan.possessedSkills.length /
                    (plan.possessedSkills.length + plan.targetSkills.length)) *
                    100
                )}
                %
              </span>
              <span className="summary-label">技能覆盖率</span>
            </div>
          </div>

          <Link to="/career-plan/market-insight" className="market-insight-card">
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                查看市场洞察
              </div>
              <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>
                了解岗位需求趋势和薪资范围
              </div>
            </div>
            <RightOutlined style={{ color: 'var(--accent)' }} />
          </Link>
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
