import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  PlusOutlined,
  RightOutlined,
  DeleteOutlined,
  EyeOutlined,
  AimOutlined,
  CalendarOutlined,
  TagsOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import './CareerPlan.css'

/* Mock 数据 */
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

const POSITION_SUGGESTIONS = [
  '后端开发工程师',
  '前端开发工程师',
  '全栈开发工程师',
  '算法工程师',
  '数据分析师',
  '产品经理',
  '测试工程师',
  'DevOps 工程师',
  '嵌入式开发工程师',
  '机器学习工程师',
  'Android 开发工程师',
  'iOS 开发工程师',
  '安全工程师',
  '运维工程师',
  '数据库管理员',
]

/* 子组件：现有规划卡片列表 */
function PlanCard({ plan, onDelete, onDeleteRequest }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = (e) => {
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
        <TagsOutlined style={{ marginRight: 6 }} />
        {plan.skills.map((skill) => (
          <span key={skill} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  )
}

/* 子组件：生成新规划表单 */
function GeneratePlanForm({ onGenerated }) {
  const navigate = useNavigate()
  const [position, setPosition] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const filteredSuggestions = useMemo(
    () =>
      position.trim()
        ? POSITION_SUGGESTIONS.filter((p) => p.includes(position.trim()))
        : [],
    [position]
  )
  const [inputMethod, setInputMethod] = useState('manual') // 'manual' | 'upload'
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState([])
  const [generating, setGenerating] = useState(false)
  const [fileName, setFileName] = useState('')
  const wrapperRef = useRef(null)

  // 点击外部关闭建议列表
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handleGenerate = async () => {
    if (!position.trim()) return

    setGenerating(true)
    try {
      // 模拟生成请求 POST /career/plan
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const newPlanId = String(Date.now())
      onGenerated()
      navigate(`/career-plan/${newPlanId}`)
    } catch (err) {
      console.error('生成规划失败:', err)
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = position.trim() && (inputMethod === 'manual' || fileName)

  return (
    <div className="generate-section">
      <h2 className="section-title">🎯 生成新职业规划</h2>
      <p className="section-subtitle">输入目标岗位，AI 将为你定制专属学习路线</p>

      <div className="generate-form">
        {/* 目标岗位 */}
        <div className="form-group" ref={wrapperRef}>
          <label className="form-label">目标岗位</label>
          <div className="autocomplete-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="例如：后端开发工程师"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              onFocus={() => {
                if (filteredSuggestions.length > 0) setShowSuggestions(true)
              }}
            />
            {showSuggestions && (
              <ul className="suggestions-list">
                {filteredSuggestions.map((s) => (
                  <li
                    key={s}
                    className="suggestion-item"
                    onClick={() => {
                      setPosition(s)
                      setShowSuggestions(false)
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 输入方式切换 */}
        <div className="form-group">
          <label className="form-label">当前技能评估</label>
          <div className="method-tabs">
            <button
              className={`method-tab ${inputMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setInputMethod('manual')}
            >
              <TagsOutlined /> 手动填写
            </button>
            <button
              className={`method-tab ${inputMethod === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMethod('upload')}
            >
              <UploadOutlined /> 上传简历
            </button>
          </div>

          {inputMethod === 'manual' ? (
            <div className="skills-input-area">
              <div className="skills-tags">
                {skills.map((skill) => (
                  <span key={skill} className="skill-tag removable">
                    {skill}
                    <button
                      className="skill-remove"
                      onClick={() => removeSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="skills-input-row">
                <input
                  type="text"
                  className="form-input skill-input"
                  placeholder="输入技能后按 Enter 添加"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <button className="btn-secondary" onClick={addSkill}>
                  添加
                </button>
              </div>
              <p className="form-hint">
                例如：Java、Spring Boot、MySQL、Redis、Docker
              </p>
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-dropzone">
                <UploadOutlined style={{ fontSize: 28, color: 'var(--accent)' }} />
                <p>
                  {fileName
                    ? `已选择：${fileName}`
                    : '点击或拖拽简历文件到此处'}
                </p>
                <p className="form-hint">支持 PDF、DOCX 格式，最大 10MB</p>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  id="resume-upload"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) setFileName(file.name)
                  }}
                />
                <button
                  className="btn-secondary"
                  onClick={() =>
                    document.getElementById('resume-upload').click()
                  }
                >
                  选择文件
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 生成按钮 */}
        <button
          className="btn-generate"
          disabled={!canGenerate || generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <LoadingOutlined style={{ marginRight: 8 }} />
              AI 正在生成中...
            </>
          ) : (
            <>
              <PlusOutlined style={{ marginRight: 8 }} />
              生成规划
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* 主组件 */
const CareerPlanPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 初始加载（loading 初始为 true，无需在 effect 内同步 setLoading）
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

  const handleDelete = (id) => {
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
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">职业规划</h1>
          <p className="page-desc">制定专属学习路线，稳步迈向目标岗位</p>
        </div>
        <Link to="/career-plan/market-insight" className="market-link">
          市场洞察 <RightOutlined style={{ fontSize: 12 }} />
        </Link>
      </div>

      <div className="page-layout">
        {/* 左侧：现有规划列表 */}
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
                  onDelete={handleDelete}
                  onDeleteRequest={(p) => setDeleteTarget(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧：生成新规划 */}
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
