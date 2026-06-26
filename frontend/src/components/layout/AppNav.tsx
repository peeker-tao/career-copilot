import { Link, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  CompassOutlined,
} from '@ant-design/icons'

const navItems = [
  { path: '/', label: '首页', icon: <HomeOutlined /> },
  { path: '/interview', label: 'AI 面试', icon: <MessageOutlined /> },
  { path: '/resume', label: '简历', icon: <FileTextOutlined /> },
  { path: '/career-plan', label: '规划', icon: <CompassOutlined /> },
  { path: '/profile', label: '我的', icon: <UserOutlined /> },
]

export default function AppNav() {
  const location = useLocation()

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="nav-logo">🚀</span>
        <span className="nav-name">Career Copilot</span>
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
