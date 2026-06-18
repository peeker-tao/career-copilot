import { useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'

export interface EditModalProps {
  parsedData: {
    basicInfo?: {
      name?: string
      phone?: string
      email?: string
    }
    skills?: string[]
  }
  onSave: (data: EditModalProps['parsedData']) => void
  onClose: () => void
}

const EditModal = ({ parsedData, onSave, onClose }: EditModalProps) => {
  const [form, setForm] = useState({ ...parsedData })
  const [saving, setSaving] = useState(false)

  const handleBasicChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }))
  }

  const handleSkillsChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      skills: value.split(',').map((s) => s.trim()).filter(Boolean),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSaving(false)
    onSave(form)
  }

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>编辑简历信息</h3>
          <button className="edit-modal-close" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        <div className="edit-field">
          <label>姓名</label>
          <input
            value={form.basicInfo?.name || ''}
            onChange={(e) => handleBasicChange('name', e.target.value)}
          />
        </div>
        <div className="edit-field">
          <label>手机号</label>
          <input
            value={form.basicInfo?.phone || ''}
            onChange={(e) => handleBasicChange('phone', e.target.value)}
          />
        </div>
        <div className="edit-field">
          <label>邮箱</label>
          <input
            value={form.basicInfo?.email || ''}
            onChange={(e) => handleBasicChange('email', e.target.value)}
          />
        </div>

        <div className="edit-field">
          <label>技能（逗号分隔）</label>
          <input
            value={(form.skills || []).join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value)}
          />
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
