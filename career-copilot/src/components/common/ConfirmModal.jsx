import { useEffect, useCallback, useRef } from 'react'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import './ConfirmModal.css'

/**
 * ConfirmModal - 通用确认弹窗
 *
 * Props:
 *   open         - 是否显示
 *   title        - 标题
 *   message      - 提示内容（支持 JSX）
 *   confirmText  - 确认按钮文字（默认 "确认"）
 *   cancelText   - 取消按钮文字（默认 "取消"）
 *   onConfirm    - 确认回调
 *   onCancel     - 取消回调
 *   type         - 类型: 'danger' | 'warning' | 'info'（默认 'warning'）
 *   loading      - 确认按钮加载状态（默认 false）
 *   closeOnOverlay - 点击遮罩关闭（默认 true）
 *
 * 用法:
 *   <ConfirmModal
 *     open={showDelete}
 *     title="确认删除"
 *     message="删除后无法恢复，确定要删除吗？"
 *     type="danger"
 *     confirmText="删除"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDelete(false)}
 *   />
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
}) {
  const confirmRef = useRef(null)

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
    (e) => {
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
  const handleOverlayClick = (e) => {
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
