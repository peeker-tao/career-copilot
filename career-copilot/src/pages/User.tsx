import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MailOutlined,
  AimOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { AvatarUpload, ProfileStats, ProfileForm, AccountSecurity } from '@/components/user'
import type { UserData } from '@/components/user'
import './User.css'
import { useAuthStore } from '@/store/useAuthStore'

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

const User: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<(typeof MOCK_USER) | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { logout } = useAuthStore()

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (mounted) {
        setUser({ ...MOCK_USER })
        setLoading(false)
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const handleAvatarUpload = (url: string) => {
    setUser((prev) => prev ? { ...prev, avatar: url } : prev)
  }

  const handleSave = (form: UserData) => {
    setUser((prev) => prev ? { ...prev, ...form } : prev)
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Loading
          skeleton
          tip="加载中..."
          className="pad-24-0"
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
      <h1 className="page-title">个人中心</h1>

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

      <ProfileStats stats={MOCK_STATS} />

      <div className="profile-content">
        <div className="profile-card">
          <h2 className="card-title">
            <EditOutlined /> 个人信息
          </h2>
          <ProfileForm user={user as UserData} onSave={handleSave} />
        </div>

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
          logout()
          navigate('/login')
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

export default User
