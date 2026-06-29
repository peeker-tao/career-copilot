import { useState, useEffect, useCallback } from 'react'
import {
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ReadOutlined,
  BulbOutlined,
  StarFilled,
  ThunderboltOutlined,
  SearchOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import type { LearningResource, ResourceCategory, RecommendedResource, ResourceType } from '@/types/learning-resources'
import * as resourcesApi from '@/api/learning-resources'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './LearningResources.css'

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  video: <PlayCircleOutlined style={{ color: '#ff4d4f', fontSize: 26 }} />,
  article: <FileTextOutlined style={{ color: '#1890ff', fontSize: 26 }} />,
  course: <ReadOutlined style={{ color: '#52c41a', fontSize: 26 }} />,
  book: <BookOutlined style={{ color: '#722ed1', fontSize: 26 }} />,
}

const TYPE_LABELS: Record<ResourceType, string> = {
  video: '视频',
  article: '文章',
  course: '课程',
  book: '书籍',
}

export default function LearningResourcesPage() {
  // 列表
  const [resources, setResources] = useState<LearningResource[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12

  // 筛选
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string | undefined>()
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [type, setType] = useState<string | undefined>()

  // AI推荐
  const [recommendations, setRecommendations] = useState<RecommendedResource[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [showSkillGapModal, setShowSkillGapModal] = useState(false)
  const [skillGaps, setSkillGaps] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [targetPosition, setTargetPosition] = useState('')

  // 详情弹窗
  const [detail, setDetail] = useState<LearningResource | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      const res = await resourcesApi.getCategories()
      setCategories(res.data ?? [])
    } catch { setCategories([]) }
  }, [])

  const loadResources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await resourcesApi.getResources({ page, limit: pageSize, keyword, category, difficulty, type })
      setResources(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
      setResources([])
    } finally {
      setLoading(false)
    }
  }, [page, keyword, category, difficulty, type])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const handleLoadRecommendations = async () => {
    if (!targetPosition.trim() || skillGaps.length === 0) return
    setRecLoading(true)
    try {
      const res = await resourcesApi.getRecommendations({
        skillGaps,
        targetPosition: targetPosition.trim(),
        limit: 5,
      })
      setRecommendations(res.data ?? [])
      setShowSkillGapModal(false)
    } catch {
      // 静默失败
    } finally {
      setRecLoading(false)
    }
  }

  const addSkillGap = (val: string) => {
    if (val && !skillGaps.includes(val)) {
      setSkillGaps([...skillGaps, val])
    }
    setSkillInput('')
  }

  const removeSkillGap = (val: string) => {
    setSkillGaps(skillGaps.filter((s) => s !== val))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkillGap(skillInput.trim())
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="resources-page">
      <h1 className="page-title">学习资源</h1>
      <p className="page-desc">个性化学习资源推荐，助力技能提升</p>

      {/* AI 推荐区 */}
      <div className="rs-recommend-section">
        <div className="rs-recommend-header">
          <h3><ThunderboltOutlined /> AI 个性化推荐</h3>
          <button className="rs-btn rs-btn-ghost" onClick={() => setShowSkillGapModal(true)}>
            配置技能缺口
          </button>
        </div>
        {recLoading ? (
          <Loading skeleton={{ rows: 3 }} />
        ) : recommendations.length > 0 ? (
          <div>
            {recommendations.map((item) => (
              <div key={item.id} className="rs-rec-item" onClick={() => setDetail(item)}>
                <div className="rs-rec-score">{item.relevanceScore ?? '—'}</div>
                <div className="rs-rec-info">
                  <h4>{item.title}</h4>
                  <div className="rs-rec-reason">{item.reason}</div>
                </div>
                <span className="rs-rec-type">{TYPE_LABELS[item.type] || item.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rs-empty-rec">
            配置您的技能缺口和目标岗位，获取个性化学习资源推荐
          </p>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="rs-toolbar">
        <div className="rs-search">
          <SearchOutlined className="rs-search-icon" />
          <input
            className="rs-search-input"
            placeholder="搜索资源..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="rs-filter-select"
          value={category ?? ''}
          onChange={(e) => { setCategory(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
          ))}
        </select>
        <select
          className="rs-filter-select"
          value={difficulty ?? ''}
          onChange={(e) => { setDifficulty(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部难度</option>
          <option value="beginner">入门</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
        </select>
        <select
          className="rs-filter-select"
          value={type ?? ''}
          onChange={(e) => { setType(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部类型</option>
          <option value="video">视频</option>
          <option value="article">文章</option>
          <option value="course">课程</option>
          <option value="book">书籍</option>
        </select>
      </div>

      {/* 资源列表 */}
      {loading ? (
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BulbOutlined />}
          title="暂无学习资源"
          description="尝试调整筛选条件或配置技能缺口获取个性化推荐"
        />
      ) : (
        <>
          <div className="rs-grid">
            {resources.map((item) => (
              <div key={item.id} className="rs-card" onClick={() => setDetail(item)}>
                <div className="rs-card-icon">{TYPE_ICONS[item.type] ?? <FileTextOutlined style={{ fontSize: 26 }} />}</div>
                <h3 className="rs-card-title">{item.title}</h3>
                <p className="rs-card-desc">{item.description || '暂无描述'}</p>
                <div className="rs-card-tags">
                  <span className={`rs-tag ${item.difficulty}`}>
                    {item.difficulty === 'beginner' ? '入门' : item.difficulty === 'intermediate' ? '中级' : '高级'}
                  </span>
                  <span className="rs-tag">{TYPE_LABELS[item.type] || item.type}</span>
                </div>
                {item.rating != null && (
                  <div className="rs-card-rating">
                    <StarFilled style={{ marginRight: 2 }} />{item.rating}
                  </div>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="rs-pagination">
              <button
                className="rs-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ArrowLeftOutlined /> 上一页
              </button>
              <span className="rs-pagination-info">{page} / {totalPages}</span>
              <button
                className="rs-pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页 <RightOutlined />
              </button>
            </div>
          )}
        </>
      )}

      {/* 详情弹窗 */}
      {detail && (
        <div className="rs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="rs-modal">
            <h3>{detail.title}</h3>
            <div style={{ marginBottom: 12 }}>
              <span className={`rs-tag ${detail.difficulty}`}>
                {detail.difficulty === 'beginner' ? '入门' : detail.difficulty === 'intermediate' ? '中级' : '高级'}
              </span>
              <span className="rs-tag" style={{ marginLeft: 6 }}>{TYPE_LABELS[detail.type]}</span>
              {detail.category && <span className="rs-tag" style={{ marginLeft: 6 }}>{detail.category}</span>}
              {detail.duration && <span className="rs-tag" style={{ marginLeft: 6 }}>{detail.duration}</span>}
            </div>
            <p style={{ color: 'var(--text)', lineHeight: 1.8 }}>{detail.description}</p>
            {detail.tags && detail.tags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {detail.tags.map((t) => (
                  <span key={t} className="rs-tag" style={{ marginRight: 4 }}>{t}</span>
                ))}
              </div>
            )}
            <div className="rs-modal-footer">
              {detail.url && (
                <button
                  className="rs-btn-primary"
                  onClick={() => window.open(detail.url!, '_blank')}
                >
                  去学习
                </button>
              )}
              <button className="rs-btn" onClick={() => setDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 技能缺口弹窗 */}
      {showSkillGapModal && (
        <div className="rs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSkillGapModal(false) }}>
          <div className="rs-modal">
            <h3>配置技能缺口</h3>
            <div className="rs-skill-modal">
              <div className="rs-skill-field">
                <label>目标岗位</label>
                <input
                  placeholder="例如：高级后端开发工程师"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(e.target.value)}
                />
              </div>
              <div className="rs-skill-field">
                <label>技能缺口</label>
                <div className="rs-skill-tags" onClick={() => document.getElementById('skill-gap-input')?.focus()}>
                  {skillGaps.map((s) => (
                    <span key={s} className="rs-skill-tag-item">
                      {s}
                      <span className="rs-skill-tag-remove" onClick={() => removeSkillGap(s)}>
                        <CloseOutlined />
                      </span>
                    </span>
                  ))}
                  <input
                    id="skill-gap-input"
                    placeholder="输入技能，按回车添加"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                  />
                </div>
              </div>
            </div>
            <div className="rs-modal-footer">
              <button className="rs-btn" onClick={() => setShowSkillGapModal(false)}>取消</button>
              <button
                className="rs-btn-primary"
                disabled={!targetPosition.trim() || skillGaps.length === 0}
                onClick={handleLoadRecommendations}
              >
                {recLoading ? '获取中...' : '获取推荐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
