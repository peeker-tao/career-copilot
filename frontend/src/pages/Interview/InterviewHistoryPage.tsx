import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { HistoryStats, HistoryCard } from '@/components/interview'
import { useInterviewStore } from '@/store/useInterviewStore'
import type { Interview } from '@/types/interview'
import './InterviewHistory.css'

/** 将后端 Interview 映射为 HistoryCard 所需格式 */
function toHistoryItem(i: Interview) {
  return {
    id: i.id,
    position: i.targetPosition,
    difficulty: i.difficulty,
    score: i.score ?? null,
    date: i.startedAt ? i.startedAt.slice(0, 10) : '-',
    rounds: (i as any).questionCount ?? i.rounds ?? 0,
    // 后端返回 questionCount（Prisma 字段），前端用 rounds 接收
    duration: i.duration || '-',
    status: ((i as any).status === 'cancelled' ? 'interrupted' : (i as any).status) as string,
  }
}

export default function InterviewHistoryPage() {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const interviews = useInterviewStore((s) => s.interviews)
  const loading = useInterviewStore((s) => s.loading)
  const error = useInterviewStore((s) => s.error)
  const total = useInterviewStore((s) => s.total)
  const currentPage = useInterviewStore((s) => s.currentPage)
  const totalPages = useInterviewStore((s) => s.totalPages)
  const stats = useInterviewStore((s) => s.stats)
  const fetchInterviews = useInterviewStore((s) => s.fetchInterviews)
  const deleteInterview = useInterviewStore((s) => s.deleteInterview)

  useEffect(() => {
    fetchInterviews(1)
  }, [fetchInterviews])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    fetchInterviews(page)
  }

  const historyItems = interviews.map(toHistoryItem)

  // 搜索过滤
  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return historyItems
    const kw = keyword.toLowerCase()
    return historyItems.filter((item) =>
      item.position.toLowerCase().includes(kw)
    )
  }, [historyItems, keyword])

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteInterview(deleteTarget)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="history-page">
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-page">
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
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">AI 面试</h1>
          <p className="history-subtitle">查看历史面试记录，开始新一轮模拟面试</p>
        </div>
        <button
          className="btn-start-interview"
          onClick={() => navigate('/interview/new')}
        >
          <PlusOutlined /> 开始新面试
        </button>
      </div>

      <HistoryStats interviews={historyItems} stats={stats ?? undefined} />

      <div className="history-toolbar">
        <span className="toolbar-count">共 {total} 条记录</span>
        <div className="search-bar">
          <SearchOutlined className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索面试岗位..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {historyItems.length === 0 ? (
        <EmptyState
          icon={<MessageOutlined />}
          title="暂无面试记录"
          description="开始你的第一次模拟面试吧"
          actionText="开始新面试"
          onAction={() => navigate('/interview/new')}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<SearchOutlined />}
          title="未找到匹配的面试"
          description="试试其他关键词"
        />
      ) : (
        <>
          <div className="history-list">
            {filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                interview={item}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="history-pagination">
              <button
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ArrowLeftOutlined /> 上一页
              </button>
              <span className="pagination-info">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页 <RightOutlined />
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="删除面试记录"
        message="删除后无法恢复，确定要删除这条记录吗？"
        type="danger"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
