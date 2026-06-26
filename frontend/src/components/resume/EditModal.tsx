import { useState } from 'react'
import {
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ParsedResumeData, Education, Experience, Project } from '@/types/resume'

export interface EditModalProps {
  parsedData: ParsedResumeData
  onSave: (data: ParsedResumeData) => void
  onClose: () => void
}

const emptyEducation: Education = { school: '', major: '', degree: '', period: '' }
const emptyExperience: Experience = { company: '', position: '', period: '', description: '' }
const emptyProject: Project = { name: '', role: '', techStack: [], description: '' }

const EditModal = ({ parsedData, onSave, onClose }: EditModalProps) => {
  const [form, setForm] = useState<ParsedResumeData>({
    basicInfo: { ...parsedData.basicInfo },
    education: [...(parsedData.education || [])],
    experience: [...(parsedData.experience || [])],
    projects: [...(parsedData.projects || [])],
    skills: [...(parsedData.skills || [])],
  })
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const handleBasicChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }))
  }

  // --- education ---
  const updateEducation = (i: number, patch: Partial<Education>) => {
    setForm((prev) => {
      const list = [...prev.education]
      list[i] = { ...list[i], ...patch }
      return { ...prev, education: list }
    })
  }
  const addEducation = () => setForm((prev) => ({ ...prev, education: [...prev.education, { ...emptyEducation }] }))
  const removeEducation = (i: number) => setForm((prev) => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }))

  // --- experience ---
  const updateExperience = (i: number, patch: Partial<Experience>) => {
    setForm((prev) => {
      const list = [...prev.experience]
      list[i] = { ...list[i], ...patch }
      return { ...prev, experience: list }
    })
  }
  const addExperience = () => setForm((prev) => ({ ...prev, experience: [...prev.experience, { ...emptyExperience }] }))
  const removeExperience = (i: number) => setForm((prev) => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }))

  // --- projects ---
  const updateProject = (i: number, patch: Partial<Project>) => {
    setForm((prev) => {
      const list = [...prev.projects]
      list[i] = { ...list[i], ...patch }
      return { ...prev, projects: list }
    })
  }
  const addProject = () => setForm((prev) => ({ ...prev, projects: [...prev.projects, { ...emptyProject }] }))
  const removeProject = (i: number) => setForm((prev) => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }))

  // --- skills ---
  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || form.skills.includes(s)) return
    setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }))
    setSkillInput('')
  }
  const removeSkill = (s: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((v) => v !== s) }))
  }
  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSaving(false)
    onSave(form)
  }

  const renderFieldRow = (label: string, children: React.ReactNode) => (
    <div className="edit-field">
      <label>{label}</label>
      {children}
    </div>
  )

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal edit-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>编辑简历信息</h3>
          <button className="edit-modal-close" onClick={onClose} title="关闭">
            <CloseOutlined />
          </button>
        </div>

        {/* ---- 基本信息 ---- */}
        <div className="edit-section">
          <h4 className="edit-section-title">基本信息</h4>
          {renderFieldRow('姓名', <input value={form.basicInfo.name || ''} onChange={(e) => handleBasicChange('name', e.target.value)} placeholder="请输入姓名" />)}
          {renderFieldRow('手机号', <input value={form.basicInfo.phone || ''} onChange={(e) => handleBasicChange('phone', e.target.value)} placeholder="请输入手机号" />)}
          {renderFieldRow('邮箱', <input value={form.basicInfo.email || ''} onChange={(e) => handleBasicChange('email', e.target.value)} placeholder="请输入邮箱" />)}
        </div>

        {/* ---- 教育背景 ---- */}
        <div className="edit-section">
          <div className="edit-section-header">
            <h4 className="edit-section-title">教育背景</h4>
            <button className="list-add-btn" onClick={addEducation}><PlusOutlined /> 添加</button>
          </div>
          {form.education.map((edu, i) => (
            <div key={i} className="list-item-card">
              <div className="list-item-actions">
                <span className="list-item-index">#{i + 1}</span>
                <button className="list-remove-btn" onClick={() => removeEducation(i)} title="删除"><DeleteOutlined /></button>
              </div>
              <div className="list-item-grid">
                {renderFieldRow('学校',  <input value={edu.school} onChange={(e) => updateEducation(i, { school: e.target.value })} placeholder="学校名称" />)}
                {renderFieldRow('专业',  <input value={edu.major}  onChange={(e) => updateEducation(i, { major: e.target.value })}  placeholder="专业" />)}
                {renderFieldRow('学位',  <input value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} placeholder="学位" />)}
                {renderFieldRow('时间段',<input value={edu.period} onChange={(e) => updateEducation(i, { period: e.target.value })} placeholder="如 2022-2026" />)}
              </div>
            </div>
          ))}
          {form.education.length === 0 && <p className="list-empty-hint">暂无，点击"添加"补充</p>}
        </div>

        {/* ---- 工作经历 ---- */}
        <div className="edit-section">
          <div className="edit-section-header">
            <h4 className="edit-section-title">工作经历</h4>
            <button className="list-add-btn" onClick={addExperience}><PlusOutlined /> 添加</button>
          </div>
          {form.experience.map((exp, i) => (
            <div key={i} className="list-item-card">
              <div className="list-item-actions">
                <span className="list-item-index">#{i + 1}</span>
                <button className="list-remove-btn" onClick={() => removeExperience(i)} title="删除"><DeleteOutlined /></button>
              </div>
              <div className="list-item-grid">
                {renderFieldRow('公司',  <input value={exp.company}     onChange={(e) => updateExperience(i, { company: e.target.value })}     placeholder="公司名称" />)}
                {renderFieldRow('职位',  <input value={exp.position}    onChange={(e) => updateExperience(i, { position: e.target.value })}    placeholder="职位" />)}
                {renderFieldRow('时间段',<input value={exp.period}      onChange={(e) => updateExperience(i, { period: e.target.value })}      placeholder="如 2025.06-2025.09" />)}
                {renderFieldRow('描述',  <textarea value={exp.description} onChange={(e) => updateExperience(i, { description: e.target.value })} placeholder="工作内容描述" rows={2} />)}
              </div>
            </div>
          ))}
          {form.experience.length === 0 && <p className="list-empty-hint">暂无，点击"添加"补充</p>}
        </div>

        {/* ---- 项目经验 ---- */}
        <div className="edit-section">
          <div className="edit-section-header">
            <h4 className="edit-section-title">项目经验</h4>
            <button className="list-add-btn" onClick={addProject}><PlusOutlined /> 添加</button>
          </div>
          {form.projects.map((proj, i) => (
            <div key={i} className="list-item-card">
              <div className="list-item-actions">
                <span className="list-item-index">#{i + 1}</span>
                <button className="list-remove-btn" onClick={() => removeProject(i)} title="删除"><DeleteOutlined /></button>
              </div>
              <div className="list-item-grid">
                {renderFieldRow('项目名称', <input value={proj.name}  onChange={(e) => updateProject(i, { name: e.target.value })}  placeholder="项目名称" />)}
                {renderFieldRow('角色',     <input value={proj.role}  onChange={(e) => updateProject(i, { role: e.target.value })}  placeholder="角色" />)}
                {renderFieldRow('技术栈',   <input value={(proj.techStack || []).join(', ')} onChange={(e) => updateProject(i, { techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="逗号分隔，如 React, Node.js" />)}
                {renderFieldRow('描述',     <textarea value={proj.description} onChange={(e) => updateProject(i, { description: e.target.value })} placeholder="项目描述" rows={2} />)}
              </div>
            </div>
          ))}
          {form.projects.length === 0 && <p className="list-empty-hint">暂无，点击"添加"补充</p>}
        </div>

        {/* ---- 技能标签 ---- */}
        <div className="edit-section">
          <h4 className="edit-section-title">技能标签</h4>
          <div className="skill-edit-area">
            <div className="skill-edit-tags">
              {form.skills.map((s) => (
                <span key={s} className="skill-edit-tag">
                  {s}
                  <button className="skill-tag-remove" onClick={() => removeSkill(s)} title="移除">&times;</button>
                </span>
              ))}
            </div>
            <div className="skill-edit-input-row">
              <input
                className="skill-edit-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="输入技能名称，按回车添加"
              />
              <button className="list-add-btn" onClick={addSkill} title="添加技能"><PlusOutlined /></button>
            </div>
          </div>
        </div>

        <div className="edit-modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditModal
