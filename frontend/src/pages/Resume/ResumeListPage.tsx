import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  SwapOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { ResumeCard } from '@/components/resume'
import { useResumeStore } from '@/store/useResumeStore'
import './Resume.css'

const ResumeListPage = () => {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

  // 用 ref 存放 selectedIds 避免闭包陈旧问题
  const selectedRef = useRef(selectedIds)
  selectedRef.current = selectedIds

  // 进入/退出对比模式时清空选择
  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev)
    setSelectedIds(new Set())
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 4) {
        next.add(id)
      }
      return next
    })
  }, [])

  // 稳定版回调，避免向 ResumeCard 传递内联函数
  const handleView = useCallback((id: string) => navigate(`/resume/${id}`), [navigate])
  const handleDelete = useCallback((id: string) => setDeleteTarget(id), [])
  const handleSetDefault = useCallback((id: string) => setDefaultResume(id), [setDefaultResume])

  const handleCompare = useCallback(() => {
    if (selectedRef.current.size < 2) return
    navigate(`/resume/compare?ids=${Array.from(selectedRef.current).join(',')}`)
  }, [navigate])

  // 搜索过滤
  const filteredResumes = useMemo(() => {
    if (!keyword.trim()) return resumes
    const kw = keyword.toLowerCase()
    return resumes.filter((r) =>
      r.title.toLowerCase().includes(kw) ||
      (r.name && r.name.toLowerCase().includes(kw)) ||
      (r.phone && r.phone.includes(kw)) ||
      (r.email && r.email.toLowerCase().includes(kw))
    )
  }, [resumes, keyword])

  // 搜索时回到第一页
  const totalPages = Math.ceil(filteredResumes.length / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const pagedResumes = filteredResumes.slice((safePage - 1) * pageSize, safePage * pageSize).map((r) => ({
    ...r,
    isDefault: r.isDefault ?? false,
  }))

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteResume(deleteTarget)
      // 如果当前页只剩这一项且不是第一页，回退一页
      if (pagedResumes.length <= 1 && safePage > 1) {
        setPage(safePage - 1)
      }
    }
    setDeleteTarget(null)
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

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
        <div className="resume-header-actions">
          <button
            className={`btn-compare ${compareMode ? 'active' : ''}`}
            onClick={toggleCompareMode}
          >
            <SwapOutlined /> {compareMode ? '退出对比' : '对比'}
          </button>
          <button
            className="btn-upload-resume"
            onClick={() => navigate('/resume/upload')}
          >
            <PlusOutlined /> 上传简历
          </button>
        </div>
      </div>

      {resumes.length > 0 && (
        <div className="search-bar">
          <SearchOutlined className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索简历名称、姓名、电话或邮箱..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {keyword && (
            <span className="search-count">
              {filteredResumes.length} 条结果
            </span>
          )}
        </div>
      )}

      {filteredResumes.length === 0 && resumes.length > 0 && keyword ? (
        <EmptyState
          icon={<SearchOutlined />}
          title="未找到匹配的简历"
          description="试试其他关键词"
        />
      ) : resumes.length === 0 ? (
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
                selected={compareMode ? selectedIds.has(resume.id) : undefined}
                onToggleSelect={compareMode ? toggleSelect : undefined}
                onView={handleView}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="history-pagination" style={compareMode ? { marginBottom: 70 } : undefined}>
              <button
                className="pagination-btn"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ArrowLeftOutlined /> 上一页
              </button>
              <span className="pagination-info">
                第 {safePage} / {totalPages} 页
                {compareMode && <span className="pagination-hint">（可选跨页简历）</span>}
              </span>
              <button
                className="pagination-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                下一页 <RightOutlined />
              </button>
            </div>
          )}

          {/* 对比模式底部操作栏 */}
          {compareMode && (
            <div className="compare-bar">
              <button className="compare-bar-close" onClick={toggleCompareMode}>
                <CloseOutlined /> 退出
              </button>
              <span className="compare-bar-info">
                {selectedIds.size === 0
                  ? '请选择至少 2 份简历进行对比'
                  : `已选 ${selectedIds.size} 份简历（最多 4 份）`}
              </span>
              <button
                className="btn-compare-start"
                disabled={selectedIds.size < 2}
                onClick={handleCompare}
              >
                <CheckCircleOutlined /> 开始对比
              </button>
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
