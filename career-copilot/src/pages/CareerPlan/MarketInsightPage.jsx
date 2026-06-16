import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  ArrowLeftOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import './MarketInsight.css'

/* Mock 数据 */
const MOCK_SALARY = [
  { position: '后端开发工程师', min: 15, max: 35 },
  { position: '前端开发工程师', min: 12, max: 30 },
  { position: '全栈开发工程师', min: 18, max: 40 },
  { position: '算法工程师', min: 25, max: 60 },
  { position: '数据分析师', min: 10, max: 25 },
  { position: '产品经理', min: 12, max: 30 },
  { position: '测试工程师', min: 8, max: 20 },
  { position: 'DevOps 工程师', min: 15, max: 35 },
]

const MOCK_TREND = [65, 72, 78, 82, 85, 88, 92, 95, 93, 97, 100, 98]

const MOCK_TOP_SKILLS = [
  { name: 'Java', count: 95 },
  { name: 'Spring Boot', count: 88 },
  { name: 'MySQL', count: 82 },
  { name: 'Redis', count: 76 },
  { name: 'Docker', count: 70 },
  { name: 'Kubernetes', count: 62 },
  { name: '消息队列', count: 58 },
  { name: '微服务架构', count: 55 },
  { name: 'Linux', count: 50 },
  { name: 'Git', count: 45 },
]

const MOCK_EXPERIENCE = [
  { name: '应届（<1年）', value: 25 },
  { name: '1-3 年', value: 35 },
  { name: '3-5 年', value: 22 },
  { name: '5-10 年', value: 13 },
  { name: '10 年以上', value: 5 },
]

/* 主组件 */
const MarketInsightPage = () => {
  const [position, setPosition] = useState('后端开发工程师')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }, [position])

  /* 薪资条形图 */
  const salaryOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: (params) => {
          const item = params[0]
          return `${item.name}<br/>薪资范围: ${item.data?.[0] || item.data?.[1] || '-'}K - ${item.data?.[1] || '-'}K`
        },
      },
      grid: { left: 120, right: 20, top: 10, bottom: 24 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}K', color: 'var(--text)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: MOCK_SALARY.map((s) => s.position),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: MOCK_SALARY.map((s) => [s.min, s.max]),
          barWidth: 12,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#7c3aed' },
                { offset: 1, color: '#a78bfa' },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
        },
      ],
    }),
    []
  )

  /* 需求趋势折线图 */
  const trendOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 24 },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'line',
          data: MOCK_TREND,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
              ],
            },
          },
          itemStyle: { color: '#1890ff' },
        },
      ],
    }),
    []
  )

  /* Top 10 技能横向条形图 */
  const topSkillsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: (params) => {
          const item = params[0]
          return `${item.name}<br/>需求度: ${item.value}`
        },
      },
      grid: { left: 100, right: 40, top: 10, bottom: 24 },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: 'var(--text)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: MOCK_TOP_SKILLS.map((s) => s.name).reverse(),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: MOCK_TOP_SKILLS.map((s) => s.count).reverse(),
          barWidth: 14,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#52c41a' },
                { offset: 1, color: '#85d65a' },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}',
            fontSize: 11,
            color: 'var(--text)',
          },
        },
      ],
    }),
    []
  )

  /* 经验分布饼图 */
  const expPieOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: '{b}: {c}%',
      },
      legend: {
        bottom: 0,
        textStyle: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: MOCK_EXPERIENCE.map((item) => ({
            name: item.name,
            value: item.value,
          })),
          itemStyle: {
            borderRadius: 4,
            borderColor: 'var(--bg)',
            borderWidth: 2,
          },
          color: ['#7c3aed', '#1890ff', '#52c41a', '#fa8c16', '#ff4d4f'],
        },
      ],
    }),
    []
  )

  return (
    <div className="market-page">
      {/* 顶部 */}
      <div className="market-topbar">
        <Link to="/career-plan" className="back-link">
          <ArrowLeftOutlined /> 返回
        </Link>
      </div>

      <div className="market-header">
        <h1 className="page-title">市场洞察</h1>
        <p className="page-desc">
          了解目标岗位的薪资范围、技能需求和行业趋势
        </p>
      </div>

      {/* 搜索 */}
      <div className="search-bar">
        <SearchOutlined style={{ color: 'var(--text)' }} />
        <input
          type="text"
          className="search-input"
          placeholder="搜索目标岗位..."
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
      </div>

      {/* 图表网格 */}
      <div className="charts-grid">
        <div className="chart-card large">
          <h3 className="chart-title">薪资范围（K/月）</h3>
          {loading ? (
            <div className="loading-skeleton-cp" style={{ height: 240 }}>
              <div className="skeleton-item-cp" style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <ReactECharts option={salaryOption} style={{ height: 280 }} />
          )}
        </div>

        <div className="chart-card large">
          <h3 className="chart-title">需求趋势</h3>
          {loading ? (
            <div className="loading-skeleton-cp" style={{ height: 240 }}>
              <div className="skeleton-item-cp" style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <ReactECharts option={trendOption} style={{ height: 260 }} />
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top 10 技能需求排行</h3>
          {loading ? (
            <div className="loading-skeleton-cp" style={{ height: 300 }}>
              <div className="skeleton-item-cp" style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <ReactECharts option={topSkillsOption} style={{ height: 320 }} />
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">经验年限分布</h3>
          {loading ? (
            <div className="loading-skeleton-cp" style={{ height: 240 }}>
              <div className="skeleton-item-cp" style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <ReactECharts option={expPieOption} style={{ height: 280 }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketInsightPage
