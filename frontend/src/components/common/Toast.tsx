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

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{iconMap[t.type]}</span>
          <span className="toast-body">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
      ))}
    </div>
  )
}
