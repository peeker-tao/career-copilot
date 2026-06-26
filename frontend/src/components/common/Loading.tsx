import type { CSSProperties } from 'react'
import './Loading.css'

interface SkeletonConfig {
  rows?: number
  widths?: string[]
  itemHeight?: number
}

export interface LoadingProps {
  tip?: string
  size?: 'small' | 'medium' | 'large'
  fullscreen?: boolean
  skeleton?: boolean | SkeletonConfig
  style?: CSSProperties
  className?: string
}

/**
 * Loading - 全局加载组件
 */
export default function Loading({
  tip = '加载中...',
  size = 'medium',
  fullscreen = false,
  skeleton = false,
  style,
  className,
}: LoadingProps) {
  // 骨架屏模式
  if (skeleton) {
    const skeletonRows = typeof skeleton === 'object' && skeleton.rows ? skeleton.rows : 4
    const skeletonWidths = typeof skeleton === 'object' && skeleton.widths ? skeleton.widths : ([] as string[])
    // 稳定宽度列表（避免在渲染中使用 Math.random）
    const stableWidths = ['70%', '55%', '80%', '45%', '65%', '75%', '60%', '85%']
    return (
      <div
        className={`loading-skeleton ${fullscreen ? 'loading-fullscreen' : ''} ${className || ''}`}
        style={style}
        role="status"
        aria-label="加载中"
      >
        {Array.from({ length: skeletonRows }, (_, i) => (
          <div
            key={i}
            className="loading-skeleton-item"
            style={{
              width: skeletonWidths[i] || stableWidths[i % stableWidths.length],
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
      className={`loading-spin ${fullscreen ? 'loading-fullscreen' : ''} ${className || ''}`}
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
