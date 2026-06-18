import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

export interface SkillRadarProps {
  skills?: Array<{ name: string; score: number }>
}

const SkillRadar = ({ skills }: SkillRadarProps) => {
  const option = useMemo(() => {
    if (!skills || skills.length === 0) return null
    return {
      radar: {
        indicator: skills.map((s) => ({ name: s.name, max: 100 })),
        center: ['50%', '50%'],
        radius: '70%',
        axisName: {
          color: 'var(--text)',
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(24, 144, 255, 0.02)', 'rgba(24, 144, 255, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: { color: 'var(--border)' },
        },
        splitLine: {
          lineStyle: { color: 'var(--border)' },
        },
      },
      series: [
        {
          type: 'radar',
          data: [{ value: skills.map((s) => s.score), name: '技能评估' }],
          symbol: 'none',
          lineStyle: { color: '#7c3aed', width: 2 },
          areaStyle: {
            color: 'rgba(124, 58, 237, 0.15)',
          },
        },
      ],
    }
  }, [skills])

  if (!option) {
    return <div className="resume-empty pad-40">暂无技能数据</div>
  }

  return (
    <ReactECharts
      option={option}
      className="chart-full"
    />
  )
}

export default SkillRadar
