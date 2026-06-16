import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  MessageOutlined,
  FileTextOutlined,
  CompassOutlined,
  RightOutlined,
  StarOutlined,
  ScheduleOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import './Home.css'

// Mock 数据
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

const DIFFICULTY_MAP = {
  easy: { label: '简单', cls: 'easy' },
  medium: { label: '中等', cls: 'medium' },
  hard: { label: '困难', cls: 'hard' },
}

// 问候语
function Greeting() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return { text: '夜深了', emoji: '🌙' }
    if (hour < 9) return { text: '早上好', emoji: '🌅' }
    if (hour < 12) return { text: '上午好', emoji: '☀️' }
    if (hour < 14) return { text: '中午好', emoji: '🌞' }
    if (hour < 18) return { text: '下午好', emoji: '🌤️' }
    if (hour < 22) return { text: '晚上好', emoji: '🌆' }
    return { text: '夜深了', emoji: '🌙' }
  }, [])

  return (
    <div className="greeting-section">
      <h1>
        {greeting.emoji} {greeting.text}，求职者！
      </h1>
      <p className="greeting-sub">
        每一次练习都在靠近梦想，今天也要加油鸭！🦆
      </p>
    </div>
  )
}

// 统计卡片
function StatsCards({ stats, loading }) {
  const items = [
    { icon: <MessageOutlined />, color: 'blue', label: '面试次数', key: 'totalInterviews' },
    { icon: <StarOutlined />, color: 'green', label: '平均评分', key: 'avgScore', suffix: '分' },
    { icon: <FileTextOutlined />, color: 'purple', label: '简历数量', key: 'resumeCount' },
    { icon: <ScheduleOutlined />, color: 'orange', label: '进行中规划', key: 'activePlans' },
  ]

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="loading-skeleton" style={{ width: '100%', padding: 0 }}>
              <div className="skeleton-item" style={{ height: 48, width: 48, borderRadius: 12 }} />
              <div className="skeleton-item" style={{ width: '60%', marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="stats-grid">
      {items.map((item) => {
        const value = stats?.[item.key]
        const display = item.key === 'avgScore' ? value : value
        return (
          <div key={item.key} className="stat-card">
            <div className={`stat-icon ${item.color}`}>{item.icon}</div>
            <div className="stat-info">
              <div className="stat-number">
                {display ?? '—'}
                {item.suffix ?? ''}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 快速入口
function QuickActions() {
  const actions = [
    {
      icon: <MessageOutlined />,
      color: 'purple',
      title: 'AI 模拟面试',
      desc: '与 AI 面试官一对一练习',
      to: '/interview',
    },
    {
      icon: <FileTextOutlined />,
      color: 'blue',
      title: '简历管理',
      desc: '上传、查看、优化简历',
      to: '/resume',
    },
    {
      icon: <CompassOutlined />,
      color: 'green',
      title: '职业规划',
      desc: '制定专属职业发展路径',
      to: '/career-plan',
    },
  ]

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <Link key={action.to} to={action.to} className="quick-action-card">
          <div className={`qa-icon ${action.color}`}>{action.icon}</div>
          <h3>{action.title}</h3>
          <p>{action.desc}</p>
        </Link>
      ))}
    </div>
  )
}

// 评分趋势图
function ScoreChart({ data, loading }) {
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: '第 {c} 次面试<br/>评分: <strong>{c} 分</strong>',
      },
      grid: {
        left: 40,
        right: 16,
        top: 20,
        bottom: 24,
      },
      xAxis: {
        type: 'category',
        data: data.map((_, i) => `第${i + 1}次`),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisTick: { show: false },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: {
          lineStyle: { color: 'var(--border)', type: 'dashed' },
        },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'line',
          data,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#7c3aed',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(124, 58, 237, 0.3)' },
                { offset: 1, color: 'rgba(124, 58, 237, 0.02)' },
              ],
            },
          },
          itemStyle: {
            color: '#7c3aed',
            borderWidth: 2,
            borderColor: '#fff',
          },
          markLine: {
            silent: true,
            data: [
              {
                yAxis: 60,
                label: {
                  formatter: '及格线',
                  color: 'var(--text)',
                  fontSize: 11,
                },
                lineStyle: {
                  color: '#ff4d4f',
                  type: 'dashed',
                  width: 1,
                },
              },
            ],
          },
        },
      ],
    }),
    [data]
  )

  if (loading) {
    return (
      <div className="chart-wrapper loading-skeleton" style={{ padding: 0 }}>
        <div className="skeleton-item" style={{ width: '100%', height: '100%' }} />
      </div>
    )
  }

  return (
    <div className="chart-wrapper">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

// 面试记录列表
function InterviewList({ interviews, loading }) {
  if (loading) {
    return (
      <div className="loading-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-item" style={{ height: 52, marginBottom: 8 }} />
        ))}
      </div>
    )
  }

  if (!interviews || interviews.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <MessageOutlined />
        </div>
        <p>暂无面试记录，快去开始第一次面试吧！</p>
      </div>
    )
  }

  return (
    <ul className="interview-list">
      {interviews.map((item) => {
        const diff = DIFFICULTY_MAP[item.difficulty] || { label: '未知', cls: 'medium' }
        return (
          <li key={item.id} className="interview-item">
            <div className="position-icon">
              <CodeOutlined />
            </div>
            <div className="item-info">
              <div className="item-title">{item.position}</div>
              <div className="item-meta">
                <span className={`difficulty-tag ${diff.cls}`}>{diff.label}</span>
                <span>{item.date}</span>
              </div>
            </div>
            <div className="item-score">{item.score}</div>
          </li>
        )
      })}
    </ul>
  )
}

// 主组件
const Home = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [scoreTrend, setScoreTrend] = useState([])
  const [interviews, setInterviews] = useState([])

  useEffect(() => {
    // 模拟异步加载数据
    const loadData = async () => {
      setLoading(true)
      try {
        // 模拟 Promise.all 并行请求
        const [statsData, trendData, interviewsData] = await Promise.all([
          new Promise((resolve) => setTimeout(() => resolve(MOCK_STATS), 400)),
          new Promise((resolve) => setTimeout(() => resolve(MOCK_SCORE_TREND), 500)),
          new Promise((resolve) => setTimeout(() => resolve(MOCK_INTERVIEWS), 450)),
        ])

        setStats(statsData)
        setScoreTrend(trendData)
        setInterviews(interviewsData.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
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
        {/* 左侧：评分趋势 */}
        <div className="section-card">
          <div className="section-header">
            <h2>📈 面试评分趋势</h2>
            <Link to="/interview/history" className="section-link">
              查看全部 <RightOutlined style={{ fontSize: 10 }} />
            </Link>
          </div>
          <ScoreChart data={scoreTrend} loading={loading} />
        </div>

        {/* 右侧：最近面试记录 */}
        <div className="section-card">
          <div className="section-header">
            <h2>📋 最近面试记录</h2>
            <Link to="/interview/history" className="section-link">
              查看全部 <RightOutlined style={{ fontSize: 10 }} />
            </Link>
          </div>
          <InterviewList interviews={interviews} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Home
