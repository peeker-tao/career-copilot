import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MailOutlined,
  AimOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  RiseOutlined,
  BookOutlined,
  DeleteOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { AvatarUpload, ProfileStats, ProfileForm, AccountSecurity } from '@/components/user'
import type { UserData } from '@/components/user'
import './User.css'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import * as jobMatchingApi from '@/api/job-matching'
import * as questionBankApi from '@/api/question-bank'
import * as learningResourcesApi from '@/api/learning-resources'
import type { JobMatch } from '@/types/job-matching'
import type { QuestionBankItem } from '@/types/question-bank'
import type { LearningResource } from '@/types/learning-resources'

const User: React.FC = () => {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { logout, fetchProfile, fetchStats, updateProfile } = useAuthStore()
  const userInfo = useAuthStore((s) => s.user)
  const stats = useAuthStore((s) => s.stats)
  const profileLoading = !userInfo

  /** 收藏页签 & 数据 */
  const toast = useToastStore((s) => s.addToast)
  const [favTab, setFavTab] = useState<'jobs' | 'questions' | 'resources'>('jobs')
  const [savedJobs, setSavedJobs] = useState<JobMatch[]>([])
  const [savedQuestions, setSavedQuestions] = useState<QuestionBankItem[]>([])
  const [savedResources, setSavedResources] = useState<LearningResource[]>([])
  const [favLoading, setFavLoading] = useState(false)

  /** 加载收藏岗位 */
  const fetchSavedJobs = useCallback(async () => {
    try {
      const res = await jobMatchingApi.getMatches({ status: 'saved', limit: 50 })
      setSavedJobs(res.data?.list ?? [])
    } catch { /* ignore */ }
  }, [])

  /** 加载收藏题目 */
  const fetchSavedQuestions = useCallback(async () => {
    const ids: string[] = JSON.parse(localStorage.getItem('qb_favorites') || '[]')
    if (ids.length === 0) { setSavedQuestions([]); return }
    try {
      const results = await Promise.allSettled(ids.map((id) => questionBankApi.getQuestionById(id)))
      const items: QuestionBankItem[] = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value.data)
        .filter(Boolean)
      setSavedQuestions(items)
    } catch { /* ignore */ }
  }, [])

  /** 加载收藏资源 */
  const fetchSavedResources = useCallback(async () => {
    const ids: string[] = JSON.parse(localStorage.getItem('lr_favorites') || '[]')
    if (ids.length === 0) { setSavedResources([]); return }
    try {
      const results = await Promise.allSettled(ids.map((id) => learningResourcesApi.getResourceById(id)))
      const items: LearningResource[] = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value.data)
        .filter(Boolean)
      setSavedResources(items)
    } catch { /* ignore */ }
  }, [])

  /** 取消收藏岗位 */
  const handleRemoveJob = async (id: string) => {
    try {
      await jobMatchingApi.updateMatchStatus(id, 'archived')
      setSavedJobs((prev) => prev.filter((j) => j.id !== id))
      toast('success', '已取消收藏')
    } catch {
      toast('error', '操作失败')
    }
  }

  /** 取消收藏题目 */
  const handleRemoveQuestion = (id: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem('qb_favorites') || '[]')
    const updated = ids.filter((fid) => fid !== id)
    localStorage.setItem('qb_favorites', JSON.stringify(updated))
    setSavedQuestions((prev) => prev.filter((q) => q.id !== id))
    toast('success', '已取消收藏')
  }

  /** 取消收藏资源 */
  const handleRemoveResource = (id: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem('lr_favorites') || '[]')
    const updated = ids.filter((fid) => fid !== id)
    localStorage.setItem('lr_favorites', JSON.stringify(updated))
    setSavedResources((prev) => prev.filter((r) => r.id !== id))
    toast('success', '已取消收藏')
  }

  useEffect(() => {
    setFavLoading(true)
    Promise.all([fetchSavedJobs(), fetchSavedQuestions(), fetchSavedResources()])
      .finally(() => setFavLoading(false))
  }, [fetchSavedJobs, fetchSavedQuestions, fetchSavedResources])

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

  const handleAvatarUpload = async (file: File) => {
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      await updateProfile({ avatar: dataUrl })
      toast.success('头像更新成功')
    } catch {
      toast.error('头像上传失败，请重试')
    }
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

      {/* ===== 我的收藏 ===== */}
      <div className="profile-card favorites-card">
        <h2 className="card-title">
          <StarOutlined /> 我的收藏
        </h2>

        {/* 页签 */}
        <div className="fav-tabs">
          <button
            className={`fav-tab ${favTab === 'jobs' ? 'fav-tab--active' : ''}`}
            onClick={() => setFavTab('jobs')}
          >
            <RiseOutlined /> 收藏岗位
            {savedJobs.length > 0 && <span className="fav-badge">{savedJobs.length}</span>}
          </button>
          <button
            className={`fav-tab ${favTab === 'questions' ? 'fav-tab--active' : ''}`}
            onClick={() => setFavTab('questions')}
          >
            <BookOutlined /> 收藏题目
            {savedQuestions.length > 0 && <span className="fav-badge">{savedQuestions.length}</span>}
          </button>
          <button
            className={`fav-tab ${favTab === 'resources' ? 'fav-tab--active' : ''}`}
            onClick={() => setFavTab('resources')}
          >
            <TrophyOutlined /> 收藏资源
            {savedResources.length > 0 && <span className="fav-badge">{savedResources.length}</span>}
          </button>
        </div>

        {/* 岗位列表 */}
        {favTab === 'jobs' && (
          <div className="fav-list">
            {favLoading ? (
              <Loading skeleton tip="加载中..." className="pad-16-0" />
            ) : savedJobs.length === 0 ? (
              <EmptyState title="暂无收藏岗位" description="在岗位推荐中收藏感兴趣的职位" />
            ) : (
              savedJobs.map((job) => (
                <div key={job.id} className="fav-item">
                  <div className="fav-item-body">
                    <div className="fav-item-title">{job.position}</div>
                    <div className="fav-item-meta">
                      <span>{job.company}</span>
                      {job.location && <><span className="meta-divider">|</span><span>{job.location}</span></>}
                      {job.salaryRange && <><span className="meta-divider">|</span><span className="fav-salary">{job.salaryRange}</span></>}
                    </div>
                  </div>
                  <button className="fav-remove-btn" onClick={() => handleRemoveJob(job.id)} title="取消收藏">
                    <DeleteOutlined />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 题目列表 */}
        {favTab === 'questions' && (
          <div className="fav-list">
            {favLoading ? (
              <Loading skeleton tip="加载中..." className="pad-16-0" />
            ) : savedQuestions.length === 0 ? (
              <EmptyState title="暂无收藏题目" description="在题库中收藏感兴趣的题目" />
            ) : (
              savedQuestions.map((q) => (
                <div key={q.id} className="fav-item">
                  <div className="fav-item-body">
                    <div className="fav-item-title">{q.question}</div>
                    <div className="fav-item-meta">
                      <span className={`fav-difficulty fav-difficulty--${q.difficulty}`}>
                        {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                      <span className="meta-divider">|</span>
                      <span>{q.category}</span>
                      <span className="meta-divider">|</span>
                      <span>{q.type === 'choice' ? '选择题' : q.type === 'short_answer' ? '简答题' : '编程题'}</span>
                    </div>
                  </div>
                  <button className="fav-remove-btn" onClick={() => handleRemoveQuestion(q.id)} title="取消收藏">
                    <DeleteOutlined />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 资源列表 */}
        {favTab === 'resources' && (
          <div className="fav-list">
            {favLoading ? (
              <Loading skeleton tip="加载中..." className="pad-16-0" />
            ) : savedResources.length === 0 ? (
              <EmptyState title="暂无收藏资源" description="在资源广场中收藏感兴趣的学习资源" />
            ) : (
              savedResources.map((r) => (
                <div key={r.id} className="fav-item">
                  <div className="fav-item-body">
                    <div className="fav-item-title">{r.title}</div>
                    <div className="fav-item-meta">
                      <span>{r.category}</span>
                      <span className="meta-divider">|</span>
                      <span>{r.type === 'video' ? '视频' : r.type === 'article' ? '文章' : r.type === 'course' ? '课程' : r.type === 'book' ? '书籍' : '文档'}</span>
                      {r.duration && <><span className="meta-divider">|</span><span>{r.duration}</span></>}
                    </div>
                  </div>
                  <button className="fav-remove-btn" onClick={() => handleRemoveResource(r.id)} title="取消收藏">
                    <DeleteOutlined />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
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
