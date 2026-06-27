import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagsOutlined, FileTextOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { generateCareerPlan } from '@/api/career'
import { useResumeStore } from '@/store/useResumeStore'
import { toast } from '@/store/useToastStore'

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

export interface GeneratePlanFormProps {
  onGenerated: (targetPosition: string, skills: string[]) => void
}

export default function GeneratePlanForm({ onGenerated }: GeneratePlanFormProps) {
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
  const [inputMethod, setInputMethod] = useState<'manual' | 'upload'>('manual')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Resume selector
  const resumes = useResumeStore((s) => s.resumes)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [showResumeDropdown, setShowResumeDropdown] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handleGenerate = async () => {
    if (!position.trim()) return

    setGenerating(true)
    try {
      const response = await generateCareerPlan({
        targetPosition: position.trim(),
        skills: skills,
      })
      if (response.code !== 200 && response.code !== 201) {
        throw new Error(response.message || 'Failed to generate career plan')
      }
      const newPlan = response.data
      onGenerated(position.trim(), skills)
      navigate(`/career-plan/${newPlan.id}`)
    } catch (error) {
      const msg = (error as Error).message || '生成失败，请重试'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }

  }

  const canGenerate = position.trim() && (inputMethod === 'manual' || inputMethod === 'resume')

  return (
    <div className="generate-section">
      <h2 className="section-title">🎯 生成新职业规划</h2>
      <p className="section-subtitle">输入目标岗位，AI 将为你定制专属学习路线</p>

      <div className="generate-form">
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
              className={`method-tab ${inputMethod === 'resume' ? 'active' : ''}`}
              onClick={() => setInputMethod('resume')}
            >
              <FileTextOutlined /> 选择简历
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
                  <PlusOutlined /> 添加
                </button>
              </div>
              <p className="form-hint">
                例如：Java、Spring Boot、MySQL、Redis、Docker
              </p>
            </div>
          ) : (
            <div className="upload-area">
              {/* 简历选择器 */}
              <div className="resume-selector">
                <button
                  className={`resume-selector-trigger ${selectedResumeId ? 'has-value' : ''}`}
                  onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                  type="button"
                >
                  <FileTextOutlined />
                  <span className="resume-selector-label">
                    {selectedResumeId
                      ? resumes.find((r) => r.id === selectedResumeId)?.title || '已选择简历'
                      : '选择一份简历导入技能'}
                  </span>
                  <span className="resume-selector-arrow">{showResumeDropdown ? '▲' : '▼'}</span>
                </button>
                {showResumeDropdown && (
                  <div className="resume-selector-dropdown">
                    {resumes
                      .filter((r) => r.status === 'completed')
                      .map((r) => (
                        <div
                          key={r.id}
                          className={`resume-option ${selectedResumeId === r.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedResumeId(r.id)
                            setShowResumeDropdown(false)
                            // 将简历中的技能填入 skills
                            setSkills(r.skills || [])
                          }}
                        >
                          <span className="resume-option-label">{r.name || r.title}</span>
                          <span className="resume-option-desc">
                            {r.skills.slice(0, 4).join('、')}{r.skills.length > 4 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                    {resumes.filter((r) => r.status === 'completed').length === 0 && (
                      <div className="resume-option" style={{ cursor: 'default' }}>
                        <span className="resume-option-label" style={{ color: 'var(--text)' }}>
                          暂无已解析的简历
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* 已选简历的技能标签 */}
              {selectedResumeId && (() => {
                const selected = resumes.find((r) => r.id === selectedResumeId)
                if (!selected || !selected.skills.length) return null
                return (
                  <div className="skills-tags" style={{ marginTop: 8 }}>
                    <span className="form-hint" style={{ width: '100%', marginBottom: 4 }}>
                      从简历导入的技能：
                    </span>
                    {selected.skills.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        <button
          className="btn-generate"
          disabled={!canGenerate || generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <LoadingOutlined className="mr-8" />
              AI 正在生成中...
            </>
          ) : (
            <>
<PlusOutlined className="mr-8" />
               生成规划
            </>
          )}
        </button>
      </div>
    </div>
  )
}
