import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import './Resume.css'

/* Mock 数据 */
const MOCK_RESUMES = [
  {
    id: '1',
    title: '小明_后端简历_2026.pdf',
    status: 'completed',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git', 'RabbitMQ'],
    createdAt: '2026-06-15T10:30:00Z',
    isDefault: true,
  },
  {
    id: '2',
    title: '小明_前端简历_2026.pdf',
    status: 'completed',
    skills: ['React', 'TypeScript', 'Vue', 'Webpack', 'CSS'],
    createdAt: '2026-06-10T08:00:00Z',
    isDefault: false,
  },
  {
    id: '3',
    title: '小明_产品岗简历.pdf',
    status: 'parsing',
    skills: [],
    createdAt: '2026-06-18T12:00:00Z',
    isDefault: false,
  },
  {
    id: '4',
    title: '小明_全栈简历.pdf',
    status: 'failed',
    skills: [],
    createdAt: '2026-06-08T14:00:00Z',
    isDefault: false,
  },
]

const STATUS_CONFIG = {
  completed: { label: '已完成', cls: 'completed' },
  parsing: { label: '解析中', cls: 'parsing' },
  failed: { label: '解析失败', cls: 'failed' },
}

/* 简历卡片 */
function ResumeCard({ resume, onView, onDelete, onSetDefault }) {
  const statusInfo = STATUS_CONFIG[resume.status] || { label: '未知', cls: '' }
  const displaySkills = resume.skills.slice(0, 5)
  const moreCount = resume.skills.length - 5

  return (
    <div
      className={`resume-card ${resume.isDefault ? 'resume-card-default' : ''}`}
      onClick={() => onView(resume.id)}
    >
      <div className="resume-card-top">
        <div className="resume-card-icon">
          <FileTextOutlined />
        </div>
        <span className="resume-card-date">
          {new Date(resume.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      <div className="resume-card-name">{resume.title}</div>

      <div className="resume-card-status">
        <span className={`status-badge ${statusInfo.cls}`}>
          {resume.status === 'parsing' && <LoadingOutlined className="spin-icon" />}
          {statusInfo.label}
        </span>
        {resume.isDefault && (
          <span className="status-badge completed">
            <StarOutlined /> 默认
          </span>
        )}
      </div>

      {resume.skills.length > 0 && (
        <div className="resume-card-skills">
          {displaySkills.map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
          {moreCount > 0 && (
            <span className="skill-tag-more">+{moreCount}</span>
          )}
        </div>
      )}

      <div className="resume-card-actions" onClick={(e) => e.stopPropagation()}>
        {!resume.isDefault && resume.status === 'completed' && (
          <button
            className="card-action-btn"
            onClick={() => onSetDefault(resume.id)}
            title="设为默认"
          >
            <StarOutlined />
          </button>
        )}
        <button
          className="card-action-btn"
          onClick={() => onView(resume.id)}
          title="查看详情"
        >
          <EyeOutlined />
        </button>
        <button
          className="card-action-btn danger"
          onClick={() => onDelete(resume.id)}
          title="删除"
        >
          <DeleteOutlined />
        </button>
      </div>
    </div>
  )
}

/* 主组件 */
const ResumeListPage = () => {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 8

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (!mounted) return
      try {
        setResumes([...MOCK_RESUMES])
      } catch {
        if (mounted) setError('加载简历列表失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const confirmDelete = () => {
    setResumes((prev) => prev.filter((r) => r.id !== deleteTarget))
    setDeleteTarget(null)
  }

  const handleSetDefault = (id) => {
    setResumes((prev) =>
      prev.map((r) => ({ ...r, isDefault: r.id === id }))
    )
  }

  const totalPages = Math.ceil(resumes.length / pageSize)
  const pagedResumes = resumes.slice((page - 1) * pageSize, page * pageSize)

  /* --- 加载状态 --- */
  if (loading) {
    return (
      <div className="resume-page">
        <Loading skeleton rows={4} style={{ padding: '24px 0' }} />
      </div>
    )
  }

  /* --- 错误状态 --- */
  if (error) {
    return (
      <div className="resume-page">
        <EmptyState
          icon={ExclamationCircleOutlined}
          title="加载失败"
          description={error}
          actionText="重新加载"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="resume-page">
      {/* 页面头部 */}
      <div className="resume-header">
        <div className="resume-header-left">
          <h1 className="resume-title">简历管理</h1>
          <p className="resume-subtitle">管理你的简历，支持 PDF / DOCX 格式上传与解析</p>
        </div>
        <button
          className="btn-upload-resume"
          onClick={() => navigate('/resume/upload')}
        >
          <PlusOutlined /> 上传简历
        </button>
      </div>

      {/* 列表 / 空状态 */}
      {resumes.length === 0 ? (
        <div className="resume-empty">
          <div className="resume-empty-icon">
            <FileTextOutlined />
          </div>
          <h3>还没有简历</h3>
          <p>快去上传你的第一份简历，AI 将为你智能解析</p>
          <button
            className="btn-upload-resume"
            onClick={() => navigate('/resume/upload')}
          >
            <PlusOutlined /> 上传简历
          </button>
        </div>
      ) : (
        <>
          <div className="resume-grid">
            {pagedResumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onView={(id) => navigate(`/resume/${id}`)}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="resume-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`card-action-btn ${p === page ? 'active' : ''}`}
                  style={p === page ? { background: 'var(--accent)', color: '#fff' } : {}}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 删除确认 */}
      <ConfirmModal
        open={!!deleteTarget}
        title="删除简历"
        message="删除后无法恢复，确定要删除这份简历吗？"
        type="danger"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default ResumeListPage
