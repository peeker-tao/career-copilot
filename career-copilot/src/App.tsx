import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Loading from './components/common/Loading'

const About = lazy(() => import('./pages/About'))
const User = lazy(() => import('./pages/User'))
const CareerPlanPage = lazy(() => import('./pages/CareerPlan/CareerPlanPage'))
const CareerPlanDetailPage = lazy(() => import('./pages/CareerPlan/CareerPlanDetailPage'))
const MarketInsightPage = lazy(() => import('./pages/CareerPlan/MarketInsightPage'))
const InterviewRoomPage = lazy(() => import('./pages/Interview/InterviewRoomPage'))
const InterviewHistoryPage = lazy(() => import('./pages/Interview/InterviewHistoryPage'))
const InterviewReportPage = lazy(() => import('./pages/Interview/InterviewReportPage'))
const ResumeDetailPage = lazy(() => import('./pages/Resume/ResumeDetailPage'))
const ResumeListPage = lazy(() => import('./pages/Resume/ResumeListPage'))
const ResumeUploadPage = lazy(() => import('./pages/Resume/ResumeUploadPage'))

import './App.css'
import './styles/utils.css'

const App: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* 公开路由 - 无导航栏 */}
        <Route path="/login" element={<Login />} />

        {/* 受保护路由 - 带导航栏布局 */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/user" element={<User />} />
          <Route path="/user/:id" element={<User />} />
          <Route path="/profile" element={<User />} />
          <Route path="/career-plan" element={<CareerPlanPage />} />
          <Route path="/career-plan/market-insight" element={<MarketInsightPage />} />
          <Route path="/career-plan/:id" element={<CareerPlanDetailPage />} />
          <Route path="/interview" element={<InterviewHistoryPage />} />
          <Route path="/interview/:id" element={<InterviewRoomPage />} />
          <Route path="/interview/:id/report" element={<InterviewReportPage />} />
          <Route path="/resume" element={<ResumeListPage />} />
          <Route path="/resume/:id" element={<ResumeDetailPage />} />
          <Route path="/resume/upload" element={<ResumeUploadPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
