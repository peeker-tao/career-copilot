import { Component } from 'react'
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons'
import './ErrorBoundary.css'

/**
 * ErrorBoundary - React 错误边界组件
 *
 * Props:
 *   children  - 子组件
 *   fallback  - 自定义错误 UI（可选），接收 { error, resetError }
 *   onError   - 错误回调（可选），用于日志上报
 *
 * 用法:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // 控制台输出详细错误信息
    console.error('[ErrorBoundary] 捕获渲染异常:', error, errorInfo)
    // 调用外部错误回调（如日志上报）
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，则使用
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
        })
      }

      // 默认错误 UI
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
