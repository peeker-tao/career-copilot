import { InboxOutlined } from '@ant-design/icons'
import './EmptyState.css'

/**
 * EmptyState - 空状态占位组件
 *
 * Props:
 *   icon        - 自定义图标（默认 InboxOutlined）
 *   title       - 主标题（默认 "暂无数据"）
 *   description - 副文本描述
 *   actionText  - 操作按钮文字
 *   onAction    - 操作按钮点击回调
 *   size        - 尺寸: 'small' | 'medium' | 'large'（默认 'medium'）
 *   style       - 自定义样式
 */
export default function EmptyState({
  icon,
  title = '暂无数据',
  description,
  actionText,
  onAction,
  size = 'medium',
  style,
}) {
  const IconComponent = icon || InboxOutlined

  const sizes = {
    small: { iconSize: 32, titleSize: 14, descSize: 12, padding: 24 },
    medium: { iconSize: 48, titleSize: 16, descSize: 14, padding: 40 },
    large: { iconSize: 64, titleSize: 20, descSize: 15, padding: 56 },
  }
  const s = sizes[size] || sizes.medium

  return (
    <div
      className={`empty-state empty-state--${size}`}
      style={{ padding: `${s.padding}px 20px`, ...style }}
      role="status"
    >
      <div className="empty-state-icon" style={{ fontSize: s.iconSize }}>
        <IconComponent />
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
