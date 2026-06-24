import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagsOutlined, UploadOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { generateCareerPlan } from '@/api/career'

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
  const [fileName, setFileName] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
      console.error('Error generating career plan:', error)
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
                  <PlusOutlined /> 添加
                </button>
              </div>
              <p className="form-hint">
                例如：Java、Spring Boot、MySQL、Redis、Docker
              </p>
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-dropzone">
                <UploadOutlined className="fs-28 text-accent" />
                <p>
                  {fileName
                    ? `已选择：${fileName}`
                    : '点击或拖拽简历文件到此处'}
                </p>
                <p className="form-hint">支持 PDF、DOCX 格式，最大 10MB</p>
                <input
                  title="resume-upload"
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden-input"
                  id="resume-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFileName(file.name)
                  }}
                />
                <button
                  className="btn-secondary"
                  onClick={() =>
                    (document.getElementById('resume-upload') as HTMLInputElement)?.click()
                  }
                >
                  选择文件
                </button>
              </div>
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
