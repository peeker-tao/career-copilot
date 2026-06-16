import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  CompassOutlined,
} from '@ant-design/icons'
import { Home, About, User, CareerPlanPage, CareerPlanDetailPage, MarketInsightPage, InterviewRoomPage } from './pages'
import './App.css'

function App() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '首页', icon: <HomeOutlined /> },
    { path: '/interview', label: 'AI 面试', icon: <MessageOutlined /> },
    { path: '/resume', label: '简历', icon: <FileTextOutlined /> },
    { path: '/career-plan', label: '规划', icon: <CompassOutlined /> },
    { path: '/profile', label: '我的', icon: <UserOutlined /> },
  ]

  return (
    <>
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
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/user" element={<User />} />
          <Route path="/user/:id" element={<User />} />
          <Route path="/profile" element={<User />} />
          <Route path="/career-plan" element={<CareerPlanPage />} />
          <Route path="/career-plan/market-insight" element={<MarketInsightPage />} />
          <Route path="/career-plan/:id" element={<CareerPlanDetailPage />} />
          <Route path="/interview" element={<InterviewRoomPage />} />
          <Route path="/interview/:id" element={<InterviewRoomPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
