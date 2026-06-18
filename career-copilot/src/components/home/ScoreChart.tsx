import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

export interface ScoreChartProps {
  data: number[]
  loading: boolean
}

const ScoreChart: React.FC<ScoreChartProps> = ({ data, loading }) => {
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        textStyle: { color: 'var(--text-h)', fontSize: 12 },
        formatter: '第 {b} 次面试<br/>评分: <strong>{c} 分</strong>',
      },
      grid: {
        left: 44,
        right: 18,
        top: 32,
        bottom: 36,
      },
      xAxis: {
        type: 'category' as const,
        name: '面试（次）',
        nameLocation: 'center' as const,
        nameGap: 24,
        nameTextStyle: { color: 'var(--text)', fontSize: 11, fontWeight: 500 },
        data: data.map((_, i: number) => `${i + 1}`),
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisTick: { show: false },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      yAxis: {
        type: 'value' as const,
        name: '评分（分）',
        nameLocation: 'end' as const,
        nameGap: 18,
        nameRotate: 0,
        nameTextStyle: { color: 'var(--text)', fontSize: 11, fontWeight: 500, padding: [0, 0, 4, 0] },
        min: 0,
        max: 100,
        splitLine: {
          lineStyle: { color: 'var(--border)', type: 'dashed' as const },
        },
        axisLabel: { color: 'var(--text)', fontSize: 11 },
      },
      series: [
        {
          type: 'line' as const,
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
            symbol: 'none',
            data: [
              {
                yAxis: 60,
                label: {
                  formatter: '及格线',
                  color: '#ff4d4f',
                  fontSize: 12,
                  position: 'insideEndTop' as const,
                  distance: [4, -4],
                },
                lineStyle: {
                  color: '#ff4d4f',
                  type: 'dashed' as const,
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
      <div className="chart-wrapper loading-skeleton p-0">
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

export default ScoreChart
