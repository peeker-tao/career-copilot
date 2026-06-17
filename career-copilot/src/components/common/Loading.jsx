import './Loading.css'

/**
 * Loading - 全局加载组件
 *
 * Props:
 *   tip        - 加载提示文字（默认 "加载中..."）
 *   size       - 尺寸: 'small' | 'medium' | 'large'（默认 'medium'）
 *   fullscreen - 是否全屏居中（默认 false）
 *   skeleton   - 骨架屏模式（默认 false），传 true 或一个对象配置骨架块
 *   style      - 自定义样式
 */
export default function Loading({
  tip = '加载中...',
  size = 'medium',
  fullscreen = false,
  skeleton = false,
  style,
}) {
  // 骨架屏模式
  if (skeleton) {
    const skeletonRows = typeof skeleton === 'object' && skeleton.rows ? skeleton.rows : 4
    const skeletonWidths = typeof skeleton === 'object' && skeleton.widths ? skeleton.widths : []
    return (
      <div
        className={`loading-skeleton ${fullscreen ? 'loading-fullscreen' : ''}`}
        style={style}
        role="status"
        aria-label="加载中"
      >
        {Array.from({ length: skeletonRows }, (_, i) => (
          <div
            key={i}
            className="loading-skeleton-item"
            style={{
              width: skeletonWidths[i] || `${Math.floor(Math.random() * 30 + 60)}%`,
              height: typeof skeleton === 'object' && skeleton.itemHeight ? skeleton.itemHeight : 16,
            }}
          />
        ))}
      </div>
    )
  }

  // Spin 模式
  const sizes = { small: 20, medium: 32, large: 48 }
  const spinnerSize = sizes[size] || sizes.medium

  const content = (
    <div
      className={`loading-spin ${fullscreen ? 'loading-fullscreen' : ''}`}
      style={style}
      role="status"
      aria-label={tip}
    >
      <svg
        className="loading-spinner"
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="loading-spinner-active"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90 150"
        />
      </svg>
      {tip && <span className="loading-tip">{tip}</span>}
    </div>
  )

  return content
}
