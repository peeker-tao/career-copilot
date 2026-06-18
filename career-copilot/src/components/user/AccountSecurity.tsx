import { SafetyCertificateOutlined, LogoutOutlined, KeyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

export interface AccountSecurityProps {
  onLogoutRequest: () => void
}

const AccountSecurity: React.FC<AccountSecurityProps> = ({ onLogoutRequest }) => {
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
        <button className="btn-secondary security-btn" disabled title="功能开发中">
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
  )
}

export default AccountSecurity
