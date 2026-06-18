import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { LoadingOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import BackgroundImage from '@/components/login/BackgroundImage'
import './Login.css'

type LoginMode = 'login' | 'register'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)


  const switchMode = (newMode: LoginMode) => {
    setMode(newMode)
    setFormError(null)
    clearError()
  }

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
      navigate(from, { replace: true })
    } catch {
      // Error is set in store, displayed via `error` state
    }
  }

  return (
    <div className="login-page">
      <BackgroundImage className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🚀</span>
          <h1 className="login-title">Career Copilot</h1>
          <p className="login-subtitle">AI 驱动的职业发展助手</p>
        </div>

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
        </form>
      </div>
    </div>
  )
}

export default Login
