import { ExclamationCircleOutlined } from '@ant-design/icons'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="error-display flex flex-col items-center justify-center text-center" style={{ padding: '60px 20px' }}>
      <ExclamationCircleOutlined className="fs-48 text-danger mb-16" />
      <h3 className="m-0 mb-8 text-heading">加载失败</h3>
      <p className="m-0 mb-20 text-body fs-14">{error}</p>
      {onRetry && (
        <button className="error-retry-btn" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}
