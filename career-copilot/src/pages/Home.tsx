import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import { Greeting, StatsCards, QuickActions, HomeInterviewList } from '@/components/home'
import Loading from '@/components/common/Loading'
import { useAuthStore } from '@/store/useAuthStore'
import { useInterviewStore } from '@/store/useInterviewStore'
import { toast } from '@/store/useToastStore'
import type { UserStats } from '@/types/auth'

const ScoreChart = lazy(() => import('@/components/home/ScoreChart'))

import './Home.css'

/** HomeInterviewList 组件期望的记录格式 */
interface HomeInterviewRecord {
  id: number
  position: string
  difficulty: string
  score: number
  date: string
}

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [scoreTrend, setScoreTrend] = useState<number[]>([])
  const [interviews, setInterviews] = useState<HomeInterviewRecord[]>([])

  const fetchStats = useAuthStore((s) => s.fetchStats)
  const authStats = useAuthStore((s) => s.stats)
  const fetchInterviews = useInterviewStore((s) => s.fetchInterviews)
  const storeInterviews = useInterviewStore((s) => s.interviews)

  // 初始加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchStats(), fetchInterviews()])
      } catch (err) {
        toast.error('加载仪表盘数据失败: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // 仅在组件挂载时执行一次

  // 当 authStats 更新时，更新本地 stats
  useEffect(() => {
    if (authStats) {
      setStats(authStats)
    }
  }, [authStats])

  // 当 storeInterviews 更新时，计算 scoreTrend 和 interviews
  useEffect(() => {
    if (storeInterviews.length > 0) {
      // 计算评分趋势（所有面试成绩）
      const scores = storeInterviews.map((i) => i.score ?? 0)
      setScoreTrend(scores)

      // 取最近5条记录用于首页展示
      setInterviews(
        storeInterviews.slice(0, 5).map((i) => ({
          id: parseInt(i.id, 36) % 10000,
          position: i.targetPosition,
          difficulty: i.difficulty,
          score: i.score ?? 0,
          date: i.startedAt ? i.startedAt.slice(0, 10) : '',
        }))
      )
    } else {
      setScoreTrend([])
      setInterviews([])
    }
  }, [storeInterviews])

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
