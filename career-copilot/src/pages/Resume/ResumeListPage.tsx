import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { ResumeCard } from '@/components/resume'
import './Resume.css'

interface MockResume {
  id: string
  title: string
  status: string
  skills: string[]
  createdAt: string
  isDefault: boolean
}

const MOCK_RESUMES: MockResume[] = [
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

const ResumeListPage = () => {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<MockResume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
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

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = () => {
    setResumes((prev) => prev.filter((r) => r.id !== deleteTarget))
    setDeleteTarget(null)
  }

  const handleSetDefault = (id: string) => {
    setResumes((prev) =>
      prev.map((r) => ({ ...r, isDefault: r.id === id }))
    )
  }

  const totalPages = Math.ceil(resumes.length / pageSize)
  const pagedResumes = resumes.slice((page - 1) * pageSize, page * pageSize)

  if (loading) {
    return (
      <div className="resume-page">
        <Loading skeleton={{ rows: 4 }} className="pad-24-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="resume-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
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
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

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
