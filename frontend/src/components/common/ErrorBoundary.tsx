import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (args: { error: Error | null; resetError: () => void }) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary - React 错误边界组件
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 捕获渲染异常:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
        })
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-icon">
            <WarningOutlined />
          </div>
          <h2 className="error-boundary-title">页面渲染异常</h2>
          <p className="error-boundary-desc">
            应用遇到了意外错误，请尝试刷新页面。
          </p>
          {this.state.error && (
            <details className="error-boundary-details">
              <summary>错误详情</summary>
              <pre>{this.state.error.message}</pre>
              {this.state.error.stack && (
                <pre className="error-boundary-stack">{this.state.error.stack}</pre>
              )}
            </details>
          )}
          <div className="error-boundary-actions">
            <button
              className="error-boundary-btn error-boundary-btn--primary"
              onClick={this.resetError}
              type="button"
            >
              <ReloadOutlined /> 重试
            </button>
            <button
              className="error-boundary-btn error-boundary-btn--secondary"
              onClick={() => window.location.reload()}
              type="button"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
