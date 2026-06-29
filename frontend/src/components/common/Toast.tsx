import { useEffect, useState, useRef } from 'react'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  CloseOutlined,
} from '@ant-design/icons'
import { useToastStore } from '@/store/useToastStore'
import './Toast.css'

const iconMap = {
  error: <CloseCircleFilled />,
  success: <CheckCircleFilled />,
  warning: <ExclamationCircleFilled />,
  info: <InfoCircleFilled />,
}


export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  const [exitingToasts, setExitingToasts] = useState(new Set())
  const toastRefs = useRef({} as Record<string, HTMLDivElement | null>)

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.timeout && !exitingToasts.has(toast.id)) {
        const toastElement = toastRefs.current[toast.id]
        if (toastElement) {
          // 获取 toast 的实际高度
          const height = toastElement.offsetHeight
          // 记录高度用于动画
          toastElement.style.setProperty('--toast-height', `${height}px`)
        }

        setExitingToasts(prev => new Set(prev).add(toast.id))

        const timer = setTimeout(() => {
          removeToast(toast.id)
          setExitingToasts(prev => {
            const next = new Set(prev)
            next.delete(toast.id)
            return next
          })
        }, 300)

        return () => clearTimeout(timer)
      }
    })
  }, [toasts, exitingToasts, removeToast])

  if (toasts.length === 0) return null

  const handleClose = (id: string) => {
    const toastElement = toastRefs.current[id]
    if (toastElement) {
      const height = toastElement.offsetHeight
      toastElement.style.setProperty('--toast-height', `${height}px`)
    }

    setExitingToasts(prev => new Set(prev).add(id))
    setTimeout(() => {
      removeToast(id)
      setExitingToasts(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          ref={el => { toastRefs.current[t.id] = el }}
          className={`toast-item toast-${t.type} ${exitingToasts.has(t.id) ? 'toast-exiting' : ''}`}
        >
          <span className="toast-icon">{iconMap[t.type]}</span>
          <span className="toast-body">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => handleClose(t.id)}
            aria-label="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
      ))}
    </div>
  )
}