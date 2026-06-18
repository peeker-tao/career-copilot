import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import { Greeting, StatsCards, QuickActions, HomeInterviewList } from '@/components/home'
import Loading from '@/components/common/Loading'

const ScoreChart = lazy(() => import('@/components/home/ScoreChart'))

import './Home.css'

const MOCK_STATS = {
  totalInterviews: 12,
  avgScore: 86.5,
  resumeCount: 3,
  activePlans: 2,
}

const MOCK_SCORE_TREND = [72, 78, 65, 85, 82, 90, 88]

const MOCK_INTERVIEWS = [
  { id: 1, position: '前端开发工程师', difficulty: 'medium', score: 85, date: '2026-06-15' },
  { id: 2, position: '后端开发工程师', difficulty: 'hard', score: 92, date: '2026-06-10' },
  { id: 3, position: '算法工程师', difficulty: 'easy', score: 78, date: '2026-06-05' },
  { id: 4, position: '产品经理', difficulty: 'medium', score: 70, date: '2026-05-28' },
  { id: 5, position: '全栈开发工程师', difficulty: 'hard', score: 88, date: '2026-05-20' },
]

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<typeof MOCK_STATS | null>(null)
  const [scoreTrend, setScoreTrend] = useState<number[]>([])
  const [interviews, setInterviews] = useState<typeof MOCK_INTERVIEWS>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [statsData, trendData, interviewsData] = await Promise.all([
          new Promise<typeof MOCK_STATS>((resolve) => setTimeout(() => resolve(MOCK_STATS), 400)),
          new Promise<number[]>((resolve) => setTimeout(() => resolve(MOCK_SCORE_TREND), 500)),
          new Promise<typeof MOCK_INTERVIEWS>((resolve) => setTimeout(() => resolve(MOCK_INTERVIEWS), 450)),
        ])

        setStats(statsData)
        setScoreTrend(trendData)
        setInterviews(interviewsData.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ))
      } catch (err) {
        console.error('加载仪表盘数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="dashboard">
      <Greeting />
      <StatsCards stats={stats} loading={loading} />
      <QuickActions />

      <div className="content-grid">
        <div className="section-card">
          <div className="section-header">
            <h2>📈 面试评分趋势</h2>
            <Link to="/interview/history" className="section-link">
              查看全部 <RightOutlined className="fs-10" />
            </Link>
          </div>
          <Suspense fallback={<Loading />}>
            <ScoreChart data={scoreTrend} loading={loading} />
          </Suspense>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h2>📋 最近面试记录</h2>
            <Link to="/interview/history" className="section-link">
              查看全部 <RightOutlined className="fs-10" />
            </Link>
          </div>
          <HomeInterviewList interviews={interviews} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Home
