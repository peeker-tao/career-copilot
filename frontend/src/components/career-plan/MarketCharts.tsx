import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Loading } from '@/components/common'
import { MOCK_SALARY, MOCK_TREND, MOCK_TOP_SKILLS, MOCK_EXPERIENCE } from '@/mock'
import type { MarketInsight } from '@/types/career'

// echarts tooltip formatter 参数类型
interface TooltipParam {
  name: string
  value?: number | [number, number]
  data?: number | [number, number]
  seriesName?: string
}

export interface MarketChartsProps {
  loading: boolean
  data?: MarketInsight | null
}

export default function MarketCharts({ loading, data }: MarketChartsProps) {
  // data sources: props.data > mock fallback
  const salary = data?.salary || MOCK_SALARY
  const trend = data?.trend || MOCK_TREND
  const topSkills = data?.topSkills || MOCK_TOP_SKILLS
  const expDistribution = data?.experienceDistribution || MOCK_EXPERIENCE

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
        data: salary.map((s) => s.position),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar' as const,
          data: salary.map((s) => [s.min, s.max]),
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
    [salary]
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
          data: trend,
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
    [trend]
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
        data: [...topSkills].map((s) => s.name).reverse(),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar' as const,
          data: [...topSkills].map((s) => s.count).reverse(),
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
    [topSkills]
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
          data: expDistribution.map((item) => ({
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
    [expDistribution]
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
