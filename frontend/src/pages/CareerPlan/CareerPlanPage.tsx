import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RightOutlined, ArrowLeftOutlined, SearchOutlined, ThunderboltOutlined, StarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import { PlanCard, GeneratePlanForm } from '../../components/career-plan'
import { getCareerPlans, deleteCareerPlan } from '@/api/career'
import * as jobMatchingApi from '@/api/job-matching'
import type { JobRecommendation } from '@/types/job-matching'
import { toast } from '@/store/useToastStore'
import './CareerPlan.css'

const PAGE_SIZE = 5

const CareerPlanPage = () => {
  const [plans, setPlans] = useState<Array<{ id: string; targetPosition: string; progress: number; createdAt: string; skills?: string[] }>>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; targetPosition: string; progress: number; createdAt: string; skills?: string[] } | null>(null)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')

  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setTimeout(async () => {
      if (mounted) {
        try {
          const response = await getCareerPlans()
          if (response.code !== 200 && response.code !== 201) {
            throw new Error(response.message || 'Failed to fetch career plans')
          }
          setPlans(response.data)
        } catch (error) {
          toast.error('获取职业规划列表失败: ' + (error as Error).message)
        } finally {
          setLoading(false)
        }
      }
    }, 400)
    return () => { mounted = false }
  }, [])

  const loadRecommendations = useCallback(async () => {
    setRecLoading(true)
    try {
      const res = await jobMatchingApi.getRecommendations(20)
      setRecommendations(res.data ?? [])
    } catch { setRecommendations([]) }
    finally { setRecLoading(false) }
  }, [])

  useEffect(() => { loadRecommendations() }, [loadRecommendations])

  const handleSaveRecommendation = async (id: string) => {
    try {
      await jobMatchingApi.updateMatchStatus(id, 'saved')
      toast.success('已收藏')
    } catch { toast.error('收藏失败') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCareerPlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      toast.error('删除规划失败: ' + (err as Error).message)
    }
    setDeleteTarget(null)
  }

  // 搜索过滤
  const filteredPlans = useMemo(() => {
    if (!keyword.trim()) return plans
    const kw = keyword.toLowerCase()
    return plans.filter((p) => p.targetPosition.toLowerCase().includes(kw))
  }, [plans, keyword])

  // 分页
  const totalPages = Math.ceil(filteredPlans.length / PAGE_SIZE)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const pagedPlans = filteredPlans.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  const handleGenerated = () => {
    setLoading(true)
    setTimeout(async () => {
      try {
        const response = await getCareerPlans()
        if (response.code !== 200 && response.code !== 201) {
          throw new Error(response.message || 'Failed to generate career plan')
        }
        const newPlan = response.data
        setPlans(newPlan)
      } catch (error) {
        toast.error('获取职业规划列表失败: ' + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="career-plan-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">职业规划</h1>
          <p className="page-desc">制定专属学习路线，稳步迈向目标岗位</p>
        </div>
        <Link to="/career-plan/market-insight" className="market-link">
          市场洞察 <RightOutlined className="fs-12" />
        </Link>
      </div>

      <div className="page-layout">
        <div className="plans-column">
          <h2 className="section-title">
            我的规划
            <span className="plans-count">{filteredPlans.length}</span>
          </h2>

          {plans.length > 0 && (
            <div className="search-bar">
              <SearchOutlined className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="搜索目标岗位..."
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          )}

          {loading ? (
            <Loading skeleton />
          ) : plans.length === 0 ? (
            <EmptyState
              title="还没有职业规划"
              description="去右侧生成你的第一个职业规划吧！"
            />
          ) : filteredPlans.length === 0 ? (
            <EmptyState
              icon={<SearchOutlined />}
              title="未找到匹配的规划"
              description="试试其他关键词"
            />
          ) : (
            <>
              <div className="plans-list">
                {pagedPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onDeleteRequest={(p) => setDeleteTarget(p)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="history-pagination">
                  <button
                    className="pagination-btn"
                    disabled={safePage <= 1}
                    onClick={() => handlePageChange(safePage - 1)}
                  >
                    <ArrowLeftOutlined /> 上一页
                  </button>
                  <span className="pagination-info">
                    第 {safePage} / {totalPages} 页
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={safePage >= totalPages}
                    onClick={() => handlePageChange(safePage + 1)}
                  >
                    下一页 <RightOutlined />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="generate-column">
          <GeneratePlanForm onGenerated={handleGenerated} />
        </div>
      </div>

      {recLoading ? (
        <div style={{ marginTop: 28, textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>加载推荐岗位中...</div>
      ) : recommendations.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            <ThunderboltOutlined style={{ marginRight: 6 }} />为你推荐岗位
          </h2>
          <div className="jm-recommend-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {recommendations.slice(0, 20).map((item) => (
              <div key={item.id} className="jm-rec-card" style={{ cursor: 'default' }}>
                <div className="jm-rec-top">
                  <div>
                    <h3 className="jm-rec-position">{item.position}</h3>
                    <p className="jm-rec-company">
                      {item.company}
                      {item.location && <span className="jm-rec-company-location"><EnvironmentOutlined style={{ marginRight: 2 }} />{item.location}</span>}
                    </p>
                  </div>
                  <div className={`jm-rec-score ${item.matchScore >= 80 ? 'high' : item.matchScore >= 60 ? 'medium' : 'low'}`}>
                    {Math.round(item.matchScore)}
                  </div>
                </div>
                {item.reason && <p className="jm-rec-reason">{item.reason}</p>}
                {item.skills?.length > 0 && (
                  <div className="jm-rec-skills" style={{ marginBottom: 10 }}>
                    {item.skills.slice(0, 4).map((s) => <span key={s} className="jm-skill-tag">{s}</span>)}
                  </div>
                )}
                <button className="jm-btn-save" onClick={() => handleSaveRecommendation(item.id)}>
                  <StarOutlined /> 收藏
                </button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Link to="/job-matching" style={{ fontSize: 13, color: 'var(--accent)' }}>查看全部岗位推荐 →</Link>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="确认删除"
        message={deleteTarget ? `确认删除「${deleteTarget.targetPosition}」的职业规划？删除后无法恢复。` : ''}
        type="danger"
        confirmText="删除"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default CareerPlanPage
