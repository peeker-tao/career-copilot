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

const User: React.FC = () => {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { logout, fetchProfile, fetchStats, updateProfile } = useAuthStore()
  const userInfo = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const loading = useAuthStore((s) => s.loading)
  const profileLoading = !userInfo

  /** 将 UserInfo 映射为 UserData（ProfileForm 需要的格式） */
  const userData: UserData | null = userInfo
    ? {
        nickname: userInfo.name,
        email: userInfo.email,
        phone: '',
        education: userInfo.education || '',
        targetPosition: userInfo.targetPosition || '',
        bio: '',
      }
    : null

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [fetchProfile, fetchStats])

  const handleAvatarUpload = (_url: string) => {
    // Avatar upload API 暂未实现, TODO
  }

  const handleSave = async (form: UserData) => {
    await updateProfile({
      name: form.nickname,
      education: form.education,
      targetPosition: form.targetPosition,
    })
  }

  if (profileLoading) {
    return (
      <div className="profile-page">
        <Loading skeleton tip="加载中..." className="pad-24-0" />
      </div>
    )
  }

  if (!userData) {
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
          avatar={userInfo?.avatar || ''}
          nickname={userInfo?.name || ''}
          onUpload={handleAvatarUpload}
        />
        <div className="profile-header-info">
          <h2 className="profile-nickname">{userInfo?.name}</h2>
          <div className="profile-meta">
            <span>
              <MailOutlined /> {userInfo?.email}
            </span>
            <span className="meta-divider">|</span>
            <span>
              <AimOutlined /> {userInfo?.targetPosition || '未设置'}
            </span>
          </div>
          <div className="profile-bio">{userInfo?.education || ''}</div>
          <div className="profile-joined">注册时间：{userInfo?.createdAt?.slice(0, 10) || '-'}</div>
        </div>
      </div>

      <ProfileStats stats={stats || { totalInterviews: 0, avgScore: 0, resumeCount: 0, activePlans: 0 }} />

      <div className="profile-content">
        <div className="profile-card">
          <h2 className="card-title">
            <EditOutlined /> 个人信息
          </h2>
          <ProfileForm user={userData} onSave={handleSave} />
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
