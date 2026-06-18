import { useState } from 'react'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BookOutlined,
  AimOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons'

export interface UserData {
  nickname: string
  email: string
  phone: string
  education: string
  targetPosition: string
  bio: string
}

export interface ProfileFormProps {
  user: UserData
  onSave: (user: UserData) => void
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
  const [form, setForm] = useState<UserData>({ ...user })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const handleChange = (field: keyof UserData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSaving(false)
    setDirty(false)
    onSave?.(form)
  }

  const handleCancel = () => {
    setForm({ ...user })
    setDirty(false)
  }

  return (
    <div className="profile-form">
      <div className="form-group">
        <label className="form-label">
          <UserOutlined /> 昵称
        </label>
        <input
          type="text"
          className="form-input"
          value={form.nickname}
          onChange={(e) => handleChange('nickname', e.target.value)}
          placeholder="请输入昵称"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <MailOutlined /> 邮箱
        </label>
        <input
          type="email"
          className="form-input disabled"
          value={form.email}
          disabled
        />
        <span className="form-hint">邮箱不可修改</span>
      </div>

      <div className="form-group">
        <label className="form-label">
          <PhoneOutlined /> 手机号
        </label>
        <input
          type="text"
          className="form-input disabled"
          value={form.phone}
          disabled
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <BookOutlined /> 教育背景
        </label>
        <input
          type="text"
          className="form-input"
          value={form.education}
          onChange={(e) => handleChange('education', e.target.value)}
          placeholder="例如：华中科技大学 · 软件工程 · 本科"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <AimOutlined /> 目标岗位
        </label>
        <input
          type="text"
          className="form-input"
          value={form.targetPosition}
          onChange={(e) => handleChange('targetPosition', e.target.value)}
          placeholder="例如：后端开发工程师"
        />
      </div>

      <div className="form-group">
        <label className="form-label">个人简介</label>
        <textarea
          className="form-textarea"
          value={form.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="介绍一下自己吧..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button
          className="btn-save"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? (
            <>
              <LoadingOutlined className="mr-6" /> 保存中...
            </>
          ) : (
            <>
              <CheckOutlined className="mr-6" /> 保存修改
            </>
          )}
        </button>
        {dirty && (
          <button className="btn-cancel" onClick={handleCancel}>
            <CloseOutlined className="mr-6" /> 取消
          </button>
        )}
      </div>
    </div>
  )
}

export default ProfileForm
