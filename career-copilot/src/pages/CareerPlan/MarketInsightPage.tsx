import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { MarketCharts } from '../../components/career-plan'
import './MarketInsight.css'
import './CareerPlanDetail.css'

const MarketInsightPage = () => {
  const [position, setPosition] = useState('后端开发工程师')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
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
        <MarketCharts loading={loading} />
      </div>
    </div>
  )
}

export default MarketInsightPage
