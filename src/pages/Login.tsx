import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import {
  LoadingOutlined, UserOutlined, LockOutlined, MailOutlined,
  ThunderboltOutlined, ArrowLeftOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons'
import { forgotPassword, resetPassword } from '@/api/auth'
import BackgroundImage from '@/components/login/BackgroundImage'
import './Login.css'

type LoginMode = 'login' | 'register' | 'forgot'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
  const { login, register, loading, error, clearError, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const [mode, setMode] = useState<LoginMode>('login')

  // 登录/注册 表单状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // 忘记密码 表单状态
  const [forgotStep, setForgotStep] = useState(1)         // 1=邮箱→发验证码, 2=输入验证码, 3=新密码
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 清理 countdown 定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 倒计时逻辑
  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode)
    setFormError(null)
    setForgotError(null)
    setForgotStep(1)
    setForgotCode('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotSuccess(false)
    clearError()
  }

  // ---- 登录/注册 校验 ----
  const validate = (): boolean => {
    if (!email.trim()) { setFormError('请输入邮箱'); return false }
    if (!password) { setFormError('请输入密码'); return false }
    if (password.length < 6) { setFormError('密码至少 6 位'); return false }
    if (mode === 'register') {
      if (!name.trim()) { setFormError('请输入昵称'); return false }
      if (password !== confirmPassword) { setFormError('两次密码不一致'); return false }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    clearError()
    if (!validate()) return

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
    } catch {
      // Error is set in store, displayed via `error` state
    }
  }

  // ---- 忘记密码 ----

  /** 发送验证码 */
  const handleSendCode = async () => {
    if (!forgotEmail.trim()) { setForgotError('请输入邮箱'); return }
    setForgotError(null)
    setForgotLoading(true)
    try {
      await forgotPassword(forgotEmail)
      startCountdown()
      setForgotStep(2)
    } catch {
      setForgotError('发送验证码失败，请重试')
    } finally {
      setForgotLoading(false)
    }
  }

  /** 提交验证码 → 进入设置新密码 */
  const handleVerifyCode = () => {
    if (!forgotCode.trim() || forgotCode.length !== 6) {
      setForgotError('请输入6位验证码')
      return
    }
    setForgotError(null)
    setForgotStep(3)
  }

  /** 提交新密码 */
  const handleResetPassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('新密码至少 6 位')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('两次密码不一致')
      return
    }
    setForgotError(null)
    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail, forgotCode, forgotNewPassword)
      setForgotSuccess(true)
      // 3 秒后跳回登录
      setTimeout(() => {
        setMode('login')
        setEmail(forgotEmail)
        setForgotStep(1)
        setForgotCode('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
        setForgotSuccess(false)
      }, 3000)
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || err?.message || '重置密码失败，请重试')
    } finally {
      setForgotLoading(false)
    }
  }

  // ---- 渲染 ----

  const renderForgotForm = () => {
    if (forgotSuccess) {
      return (
        <div className="forgot-success">
          <div className="forgot-success-icon">✓</div>
          <h3>密码重置成功</h3>
          <p>即将跳转到登录页...</p>
        </div>
      )
    }

    return (
      <>
        {/* 步骤指示器 */}
        <div className="forgot-steps">
          <div className={`forgot-step ${forgotStep >= 1 ? 'active' : ''}`}>
            <span className="forgot-step-num">1</span>
            <span className="forgot-step-label">验证邮箱</span>
          </div>
          <div className="forgot-step-line" />
          <div className={`forgot-step ${forgotStep >= 2 ? 'active' : ''}`}>
            <span className="forgot-step-num">2</span>
            <span className="forgot-step-label">验证码</span>
          </div>
          <div className="forgot-step-line" />
          <div className={`forgot-step ${forgotStep >= 3 ? 'active' : ''}`}>
            <span className="forgot-step-num">3</span>
            <span className="forgot-step-label">新密码</span>
          </div>
        </div>

        {/* 步骤 1: 输入邮箱 */}
        {forgotStep === 1 && (
          <div className="form-field">
            <MailOutlined className="field-icon" />
            <input
              type="email"
              placeholder="输入注册时使用的邮箱"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="field-input"
            />
          </div>
        )}

        {/* 步骤 2: 输入验证码 */}
        {forgotStep === 2 && (
          <>
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              验证码已发送至 <strong>{forgotEmail}</strong>
            </div>
            <div className="form-field">
              <SafetyCertificateOutlined className="field-icon" />
              <input
                type="text"
                placeholder="输入6位验证码"
                maxLength={6}
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="field-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyCode() }}
              />
            </div>
          </>
        )}

        {/* 步骤 3: 输入新密码 */}
        {forgotStep === 3 && (
          <>
            <div className="form-field">
              <LockOutlined className="field-icon" />
              <input
                type="password"
                placeholder="新密码（至少6位）"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="form-field">
              <LockOutlined className="field-icon" />
              <input
                type="password"
                placeholder="确认新密码"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                className="field-input"
              />
            </div>
          </>
        )}

        {forgotError && (
          <div className="login-error">{forgotError}</div>
        )}

        {/* 操作按钮 */}
        {forgotStep === 1 && (
          <button
            className="login-submit"
            disabled={forgotLoading || countdown > 0}
            onClick={handleSendCode}
          >
            {forgotLoading ? (
              <><LoadingOutlined className="mr-8" /> 发送中...</>
            ) : countdown > 0 ? (
              `重新发送 (${countdown}s)`
            ) : (
              '发送验证码'
            )}
          </button>
        )}
        {forgotStep === 2 && (
          <>
            <button className="login-submit" onClick={handleVerifyCode}>
              下一步
            </button>
            {countdown === 0 && (
              <button
                className="forgot-resend"
                onClick={handleSendCode}
                disabled={forgotLoading}
              >
                {forgotLoading ? '发送中...' : '重新发送验证码'}
              </button>
            )}
          </>
        )}
        {forgotStep === 3 && (
          <button className="login-submit" onClick={handleResetPassword} disabled={forgotLoading}>
            {forgotLoading ? (
              <><LoadingOutlined className="mr-8" /> 重置中...</>
            ) : (
              '重置密码'
            )}
          </button>
        )}

        {/* 返回登录 */}
        <div className="forgot-back" onClick={() => switchMode('login')}>
          <ArrowLeftOutlined /> 返回登录
        </div>
      </>
    )
  }

  return (
    <div className="login-page">
      <BackgroundImage className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo"><ThunderboltOutlined /></span>
          <h1 className="login-title">Career Copilot</h1>
          <p className="login-subtitle">AI 驱动的职业发展助手</p>
        </div>

        {mode !== 'forgot' ? (
          <>
            <div className="login-tabs">
              <button
                className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                登录
              </button>
              <button
                className={`login-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                注册
              </button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {(formError || error) && (
                <div className="login-error">
                  {formError || error}
                </div>
              )}

              {mode === 'register' && (
                <div className="form-field">
                  <UserOutlined className="field-icon" />
                  <input
                    type="text"
                    placeholder="昵称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              <div className="form-field">
                <MailOutlined className="field-icon" />
                <input
                  type="email"
                  placeholder="邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="form-field">
                <LockOutlined className="field-icon" />
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input"
                />
              </div>

              {mode === 'register' && (
                <div className="form-field">
                  <LockOutlined className="field-icon" />
                  <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <><LoadingOutlined className="mr-8" /> 处理中...</>
                ) : (
                  mode === 'login' ? '登录' : '注册'
                )}
              </button>

              {mode === 'login' && (
                <div className="forgot-link" onClick={() => switchMode('forgot')}>
                  忘记密码？
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="login-form">
            <h3 className="forgot-title">忘记密码</h3>
            {renderForgotForm()}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
