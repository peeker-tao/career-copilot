import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { ResumeCard } from '@/components/resume'
import { useResumeStore } from '@/store/useResumeStore'
import './Resume.css'

const ResumeListPage = () => {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 8

  const resumes = useResumeStore((s) => s.resumes)
  const loading = useResumeStore((s) => s.loading)
  const error = useResumeStore((s) => s.error)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)
  const deleteResume = useResumeStore((s) => s.deleteResume)
  const setDefaultResume = useResumeStore((s) => s.setDefaultResume)

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteResume(deleteTarget)
    }
    setDeleteTarget(null)
  }

  const handleSetDefault = (id: string) => {
    setDefaultResume(id)
  }

  const totalPages = Math.ceil(resumes.length / pageSize)
  const pagedResumes = resumes.slice((page - 1) * pageSize, page * pageSize).map((r) => ({
    ...r,
    isDefault: r.isDefault ?? false,
  }))

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
