import { InboxOutlined } from '@ant-design/icons'
import type { CSSProperties, ReactNode } from 'react'
import './EmptyState.css'

export interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  size?: 'small' | 'medium' | 'large'
  style?: CSSProperties
  className?: string
}

/**
 * EmptyState - 空状态占位组件
 */
export default function EmptyState({
  icon,
  title = '暂无数据',
  description,
  actionText,
  onAction,
  size = 'medium',
  style,
  className = '',
}: EmptyStateProps) {
  const sizes = {
    small: { iconSize: 32, titleSize: 14, descSize: 12, padding: 24 },
    medium: { iconSize: 48, titleSize: 16, descSize: 14, padding: 40 },
    large: { iconSize: 64, titleSize: 20, descSize: 15, padding: 56 },
  }
  const s = sizes[size] || sizes.medium

  return (
    <div
      className={`empty-state empty-state--${size} ${className}`.trim()}
      style={{ padding: `${s.padding}px 20px`, ...style }}
      role="status"
    >
      <div className="empty-state-icon" style={{ fontSize: s.iconSize }}>
        {icon ?? <InboxOutlined />}
      </div>
      <h3 className="empty-state-title" style={{ fontSize: s.titleSize }}>
        {title}
      </h3>
      {description && (
        <p className="empty-state-desc" style={{ fontSize: s.descSize }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button className="empty-state-action" onClick={onAction} type="button">
          {actionText}
        </button>
      )}
    </div>
  )
}
