import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { MarketCharts } from '../../components/career-plan'
import { getMarketInsight } from '@/api/career'
import { toast } from '@/store/useToastStore'
import type { MarketInsight } from '@/types/career'
import './MarketInsight.css'
import './CareerPlanDetail.css'

const MarketInsightPage = () => {
  const [position, setPosition] = useState('后端开发工程师')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MarketInsight | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Debounce 800ms to avoid too many API calls while typing
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await getMarketInsight(position)
        if (res.code === 200) {
          setData(res.data)
        }
      } catch (err) {
        toast.error('获取市场洞察失败: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }, 800)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [position])

  return (
    <div className="market-page">
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

      <div className="search-bar">
        <SearchOutlined className="text-body" />
        <input
          type="text"
          className="search-input"
          placeholder="搜索目标岗位..."
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
      </div>

      <div className="charts-grid">
        <MarketCharts loading={loading} data={data} />
      </div>
    </div>
  )
}

export default MarketInsightPage
