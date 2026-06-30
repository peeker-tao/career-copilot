import { useState, useEffect, useCallback } from 'react'
import {
  AimOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import type { JobRecommendation, JobMatch, JobMatchStatus, MatchAnalysis } from '@/types/job-matching'
import * as jobMatchingApi from '@/api/job-matching'
import { toast } from '@/store/useToastStore'
import { useResumeStore } from '@/store/useResumeStore'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './JobMatching.css'

const STATUS_LABELS: Record<JobMatchStatus, string> = {
  saved: '已收藏',
  applied: '已投递',
  interviewing: '面试中',
  offered: '已录用',
  rejected: '未通过',
}

const POSITION_OPTIONS = ['后端开发工程师', '前端开发工程师', '算法工程师', '数据分析师']

export default function JobMatchingPage() {
  // 标签页
  const [tab, setTab] = useState<'recommend' | 'analyze' | 'saved' | 'import'>('recommend')

  // 智能推荐
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [recLoading, setRecLoading] = useState(false)

  // 匹配分析
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [analysisPosition, setAnalysisPosition] = useState('')
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const [seedLoading, setSeedLoading] = useState(false)

  // 已保存岗位
  const [savedMatches, setSavedMatches] = useState<JobMatch[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

  // 简历列表
  const resumes = useResumeStore((s) => s.resumes)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  const loadRecommendations = useCallback(async () => {
    setRecLoading(true)
    try {
      const res = await jobMatchingApi.getRecommendations(10)
      setRecommendations(res.data ?? [])
    } catch {
      setRecommendations([])
    } finally {
      setRecLoading(false)
    }
  }, [])

  const loadSavedMatches = useCallback(async () => {
    setSavedLoading(true)
    try {
      const res = await jobMatchingApi.getMatches({ page: 1, limit: 50 })
      setSavedMatches(res.data?.list ?? res.data ?? [])
    } catch {
      setSavedMatches([])
    } finally {
      setSavedLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecommendations()
    loadSavedMatches()
  }, [loadRecommendations, loadSavedMatches])

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
      loadSavedMatches()
    } catch {}
  }

  const handleStatusChange = async (id: string, status: JobMatchStatus) => {
    try {
      await jobMatchingApi.updateMatchStatus(id, status)
      loadSavedMatches()
    } catch {
      // 静默失败
    }
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  const formatScore = (score: number) => Math.round(score)

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
            <StarOutlined /> 已保存 ({savedMatches.length})
          </button>
          </div>

      {/* 智能推荐 */}
      {tab === 'recommend' && (
        <div>
          {recLoading ? (
            <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
          ) : recommendations.length === 0 ? (
            <div>
            <EmptyState
              icon={<AimOutlined />}
              title="暂无推荐岗位"
              description="请先上传简历，或一键导入 Kaggle 基准数据"
              actionText="前往简历管理"
              onAction={() => window.location.href = '/resume'}
            />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="jm-btn-primary" disabled={seedLoading} onClick={async () => {
                setSeedLoading(true)
                try {
                  const res = await jobMatchingApi.seedDefaultJobMatches()
                  toast.success(`导入成功: ${res.data?.success || 0} 条`)
                  loadRecommendations()
                  loadSavedMatches()
                } catch {
                  toast.error('导入失败，请检查后端 CSV 文件是否存在')
                } finally { setSeedLoading(false) }
              }}>
                <DatabaseOutlined /> {seedLoading ? '导入中...' : '一键导入 Kaggle 基准数据'}
              </button>
            </div>
          </div>
          ) : (
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
                      {item.skills.map((s) => (
                        <span key={s} className="jm-skill-tag">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="jm-rec-actions">
                    <button className="jm-btn-save" onClick={() => handleSaveRecommendation(item.id)}>
                      <StarOutlined /> 保存
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 匹配分析 */}
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

      {/* 已保存岗位 */}
      {tab === 'saved' && (
        <div>
          {savedLoading ? (
            <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
          ) : savedMatches.length === 0 ? (
            <EmptyState
              icon={<StarOutlined />}
              title="暂无保存的岗位"
              description="前往智能推荐浏览匹配岗位"
            />
          ) : (
            <div className="jm-saved-list">
              {savedMatches.map((item) => (
                <div key={item.id} className="jm-saved-item">
                  <div className="jm-saved-position">
                    <h4>{item.position}</h4>
                    <span>{item.company}</span>
                  </div>
                  <div className="jm-saved-actions">
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
                    <span className="jm-saved-score">{item.matchScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
