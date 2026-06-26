import { useMemo, useState, useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsType } from 'echarts'
import { PicLeftOutlined, PicCenterOutlined } from '@ant-design/icons'

export interface SkillRadarProps {
  skills?: Array<{ name: string; score: number }>
}

/** 根据分数返回颜色 */
const scoreColor = (score: number) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#ff4d4f'
}

/** 根据分数返回文字等级 */
const scoreLevel = (score: number) => {
  if (score >= 80) return '精通'
  if (score >= 60) return '熟练'
  return '了解'
}

/** 雷达图顶点角度（正上方顺时针，屏幕坐标系 y 向下） */
const getRadarAngles = (n: number) =>
  Array.from({ length: n }, (_, i) => (2 * Math.PI * -i) / n - Math.PI / 2)

const SkillRadar = ({ skills }: SkillRadarProps) => {
  const [detailed, setDetailed] = useState(false)
  const chartRef = useRef<EChartsType | null>(null)

  // 自定义 tooltip 状态
  const [tip, setTip] = useState<{ show: boolean; left: number; top: number; name: string; score: number }>({
    show: false, left: 0, top: 0, name: '', score: 0,
  })

  /** 计算鼠标距各顶点的最近索引 */
  const getNearestIdx = useCallback((mx: number, my: number, vw: number, vh: number) => {
    if (!skills || skills.length === 0) return 0
    const n = skills.length
    const cx = vw * 0.5
    const cy = vh * 0.55
    const r = Math.min(vw, vh) * 0.65 * 0.5
    const angles = getRadarAngles(n)
    let nearest = 0
    let minDist = Infinity
    for (let i = 0; i < n; i++) {
      const ix = cx + r * Math.cos(angles[i])
      const iy = cy + r * Math.sin(angles[i])
      const dx = mx - ix
      const dy = my - iy
      const d = dx * dx + dy * dy
      if (d < minDist) { minDist = d; nearest = i }
    }
    return nearest
  }, [skills])

  const onChartEvents = useMemo(() => ({
    mousemove: (params: any) => {
      if (!skills || skills.length === 0) return
      const chart = chartRef.current
      if (!chart) return
      const vw = chart.getWidth()
      const vh = chart.getHeight()
      const mx = params.event?.offsetX ?? params.offsetX ?? 0
      const my = params.event?.offsetY ?? params.offsetY ?? 0
      const idx = getNearestIdx(mx, my, vw, vh)
      setTip({
        show: true,
        left: mx + 12,
        top: my - 30,
        name: skills[idx].name,
        score: skills[idx].score,
      })
    },
    mouseout: () => {
      setTip((prev) => ({ ...prev, show: false }))
    },
  }), [skills, getNearestIdx])
  const option = useMemo(() => {
    if (!skills || skills.length === 0) return null
    return {
      tooltip: {
        show: false,
      },
      radar: {
        indicator: skills.map((s) => ({
          name: `${s.name}\n${s.score}`,
          max: 100,
        })),
        center: ['50%', '55%'],
        radius: '65%',
        axisName: {
          color: '#555',
          fontSize: 12,
          fontWeight: 400,
          rich: {
            score: { fontSize: 10, color: '#999', padding: [2, 0, 0, 0] },
          },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(24,144,255,.02)', 'rgba(24,144,255,.06)'],
          },
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { lineStyle: { color: '#e0e0e0' } },
        splitNumber: 5,
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: skills.map((s) => s.score),
              name: '技能评估',
              areaStyle: { color: 'rgba(124,58,237,.12)' },
              lineStyle: { color: '#7c3aed', width: 2 },
              itemStyle: { color: '#7c3aed' },
            },
          ],
          symbol: 'circle',
          symbolSize: 6,
          label: {
            show: true,
            formatter: (params: any) => `${params.value}`,
            fontSize: 11,
            fontWeight: 600,
            color: '#7c3aed',
            distance: 8,
          },
          emphasis: {
            lineStyle: { width: 3 },
            areaStyle: { color: 'rgba(124,58,237,.2)' },
          },
        },
      ],
    }
  }, [skills])

  if (!option) {
    return <div className="resume-empty pad-40">暂无技能数据</div>
  }

  return (
    <div className="skill-radar-container">
      <div className="skill-radar-toolbar">
        <span className="skill-radar-label">技能雷达图</span>
        <button
          className={`skill-radar-toggle ${detailed ? 'active' : ''}`}
          onClick={() => setDetailed(!detailed)}
          title={detailed ? '切换为简略图' : '切换为详细图+列表'}
        >
          {detailed ? <PicCenterOutlined /> : <PicLeftOutlined />}
          {detailed ? '简略' : '详细'}
        </button>
      </div>

      <div className="skill-radar-chart-wrap">
        <ReactECharts
          option={option}
          className={detailed ? 'skill-radar-chart' : 'skill-radar-chart-compact'}
          onChartReady={(chart) => { chartRef.current = chart }}
          onEvents={onChartEvents}
        />
        {tip.show && (
          <div className="skill-radar-tooltip" style={{ left: tip.left, top: tip.top }}>
            <b>{tip.name}</b>
            <span className="skill-radar-tooltip-score">
              评分：{tip.score} 分 · {scoreLevel(tip.score)}
            </span>
          </div>
        )}
      </div>

      {detailed && (
        <ul className="skill-score-list">
          {skills!.map((s) => {
            const barColor = scoreColor(s.score)
            return (
              /* eslint-disable-next-line */
              <li
                key={s.name}
                className="skill-score-item"
                style={{
                  '--score-color': barColor,
                  '--score-pct': `${s.score}%`,
                } as React.CSSProperties}
              >
                <span className="skill-score-name">{s.name}</span>
                <span className="skill-score-bar-wrap">
                  <span className="skill-score-bar" />
                </span>
                <span className="skill-score-value">{s.score}</span>
                <span className="skill-score-level">{scoreLevel(s.score)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default SkillRadar
