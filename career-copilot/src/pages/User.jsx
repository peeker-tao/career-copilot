import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseOutlined,
  KeyOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  AimOutlined,
  BookOutlined,
  LoadingOutlined,
  MessageOutlined,
  FileTextOutlined,
  CompassOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../components/common'
import './User.css'

/* Mock 数据 */
const MOCK_USER = {
  id: '1',
  avatar: '',
  nickname: '求职者',
  email: 'user@example.com',
  phone: '138****8888',
  education: '华中科技大学 · 软件工程 · 本科',
  targetPosition: '后端开发工程师',
  bio: '热爱编程，正在为梦想努力 💪',
  createdAt: '2026-01-15',
}

const MOCK_STATS = {
  totalInterviews: 12,
  avgScore: 86.5,
  resumeCount: 3,
  activePlans: 2,
}

/* 子组件：头像上传 */
function AvatarUpload({ avatar, nickname, onUpload }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(avatar)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 预览
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result)
    }
    reader.readAsDataURL(file)

    // 模拟上传
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      onUpload?.(URL.createObjectURL(file))
    }, 800)
  }

  return (
    <div className="avatar-wrapper" onClick={handleClick}>
      {uploading ? (
        <div className="avatar-uploading">
          <LoadingOutlined />
        </div>
      ) : preview ? (
        <img src={preview} alt={nickname} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">
          <UserOutlined />
        </div>
      )}
      <div className="avatar-overlay">
        <CameraOutlined />
        <span>更换头像</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}

/* 子组件：统计卡片 */
function ProfileStats({ stats }) {
  const items = [
    { icon: <MessageOutlined />, label: '面试次数', value: stats.totalInterviews, color: '#1890ff' },
    { icon: <EditOutlined />, label: '平均评分', value: stats.avgScore, suffix: '分', color: '#52c41a' },
    { icon: <FileTextOutlined />, label: '简历数量', value: stats.resumeCount, color: '#7c3aed' },
    { icon: <CompassOutlined />, label: '进行中规划', value: stats.activePlans, color: '#fa8c16' },
  ]

  return (
    <div className="profile-stats">
      {items.map((item) => (
        <div key={item.label} className="profile-stat-card">
          <div className="profile-stat-icon" style={{ background: `${item.color}15`, color: item.color }}>
            {item.icon}
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value">
              {item.value}
              {item.suffix ?? ''}
            </div>
            <div className="profile-stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* 子组件：编辑表单 */
function ProfileForm({ user, onSave }) {
  const [form, setForm] = useState({ ...user })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    // 模拟 PATCH /auth/profile
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
              <LoadingOutlined style={{ marginRight: 6 }} /> 保存中...
            </>
          ) : (
            <>
              <CheckOutlined style={{ marginRight: 6 }} /> 保存修改
            </>
          )}
        </button>
        {dirty && (
          <button className="btn-cancel" onClick={handleCancel}>
            <CloseOutlined style={{ marginRight: 6 }} /> 取消
          </button>
        )}
      </div>
    </div>
  )
}

/* 子组件：账号安全 */
function AccountSecurity({ onLogoutRequest }) {
  const handleLogout = () => {
    onLogoutRequest?.()
  }

  return (
    <div className="account-security">
      <div className="security-item">
        <div className="security-left">
          <SafetyCertificateOutlined className="security-icon" />
          <div>
            <div className="security-title">登录密码</div>
            <div className="security-desc">********</div>
          </div>
        </div>
        <button className="btn-secondary security-btn" disabled title="功能开发中">
          <KeyOutlined /> 修改密码
        </button>
      </div>

      <div className="security-divider" />

      <div className="security-item">
        <div className="security-left">
          <ExclamationCircleOutlined className="security-icon danger" />
          <div>
            <div className="security-title">退出登录</div>
            <div className="security-desc">退出后将需要重新登录</div>
          </div>
        </div>
        <button className="btn-danger" onClick={handleLogout}>
          <LogoutOutlined /> 退出登录
        </button>
      </div>
    </div>
  )
}

/* 主组件 */
const User = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    // 模拟 GET /auth/profile
    let mounted = true
    setTimeout(() => {
      if (mounted) {
        setUser({ ...MOCK_USER })
        setLoading(false)
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const handleAvatarUpload = (url) => {
    setUser((prev) => ({ ...prev, avatar: url }))
  }

  const handleSave = (form) => {
    setUser(form)
    // 这里可以同步到 store
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Loading
          skeleton
          tip="加载中..."
          style={{ padding: '24px 0' }}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-page">
        <EmptyState
          title="加载用户信息失败"
          description="请检查网络连接后重试"
          actionText="重新加载"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* 页面标题 */}
      <h1 className="page-title">个人中心</h1>

      {/* 用户信息头部 */}
      <div className="profile-header">
        <AvatarUpload
          avatar={user.avatar}
          nickname={user.nickname}
          onUpload={handleAvatarUpload}
        />
        <div className="profile-header-info">
          <h2 className="profile-nickname">{user.nickname}</h2>
          <div className="profile-meta">
            <span>
              <MailOutlined /> {user.email}
            </span>
            <span className="meta-divider">|</span>
            <span>
              <AimOutlined /> {user.targetPosition}
            </span>
          </div>
          <div className="profile-bio">{user.bio}</div>
          <div className="profile-joined">注册时间：{user.createdAt}</div>
        </div>
      </div>

      {/* 数据统计 */}
      <ProfileStats stats={MOCK_STATS} />

      {/* 双栏布局 */}
      <div className="profile-content">
        {/* 左栏：个人信息编辑 */}
        <div className="profile-card">
          <h2 className="card-title">
            <EditOutlined /> 个人信息
          </h2>
          <ProfileForm user={user} onSave={handleSave} />
        </div>

        {/* 右栏：账号安全 */}
        <div className="profile-card">
          <h2 className="card-title">
            <SafetyCertificateOutlined /> 账号安全
          </h2>
          <AccountSecurity onLogoutRequest={() => setShowLogoutConfirm(true)} />
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="确认退出登录"
        message="退出后将需要重新登录"
        type="warning"
        confirmText="退出登录"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          navigate('/login')
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

export default User
