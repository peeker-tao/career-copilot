import { useState } from 'react'
import { SafetyCertificateOutlined, LogoutOutlined, KeyOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'

export interface AccountSecurityProps {
  onLogoutRequest: () => void
}

const AccountSecurity: React.FC<AccountSecurityProps> = ({ onLogoutRequest }) => {
  const changePassword = useAuthStore((s) => s.changePassword)
  const toast = useToastStore((s) => s.addToast)

  const [showPwdModal, setShowPwdModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const resetForm = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async () => {
    // 校验
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('warning', '请填写所有密码字段')
      return
    }
    if (newPassword.length < 6) {
      toast('warning', '新密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('warning', '两次输入的新密码不一致')
      return
    }
    if (oldPassword === newPassword) {
      toast('warning', '新密码不能与旧密码相同')
      return
    }

    setPwdLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      toast('success', '密码修改成功')
      setShowPwdModal(false)
      resetForm()
    } catch {
      toast('error', '密码修改失败，请检查当前密码是否正确')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <>
      <div className="account-security">
        <div className="security-item">
          <div className="security-left">
            <SafetyCertificateOutlined className="security-icon" />
            <div>
              <div className="security-title">登录密码</div>
              <div className="security-desc">********</div>
            </div>
          </div>
          <button className="btn-secondary security-btn" onClick={() => { resetForm(); setShowPwdModal(true) }}>
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
      </div>

      {/* 修改密码弹窗 */}
      {showPwdModal && (
        <div className="pwd-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowPwdModal(false); resetForm() } }}>
          <div className="pwd-modal">
            <button className="pwd-modal-close" onClick={() => { setShowPwdModal(false); resetForm() }}>
              <CloseOutlined />
            </button>
            <h3 className="pwd-modal-title">修改密码</h3>

            <div className="pwd-form-group">
              <label className="pwd-form-label">当前密码</label>
              <input
                className="pwd-form-input"
                type="password"
                placeholder="请输入当前密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="pwd-form-group">
              <label className="pwd-form-label">新密码</label>
              <input
                className="pwd-form-input"
                type="password"
                placeholder="请输入新密码（至少 6 位）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="pwd-form-group">
              <label className="pwd-form-label">确认新密码</label>
              <input
                className="pwd-form-input"
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pwd-modal-actions">
              <button className="btn-cancel" onClick={() => { setShowPwdModal(false); resetForm() }} disabled={pwdLoading}>
                取消
              </button>
              <button className="btn-save" onClick={handleChangePassword} disabled={pwdLoading}>
                {pwdLoading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AccountSecurity
