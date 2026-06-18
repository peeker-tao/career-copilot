import type { ReactNode } from 'react'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'
import EmptyState from './EmptyState'
import type { EmptyStateProps } from './EmptyState'

interface PageContainerProps {
  loading?: boolean
  error?: string | null
  empty?: Pick<EmptyStateProps, 'title' | 'description' | 'actionText' | 'onAction' | 'icon'> | null
  onRetry?: () => void
  children: ReactNode
}

/**
 * PageContainer - 统一页面容器
 * 自动处理 loading / error / empty 状态
 */
export default function PageContainer({
  loading,
  error,
  empty,
  onRetry,
  children,
}: PageContainerProps) {
  if (loading) {
    return <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} />
  }

  if (empty) {
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title || '暂无数据'}
        description={empty.description}
        actionText={empty.actionText}
        onAction={empty.onAction}
      />
    )
  }

  return <>{children}</>
}
