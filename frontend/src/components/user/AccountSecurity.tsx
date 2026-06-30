import { useState } from 'react'
import { SafetyCertificateOutlined, LogoutOutlined, KeyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { forgotPassword, resetPassword } from '@/api/auth'
import { useAuthStore } from '@/store/useAuthStore'

export interface AccountSecurityProps {
  onLogoutRequest: () => void
}

const AccountSecurity: React.FC<AccountSecurityProps> = ({ onLogoutRequest }) => {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<'idle' | 'sending' | 'sent' | 'resetting'>('idle')
  const [token, setToken] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  const handleSendEmail = async () => {
    if (!user?.email) return
    setLoading(true)
    setMsg(null)
    setStep('sending')
    try {
      await forgotPassword(user.email)
      setToken('')
      setNewPwd('')
      setConfirmPwd('')
      setStep('sent')
      setMsgType('success')
      setMsg('重置链接已发送至你的邮箱，请查收并复制链接中的 token')
    } catch (err) {
      setStep('idle')
      setMsgType('error')
      setMsg((err as Error).message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!token.trim() || !newPwd || !confirmPwd) {
      setMsgType('error')
      setMsg('请填写所有字段')
      return
    }
    if (newPwd !== confirmPwd) {
      setMsgType('error')
      setMsg('两次密码不一致')
      return
    }
    if (newPwd.length < 6) {
      setMsgType('error')
      setMsg('密码至少 6 位')
      return
    }
    setLoading(true)
    setMsg(null)
    setStep('resetting')
    try {
      await resetPassword(token.trim(), newPwd)
      setMsgType('success')
      setMsg('密码修改成功')
      setToken('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => { setStep('idle'); setMsg(null) }, 1500)
    } catch (err) {
      setMsgType('error')
      setMsg((err as Error).message || '重置失败')
      setStep('sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="account-security">
      <div className="security-item">
        <div className="security-left">
          <SafetyCertificateOutlined className="security-icon" />
          <div>
            <div className="security-title">登录密码</div>
            <div className="security-desc">********</div>
          </div>
        </div>
        <button className="btn-secondary security-btn" onClick={() => setStep('sending')}>
          <KeyOutlined /> 修改密码
        </button>
      </div>

      <div className="security-divider" />

      <div className="security-item">
        <div className="security-left">
          <ExclamationCircleOutlined className="security-icon danger" />
          <div>
            <div className="security-title">退出登录</div>
            <div className="security-desc">退出后将需要重新登录</div>
          </div>
        </div>
        <button className="btn-danger" onClick={onLogoutRequest}>
          <LogoutOutlined /> 退出登录
        </button>
      </div>

      {step !== 'idle' && (
        <div className="qb-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setStep('idle'); setMsg(null) } }}>
          <div className="qb-modal" style={{ maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 16px 0' }}><KeyOutlined /> 修改密码</h3>

            {step === 'sending' && !loading && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                将向 {user?.email} 发送重置链接
              </p>
            )}

            {step === 'sending' && loading && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>发送中...</p>
            )}

            {step === 'sent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="qb-gen-input" placeholder="邮箱中的重置 token" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                <input className="qb-gen-input" type="password" placeholder="新密码（至少6位）" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                <input className="qb-gen-input" type="password" placeholder="确认新密码" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                <div className="qb-modal-close" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="qb-btn" onClick={handleSendEmail} disabled={loading}>重新发送</button>
                  <button className="qb-btn-primary" disabled={loading || !token.trim() || !newPwd || !confirmPwd} onClick={handleReset}>
                    {loading ? '重置中...' : '确认重置'}
                  </button>
                </div>
              </div>
            )}

            {msg && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: msgType === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                {msg}
              </p>
            )}

            {step === 'sending' && !loading && (
              <div className="qb-modal-close" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="qb-btn" onClick={() => { setStep('idle'); setMsg(null) }}>取消</button>
                <button className="qb-btn-primary" onClick={handleSendEmail}>
                  发送重置邮件
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSecurity