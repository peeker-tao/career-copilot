import { useState, useEffect, useCallback } from 'react'
import {
  AimOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  BarChartOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import type { JobRecommendation, JobMatch, JobMatchStatus, MatchAnalysis, JobMatchStats } from '@/types/job-matching'
import * as jobMatchingApi from '@/api/job-matching'
import { toast } from '@/store/useToastStore'
import { useResumeStore } from '@/store/useResumeStore'
import { toast } from '@/store/useToastStore'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './JobMatching.css'

const STATUS_LABELS: Record<JobMatchStatus, string> = {
  pending: '待处理',
  saved: '已收藏',
  applied: '已投递',
  archived: '已归档',
}

const POSITION_OPTIONS = ['后端开发工程师', '前端开发工程师', '算法工程师', '数据分析师', '全栈工程师', '测试工程师']

export default function JobMatchingPage() {
  // 标签页
  const [tab, setTab] = useState<'recommend' | 'analyze' | 'saved' | 'stats'>('recommend')

  // 智能推荐
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 匹配分析
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [analysisPosition, setAnalysisPosition] = useState('')
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // 已保存岗位（分页）
  const [savedMatches, setSavedMatches] = useState<JobMatch[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedPage, setSavedPage] = useState(1)
  const [savedTotal, setSavedTotal] = useState(0)
  const savedPageSize = 10

  // 统计
  const [stats, setStats] = useState<JobMatchStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // 收藏操作中的推荐项 ID
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  // 种子数据导入
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: number; total: number } | null>(null)

  // 简历列表
  const resumes = useResumeStore((s) => s.resumes)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  // ----- 数据加载 -----

  const loadRecommendations = useCallback(async () => {
    setRecLoading(true)
    try {
      const res = await jobMatchingApi.getRecommendations(10)
      setRecommendations(Array.isArray(res.data) ? res.data : [])
    } catch {
      setRecommendations([])
    } finally {
      setRecLoading(false)
    }
  }, [])

  const loadSavedMatches = useCallback(async (page: number) => {
    setSavedLoading(true)
    try {
      const res = await jobMatchingApi.getMatches({ page, limit: savedPageSize })
      const data = res.data ?? {}
      setSavedMatches(Array.isArray(data.list) ? data.list : [])
      setSavedTotal(data.total ?? 0)
    } catch {
      setSavedMatches([])
      setSavedTotal(0)
    } finally {
      setSavedLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await jobMatchingApi.getStats()
      setStats(res.data)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecommendations()
    loadSavedMatches(savedPage)
  }, [loadRecommendations, loadSavedMatches, savedPage])

  // 切换标签时加载对应数据
  useEffect(() => {
    if (tab === 'stats') loadStats()
  }, [tab, loadStats])

  // ----- 操作处理 -----

  const handleAnalyze = async () => {
    if (!selectedResumeId || !analysisPosition.trim()) return
    setAnalysisLoading(true)
    try {
      const res = await jobMatchingApi.analyzeMatch(selectedResumeId, analysisPosition.trim())
      setAnalysis(res.data)
    } catch {
      // 静默失败
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleSaveRecommendation = async (id: string) => {
    try {
      await jobMatchingApi.updateMatchStatus(id, 'saved')
      toast.success('已收藏该岗位')
      setExpandedId(null)
      loadSavedMatches()
    } catch {
      toast.error('收藏失败，请重试')
    }
  }

  const handleStatusChange = async (id: string, status: JobMatchStatus) => {
    try {
      await jobMatchingApi.updateMatchStatus(id, status)
      await loadSavedMatches(savedPage)
      toast.success(`状态已更新为「${STATUS_LABELS[status]}」`)
    } catch {
      toast.error('状态更新失败，请重试')
    }
  }

  const handleSeedData = async () => {
    if (seeding) return
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await jobMatchingApi.seedDefault()
      const result = res.data
      setSeedResult({ success: result.success, total: result.total })
      // 重新加载数据
      await Promise.all([loadRecommendations(), loadSavedMatches(1), loadStats()])
    } catch {
      setSeedResult({ success: -1, total: 0 })
    } finally {
      setSeeding(false)
    }
  }

  const handleSavedPageChange = (page: number) => {
    setSavedPage(page)
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  const formatScore = (score: number) => Math.round(score)

  const savedTotalPages = Math.max(1, Math.ceil(savedTotal / savedPageSize))

  // ----- 推荐卡片操作 -----
  const handleSaveRecommendation = async (item: JobRecommendation) => {
    if (savingIds.has(item.id)) return
    setSavingIds((prev) => new Set(prev).add(item.id))
    try {
      await jobMatchingApi.updateMatchStatus(item.id, 'saved')
      setRecommendations((prev) => prev.filter((r) => r.id !== item.id))
      await loadSavedMatches(1)
      toast.success(`✅ 已收藏「${item.position}」`)
    } catch {
      toast.error('收藏失败，请重试')
    } finally {
      setSavingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next })
    }
  }

  return (
    <div className="job-match-page">
      <h1 className="page-title">岗位匹配</h1>
      <p className="page-desc">AI 驱动的岗位推荐与匹配度分析</p>

      {/* 标签切换 */}
      <div className="jm-tabs">
        <button
          className={`jm-tab ${tab === 'recommend' ? 'active' : ''}`}
          onClick={() => setTab('recommend')}
        >
          <ThunderboltOutlined /> 智能推荐
        </button>
        <button
          className={`jm-tab ${tab === 'analyze' ? 'active' : ''}`}
          onClick={() => setTab('analyze')}
        >
          <SearchOutlined /> 匹配分析
        </button>
        <button
          className={`jm-tab ${tab === 'saved' ? 'active' : ''}`}
          onClick={() => setTab('saved')}
        >
          <StarOutlined /> 已保存 ({savedTotal})
        </button>
        <button
          className={`jm-tab ${tab === 'stats' ? 'active' : ''}`}
          onClick={() => setTab('stats')}
        >
          <BarChartOutlined /> 数据概览
        </button>
      </div>

      {/* ========== 智能推荐 ========== */}
      {tab === 'recommend' && (
        <div>
          {recLoading ? (
            <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
          ) : recommendations.length === 0 ? (
            <>
              <EmptyState
                icon={<AimOutlined />}
                title="暂无推荐岗位"
                description="请先上传简历获取 AI 推荐，或导入基准数据来浏览岗位"
              />
              <div style={{ textAlign: 'center', marginTop: -8 }}>
                <button
                  className="jm-btn-primary"
                  onClick={handleSeedData}
                  disabled={seeding}
                >
                  <DownloadOutlined />
                  {seeding ? '导入中...' : '导入 Kaggle 基准数据（约 10,000 条）'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 数据操作栏 */}
              <div className="jm-toolbar">
                <span className="jm-toolbar-info">
                  共 {recommendations.length} 个推荐岗位
                </span>
                <div className="jm-toolbar-actions">
                  {stats && stats.total < 100 && (
                    <button
                      className="jm-btn-secondary"
                      onClick={handleSeedData}
                      disabled={seeding}
                    >
                      <DownloadOutlined />
                      {seeding ? '导入中...' : '导入更多数据'}
                    </button>
                  )}
                  <button
                    className="jm-btn-secondary"
                    onClick={loadRecommendations}
                  >
                    <ReloadOutlined /> 刷新
                  </button>
                </div>
              </div>
              {/* 推荐卡片网格 */}
              <div className="jm-recommend-grid">
                {recommendations.map((item) => (
                  <div key={item.id} className="jm-rec-card">
                    <div className="jm-rec-top">
                      <div>
                        <h3 className="jm-rec-position">{item.position}</h3>
                        <p className="jm-rec-company">
                          {item.company}
                          {item.location && (
                            <span className="jm-rec-company-location">
                              <EnvironmentOutlined style={{ marginRight: 2 }} />{item.location}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className={`jm-rec-score ${getScoreClass(item.matchScore)}`}>
                        {formatScore(item.matchScore)}
                      </div>
                    </div>
                    {item.reason && <p className="jm-rec-reason">{item.reason}</p>}
                    {item.skills && item.skills.length > 0 && (
                      <div className="jm-rec-skills">
                        {item.skills.slice(0, 6).map((s) => (
                          <span key={s} className="jm-skill-tag">{s}</span>
                        ))}
                        {item.skills.length > 6 && (
                          <span className="jm-skill-tag more">+{item.skills.length - 6}</span>
                        )}
                      </div>
                    )}
                    <div className="jm-rec-actions">
                      <button
                        className="jm-rec-save-btn"
                        disabled={savingIds.has(item.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveRecommendation(item)
                        }}
                      >
                        {savingIds.has(item.id) ? (
                          <>保存中…</>
                        ) : (
                          <><StarOutlined /> 收藏</>
                        )}
                      </button>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jm-rec-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkOutlined /> 投递
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========== 匹配分析 ========== */}
      {tab === 'analyze' && (
        <div>
          <div className="jm-section">
            <div className="jm-analyze-form">
              <div className="jm-form-field">
                <label className="jm-form-label">选择简历</label>
                <select
                  className="jm-form-select"
                  title="选择要分析的简历"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  <option value="">选择要分析的简历...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div className="jm-form-field">
                <label className="jm-form-label">目标岗位</label>
                <input
                  className="jm-form-input"
                  placeholder="输入目标岗位名称"
                  value={analysisPosition}
                  onChange={(e) => setAnalysisPosition(e.target.value)}
                  list="position-options"
                />
                <datalist id="position-options">
                  {POSITION_OPTIONS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <button
                className="jm-btn-primary"
                disabled={!selectedResumeId || !analysisPosition.trim() || analysisLoading}
                onClick={handleAnalyze}
              >
                <SearchOutlined />
                {analysisLoading ? '分析中...' : '分析匹配度'}
              </button>
            </div>
          </div>

          {analysisLoading && (
            <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
          )}

          {analysis && !analysisLoading && (
            <div className="jm-result">
              <div className="jm-result-overall">
                <div className={`jm-result-score-circle ${getScoreClass(analysis.overallScore)}`}>
                  {formatScore(analysis.overallScore)}
                </div>
                <div>
                  <div className="jm-result-score-text">
                    综合匹配度
                  </div>
                  <div className="jm-result-score-label">满分100分</div>
                </div>
              </div>

              <div className="jm-dimensions">
                {analysis.skillMatch && (
                  <div>
                    <div className="jm-dim-row">
                      <span className="jm-dim-label">技能匹配</span>
                      <div className="jm-dim-bar">
                        <div
                          className={`jm-dim-fill ${getScoreClass(analysis.skillMatch.score)}`}
                          style={{ width: `${analysis.skillMatch.score}%` }}
                        />
                      </div>
                      <span className="jm-dim-score">{analysis.skillMatch.score}%</span>
                    </div>
                    <div className="jm-dim-skill-tags">
                      {analysis.skillMatch.matched?.map((s: string) => (
                        <span key={s} className="jm-skill-tag matched">
                          {s}
                        </span>
                      ))}
                      {analysis.skillMatch.missing?.map((s: string) => (
                        <span key={s} className="jm-skill-tag missing">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.experienceMatch && (
                  <div>
                    <div className="jm-dim-row">
                      <span className="jm-dim-label">经验匹配</span>
                      <div className="jm-dim-bar">
                        <div
                          className={`jm-dim-fill ${getScoreClass(analysis.experienceMatch.score)}`}
                          style={{ width: `${analysis.experienceMatch.score}%` }}
                        />
                      </div>
                      <span className="jm-dim-score">{analysis.experienceMatch.score}%</span>
                    </div>
                    <div className="jm-dim-exp-detail">
                      要求 {analysis.experienceMatch.requiredYears} 年，实际 {analysis.experienceMatch.actualYears} 年
                    </div>
                  </div>
                )}
              </div>

              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="jm-suggestions">
                  <div className="jm-suggestions-label">
                    <StarOutlined style={{ marginRight: 4 }} />改进建议
                  </div>
                  {analysis.suggestions.map((s: string, i: number) => (
                    <div key={i} className="jm-suggestion">{s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== 已保存岗位（分页） ========== */}
      {tab === 'saved' && (
        <div>
          {savedLoading ? (
            <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
          ) : savedMatches.length === 0 ? (
            <EmptyState
              icon={<StarOutlined />}
              title="暂无保存的岗位"
              description="前往智能推荐浏览并收藏感兴趣的岗位"
            />
          ) : (
            <div className="jm-saved-list">
              {savedMatches.map((item) => (
                <div key={item.id} className="jm-saved-item">
                  <div className="jm-saved-info">
                    <div className="jm-saved-position">
                      <h4>{item.position}</h4>
                      <span className="jm-saved-company">{item.company}</span>
                    </div>
                    <div className="jm-saved-meta">
                      {item.location && (
                        <span className="jm-saved-meta-tag">
                          <EnvironmentOutlined /> {item.location}
                        </span>
                      )}
                      {item.salaryRange && (
                        <span className="jm-saved-meta-tag salary">{item.salaryRange}</span>
                      )}
                    </div>
                    {(item.requirements ?? []).length > 0 && (
                      <div className="jm-saved-skills">
                        {(item.requirements ?? []).slice(0, 3).map((r, i) => (
                          <span key={i} className="jm-skill-tag">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="jm-saved-actions">
                    <div className={`jm-saved-score ${getScoreClass(item.matchScore)}`}>
                      {formatScore(item.matchScore)}
                    </div>
                    <select
                      className="jm-saved-select"
                      title="修改投递状态"
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as JobMatchStatus)}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {savedTotal > savedPageSize && (
            <div className="jm-pagination">
              <button
                className="jm-pagination-btn"
                disabled={savedPage <= 1 || savedLoading}
                onClick={() => handleSavedPageChange(savedPage - 1)}
              >
                上一页
              </button>
              <span className="jm-pagination-info">
                第 {savedPage} / {savedTotalPages} 页（共 {savedTotal} 条）
              </span>
              <button
                className="jm-pagination-btn"
                disabled={savedPage >= savedTotalPages || savedLoading}
                onClick={() => handleSavedPageChange(savedPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== 数据概览 ========== */}
      {tab === 'stats' && (
        <div>
          {statsLoading ? (
            <Loading skeleton={{ rows: 8 }} className="pad-24-0" />
          ) : !stats ? (
            <div className="jm-section" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <DatabaseOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-h)' }}>暂无统计数据</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                数据库中没有岗位匹配数据，请先导入基准数据
              </p>
              <button
                className="jm-btn-primary"
                onClick={handleSeedData}
                disabled={seeding}
              >
                <DownloadOutlined />
                {seeding ? '导入中...' : '一键导入 Kaggle 基准数据'}
              </button>
            </div>
          ) : (
            <>
              {/* 概览卡片 */}
              <div className="jm-stats-grid">
                <div className="jm-stat-card">
                  <div className="jm-stat-icon total"><DatabaseOutlined /></div>
                  <div className="jm-stat-body">
                    <div className="jm-stat-value">{stats.total.toLocaleString()}</div>
                    <div className="jm-stat-label">总岗位数</div>
                  </div>
                </div>
                <div className="jm-stat-card">
                  <div className="jm-stat-icon score"><BarChartOutlined /></div>
                  <div className="jm-stat-body">
                    <div className="jm-stat-value">{stats.scoreStats.average}</div>
                    <div className="jm-stat-label">平均匹配分</div>
                  </div>
                </div>
                <div className="jm-stat-card">
                  <div className="jm-stat-icon max-score"><ThunderboltOutlined /></div>
                  <div className="jm-stat-body">
                    <div className="jm-stat-value">{stats.scoreStats.max}</div>
                    <div className="jm-stat-label">最高匹配分</div>
                  </div>
                </div>
                <div className="jm-stat-card">
                  <div className="jm-stat-icon company"><TeamOutlined /></div>
                  <div className="jm-stat-body">
                    <div className="jm-stat-value">{stats.topCompanies.length}</div>
                    <div className="jm-stat-label">热门公司</div>
                  </div>
                </div>
              </div>

              {/* 状态分布 */}
              <div className="jm-section" style={{ marginTop: 20 }}>
                <h3 className="jm-section-title"><CheckCircleOutlined /> 状态分布</h3>
                <div className="jm-stat-bars">
                  {Object.entries(stats.statusDistribution).map(([key, count]) => (
                    <div key={key} className="jm-stat-bar-row">
                      <span className="jm-stat-bar-label">{STATUS_LABELS[key as JobMatchStatus] || key}</span>
                      <div className="jm-stat-bar-track">
                        <div
                          className={`jm-stat-bar-fill ${getScoreClass(
                            stats.total > 0 ? (count / stats.total) * 100 : 0
                          )}`}
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="jm-stat-bar-count">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 来源分布 */}
              <div className="jm-section" style={{ marginTop: 12 }}>
                <h3 className="jm-section-title"><DatabaseOutlined /> 来源分布</h3>
                <div className="jm-stat-bars">
                  {Object.entries(stats.sourceDistribution).map(([key, count]) => (
                    <div key={key} className="jm-stat-bar-row">
                      <span className="jm-stat-bar-label">{key === 'external' ? '外部导入' : key === 'ai_recommended' ? 'AI 推荐' : key}</span>
                      <div className="jm-stat-bar-track">
                        <div
                          className="jm-stat-bar-fill high"
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="jm-stat-bar-count">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 热门岗位 Top 10 */}
              <div className="jm-stats-two-col" style={{ marginTop: 12 }}>
                <div className="jm-section">
                  <h3 className="jm-section-title"><AimOutlined /> 热门岗位 Top 10</h3>
                  <table className="jm-stats-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>岗位名称</th>
                        <th>数量</th>
                        <th>平均分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPositions.map((p, i) => (
                        <tr key={p.position}>
                          <td>{i + 1}</td>
                          <td>{p.position}</td>
                          <td>{p.count}</td>
                          <td><span className={`jm-stat-badge ${getScoreClass(p.avgMatchScore)}`}>{p.avgMatchScore}</span></td>
                        </tr>
                      ))}
                      {stats.topPositions.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="jm-section">
                  <h3 className="jm-section-title"><TeamOutlined /> 热门公司 Top 10</h3>
                  <table className="jm-stats-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>公司名称</th>
                        <th>数量</th>
                        <th>平均分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topCompanies.map((c, i) => (
                        <tr key={c.company || i}>
                          <td>{i + 1}</td>
                          <td>{c.company || '未知'}</td>
                          <td>{c.count}</td>
                          <td><span className={`jm-stat-badge ${getScoreClass(c.avgMatchScore)}`}>{c.avgMatchScore}</span></td>
                        </tr>
                      ))}
                      {stats.topCompanies.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 种子导入结果提示 */}
              {seedResult && (
                <div className={`jm-seed-toast ${seedResult.success > 0 ? 'success' : 'error'}`}>
                  {seedResult.success > 0 ? (
                    <>✅ 成功导入 {seedResult.success.toLocaleString()} 条岗位数据</>
                  ) : (
                    <>❌ 导入失败，请检查数据集文件是否存在</>
                  )}
                  <button className="jm-seed-toast-close" onClick={() => setSeedResult(null)}>✕</button>
                </div>
              )}

              {/* 导入按钮 */}
              <div className="jm-section" style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  className="jm-btn-primary"
                  onClick={handleSeedData}
                  disabled={seeding}
                  style={{ marginRight: 12 }}
                >
                  <DownloadOutlined />
                  {seeding ? '导入中...' : '重新导入基准数据'}
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  从 Kaggle 简历数据集导入约 10,000 条岗位数据
                </span>
              </div>

              {/* 导入进度 */}
              {seeding && (
                <div className="jm-seeding-indicator">
                  <ReloadOutlined spin /> 正在导入基准数据，请稍候...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
