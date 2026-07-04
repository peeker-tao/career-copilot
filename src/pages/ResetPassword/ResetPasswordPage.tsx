import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { KeyOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { resetPassword } from '@/api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [step, setStep] = useState<'resetting' | 'done'>('resetting')

  useEffect(() => {
    const t = searchParams.get('token')
    if (t) setToken(t)
    const e = searchParams.get('email')
    if (e) setEmail(e)
  }, [searchParams])

  const handleReset = async () => {
    if (!token.trim() || !newPwd || !confirmPwd) {
      setMsgType('error'); setMsg('请填写所有字段'); return
    }
    if (newPwd !== confirmPwd) {
      setMsgType('error'); setMsg('两次密码不一致'); return
    }
    if (newPwd.length < 6) {
      setMsgType('error'); setMsg('密码至少 6 位'); return
    }
    setLoading(true); setMsg(null)
    try {
      await resetPassword(email, token.trim(), newPwd)
      setStep('done')
      setMsgType('success')
      setMsg('密码重置成功')
    } catch (err) {
      setMsgType('error')
      setMsg((err as Error).message || '重置失败')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-page, #f5f5f7)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <KeyOutlined style={{ fontSize: 40, color: 'var(--accent, #7c3aed)', marginBottom: 8 }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>重置密码</h1>
        </div>

        {step === 'done' ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: 'var(--success, #22c55e)', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--success, #22c55e)' }}>密码重置成功</p>
            <button className="qb-btn qb-btn-primary" style={{ marginTop: 20, padding: '10px 28px' }} onClick={() => navigate('/login')}>
              返回登录
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="qb-gen-input" placeholder="重置 token（已自动填入）" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            <input className="qb-gen-input" type="password" placeholder="新密码（至少6位）" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            <input className="qb-gen-input" type="password" placeholder="确认新密码" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />

            {msg && (
              <p style={{ margin: '4px 0 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, color: msgType === 'success' ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)' }}>
                {msgType === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                {msg}
              </p>
            )}

            <button className="qb-btn qb-btn-primary" disabled={loading} onClick={handleReset} style={{ marginTop: 8, padding: '10px 0', width: '100%' }}>
              {loading ? '重置中...' : '确认重置'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}