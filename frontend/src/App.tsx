import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/Login'
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage'
import Home from './pages/Home'
import Loading from './components/common/Loading'
import { ToastContainer } from './components/common'
import { useAuthStore } from './store/useAuthStore'

const About = lazy(() => import('./pages/About'))
const User = lazy(() => import('./pages/User'))
const CareerPlanPage = lazy(() => import('./pages/CareerPlan/CareerPlanPage'))
const CareerPlanDetailPage = lazy(() => import('./pages/CareerPlan/CareerPlanDetailPage'))
const MarketInsightPage = lazy(() => import('./pages/CareerPlan/MarketInsightPage'))
const InterviewRoomPage = lazy(() => import('./pages/Interview/InterviewRoomPage'))
const InterviewHistoryPage = lazy(() => import('./pages/Interview/InterviewHistoryPage'))
const InterviewReportPage = lazy(() => import('./pages/Interview/InterviewReportPage'))
const ResumeComparePage = lazy(() => import('./pages/Resume/ResumeComparePage'))
const ResumeDetailPage = lazy(() => import('./pages/Resume/ResumeDetailPage'))
const ResumeListPage = lazy(() => import('./pages/Resume/ResumeListPage'))
const ResumeUploadPage = lazy(() => import('./pages/Resume/ResumeUploadPage'))
const ResumeRewritePage = lazy(() => import('./pages/Resume/ResumeRewritePage'))
const ScreeningPage = lazy(() => import('./pages/Resume/ScreeningPage'))
const JobMatchingPage = lazy(() => import('./pages/JobMatching/JobMatchingPage'))
const LearningResourcesPage = lazy(() => import('./pages/LearningResources/LearningResourcesPage'))
const QuestionBankPage = lazy(() => import('./pages/QuestionBank/QuestionBankPage'))

import './App.css'
import './styles/utils.css'

const App: React.FC = () => {
  const { fetchProfile, user, isAuthenticated } = useAuthStore()
  const shouldFetch = isAuthenticated && !user

  useEffect(() => {
    if (shouldFetch) {
      fetchProfile()
    }
  }, [shouldFetch, fetchProfile])

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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <Route path="/resume/compare" element={<ResumeComparePage />} />
          <Route path="/resume/upload" element={<ResumeUploadPage />} />
          <Route path="/resume/:id" element={<ResumeDetailPage />} />
          <Route path="/resume/:id/rewrite" element={<ResumeRewritePage />} />
          <Route path="/resume/screening" element={<ScreeningPage />} />
          <Route path="/job-matching" element={<JobMatchingPage />} />
          <Route path="/resources" element={<LearningResourcesPage />} />
          <Route path="/question-bank" element={<QuestionBankPage />} />
          </Route>
      </Routes>
      <ToastContainer />
    </Suspense>
  )
}

export default App
