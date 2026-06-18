import { useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import './ConfirmModal.css'

export interface ConfirmModalProps {
  open: boolean
  title?: string
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
  closeOnOverlay?: boolean
}

/**
 * ConfirmModal - 通用确认弹窗
 */
export default function ConfirmModal({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
  closeOnOverlay = true,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // 类型映射
  const typeConfig = {
    danger: {
      icon: <ExclamationCircleOutlined />,
      iconClass: 'confirm-icon--danger',
      btnClass: 'confirm-btn--danger',
    },
    warning: {
      icon: <WarningOutlined />,
      iconClass: 'confirm-icon--warning',
      btnClass: 'confirm-btn--warning',
    },
    info: {
      icon: <InfoCircleOutlined />,
      iconClass: 'confirm-icon--info',
      btnClass: 'confirm-btn--info',
    },
  }
  const config = typeConfig[type] || typeConfig.warning

  // ESC 关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.()
      }
    },
    [onCancel, loading]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      // 聚焦确认按钮，方便回车操作
      setTimeout(() => confirmRef.current?.focus(), 50)
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget && !loading) {
      onCancel?.()
    }
  }

  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-modal">
        {/* 关闭按钮 */}
        <button
          className="confirm-close"
          onClick={onCancel}
          disabled={loading}
          type="button"
          aria-label="关闭"
        >
          <CloseOutlined />
        </button>

        {/* 图标 */}
        <div className={`confirm-icon ${config.iconClass}`}>
          {config.icon}
        </div>

        {/* 标题 */}
        <h3 className="confirm-title">{title}</h3>

        {/* 内容 */}
        {message && (
          <div className="confirm-message">{message}</div>
        )}

        {/* 操作按钮 */}
        <div className="confirm-actions">
          <button
            className={`confirm-btn ${config.btnClass}`}
            onClick={onConfirm}
            disabled={loading}
            ref={confirmRef}
            type="button"
          >
            {loading ? (
              <>
                <span className="confirm-btn-spinner" />
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </button>
          <button
            className="confirm-btn confirm-btn--cancel"
            onClick={onCancel}
            disabled={loading}
            type="button"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
