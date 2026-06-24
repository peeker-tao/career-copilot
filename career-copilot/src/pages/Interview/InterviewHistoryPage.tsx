import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
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

  const interviews = useInterviewStore((s) => s.interviews)
  const loading = useInterviewStore((s) => s.loading)
  const error = useInterviewStore((s) => s.error)
  const fetchInterviews = useInterviewStore((s) => s.fetchInterviews)
  const deleteInterview = useInterviewStore((s) => s.deleteInterview)

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const historyItems = interviews.map(toHistoryItem)

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

      <HistoryStats interviews={historyItems} />

      <div className="history-toolbar">
        <span className="toolbar-count">共 {historyItems.length} 条记录</span>
      </div>

      {historyItems.length === 0 ? (
        <EmptyState
          icon={<MessageOutlined />}
          title="暂无面试记录"
          description="开始你的第一次模拟面试吧"
          actionText="开始新面试"
          onAction={() => navigate('/interview/new')}
        />
      ) : (
        <div className="history-list">
          {historyItems.map((item) => (
            <HistoryCard
              key={item.id}
              interview={item}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
