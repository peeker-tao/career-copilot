import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Loading } from '@/components/common'

// echarts tooltip formatter 参数类型
interface TooltipParam {
  name: string
  value?: number | [number, number]
  data?: number | [number, number]
  seriesName?: string
}

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

export interface MarketChartsProps {
  loading: boolean
}

export default function MarketCharts({ loading }: MarketChartsProps) {
  const salaryOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: (params: TooltipParam[]) => {
          const item = params[0]
          return `${item.name}<br/>薪资范围: ${(item.data as [number, number])?.[0] || '-'}K - ${(item.data as [number, number])?.[1] || '-'}K`
        },
      },
      grid: { left: 120, right: 20, top: 10, bottom: 24 },
      xAxis: {
        type: 'value' as const,
        axisLabel: { formatter: '{value}K', color: 'var(--text)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category' as const,
        data: MOCK_SALARY.map((s) => s.position),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar' as const,
          data: MOCK_SALARY.map((s) => [s.min, s.max]),
          barWidth: 12,
          itemStyle: {
            color: {
              type: 'linear' as const,
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

  const trendOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 24 },
      xAxis: {
        type: 'category' as const,
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      yAxis: {
        type: 'value' as const,
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' as const } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'line' as const,
          data: MOCK_TREND,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
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

  const topSkillsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: (params: TooltipParam[]) => {
          const item = params[0]
          return `${item.name}<br/>需求度: ${item.value}`
        },
      },
      grid: { left: 100, right: 40, top: 10, bottom: 24 },
      xAxis: {
        type: 'value' as const,
        max: 100,
        axisLabel: { color: 'var(--text)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category' as const,
        data: MOCK_TOP_SKILLS.map((s) => s.name).reverse(),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar' as const,
          data: MOCK_TOP_SKILLS.map((s) => s.count).reverse(),
          barWidth: 14,
          itemStyle: {
            color: {
              type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#52c41a' },
                { offset: 1, color: '#85d65a' },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
          label: {
            show: true,
            position: 'right' as const,
            formatter: '{c}',
            fontSize: 11,
            color: 'var(--text)',
          },
        },
      ],
    }),
    []
  )

  const expPieOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item' as const,
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
          type: 'pie' as const,
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' as const },
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
    <>
      <div className="chart-card large">
        <h3 className="chart-title">薪资范围（K/月）</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 280 }} style={{ height: 280 }} />
        ) : (
          <ReactECharts option={salaryOption} style={{ height: 280 }} />
        )}
      </div>

      <div className="chart-card large">
        <h3 className="chart-title">需求趋势</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 260 }} style={{ height: 260 }} />
        ) : (
          <ReactECharts option={trendOption} style={{ height: 260 }} />
        )}
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Top 10 技能需求排行</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 320 }} style={{ height: 320 }} />
        ) : (
          <ReactECharts option={topSkillsOption} style={{ height: 320 }} />
        )}
      </div>

      <div className="chart-card">
        <h3 className="chart-title">经验年限分布</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 280 }} style={{ height: 280 }} />
        ) : (
          <ReactECharts option={expPieOption} style={{ height: 280 }} />
        )}
      </div>
    </>
  )
}
