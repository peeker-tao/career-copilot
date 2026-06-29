import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Loading } from '@/components/common'
import type { MarketInsight } from '@/types/career'

/** 根据数据长度和当前日期生成月份标签 */
function trendLabels(count: number): string[] {
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1 // 1-12
  const labels: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    let m = curMonth - i
    let y = curYear
    if (m <= 0) { m += 12; y -= 1 }
    labels.push(`${y}/${String(m).padStart(2, '0')}`)
  }
  return labels
}

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
  // data sources
  const salary = useMemo(() => data?.salary || [], [data?.salary])
  const trend = useMemo(() => data?.trend || [], [data?.trend])
  const topSkills = useMemo(() => data?.topSkills || [], [data?.topSkills])
  const expDistribution = useMemo(() => data?.experienceDistribution || [], [data?.experienceDistribution])

  const salaryOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: (params: TooltipParam[]) => {
          const idx = params[0]?.dataIndex ?? -1
          const s = salary[idx]
          return s ? `${s.position}<br/>薪资范围: ${s.min}K - ${s.max}K` : ''
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
          // 底层占位条（从 0 到 min），透明
          type: 'bar' as const,
          stack: 'salary',
          data: salary.map((s) => s.min),
          barWidth: 14,
          itemStyle: { color: 'transparent' },
          emphasis: { itemStyle: { color: 'transparent' } },
          label: {
            show: true,
            position: 'right' as const,
            formatter: (p: TooltipParam) => `${salary[p.dataIndex as number]?.min}K - ${salary[p.dataIndex as number]?.max}K`,
            fontSize: 11,
            color: 'var(--text)',
          },
        },
        {
          // 上层着色条（从 min 到 max），堆叠在占位条之上
          type: 'bar' as const,
          stack: 'salary',
          data: salary.map((s) => s.max - s.min),
          barWidth: 14,
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
      grid: { left: 50, right: 20, top: 20, bottom: 28 },
      xAxis: {
        type: 'category' as const,
        data: trendLabels(trend.length),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisLabel: { color: 'var(--text)', fontSize: 11, rotate: trend.length > 8 ? 30 : 0 },
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
      {/* 薪资范围：仅一条时用数字卡片展示，多条时才用图表对比 */}
      {salary.length <= 1 ? (
        <div className="salary-card full">
          <h3 className="chart-title">薪资范围（K/月）</h3>
          {loading ? (
            <Loading skeleton={{ rows: 1, itemHeight: 80 }} style={{ height: 80 }} />
          ) : (
            <div className="salary-display">
              <span className="salary-value">{salary[0]?.min ?? '-'}</span>
              <span className="salary-separator">—</span>
              <span className="salary-value">{salary[0]?.max ?? '-'}</span>
              <span className="salary-unit">K / 月</span>
            </div>
          )}
        </div>
      ) : (
        <div className="chart-card full">
          <h3 className="chart-title">薪资范围（K/月）</h3>
          {loading ? (
            <Loading skeleton={{ rows: 1, itemHeight: 280 }} style={{ height: 280 }} />
          ) : (
            <ReactECharts option={salaryOption} style={{ height: 280, flex: 1 }} />
          )}
        </div>
      )}

      <div className="chart-card full">
        <h3 className="chart-title">Top 10 技能需求排行</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 320 }} style={{ height: 320 }} />
        ) : (
          <ReactECharts option={topSkillsOption} style={{ height: 340 }} />
        )}
      </div>

      <div className="chart-card half">
        <h3 className="chart-title">需求趋势</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 240 }} style={{ height: 240 }} />
        ) : (
          <ReactECharts option={trendOption} style={{ height: 240 }} />
        )}
      </div>

      <div className="chart-card half">
        <h3 className="chart-title">经验年限分布</h3>
        {loading ? (
          <Loading skeleton={{ rows: 1, itemHeight: 240 }} style={{ height: 240 }} />
        ) : (
          <ReactECharts option={expPieOption} style={{ height: 240 }} />
        )}
      </div>
    </>
  )
}
