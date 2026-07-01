import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ReadOutlined,
  BulbOutlined,
  StarFilled,
  StarOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  FireOutlined,
  CodeOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import type { LearningResource, ResourceCategory, RecommendedResource } from '@/types/learning-resources'
import * as resourcesApi from '@/api/learning-resources'
import { toast } from '@/store/useToastStore'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './LearningResources.css'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <PlayCircleOutlined style={{ color: '#ff4d4f', fontSize: 26 }} />,
  article: <FileTextOutlined style={{ color: '#1890ff', fontSize: 26 }} />,
  course: <ReadOutlined style={{ color: '#52c41a', fontSize: 26 }} />,
  book: <BookOutlined style={{ color: '#722ed1', fontSize: 26 }} />,
  documentation: <CodeOutlined style={{ color: '#13c2c2', fontSize: 26 }} />,
}

const TYPE_LABELS: Record<string, string> = {
  video: '视频',
  article: '文章',
  course: '课程',
  book: '书籍',
  documentation: '文档',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
}

const SOURCE_LABELS: Record<string, { text: string; className: string }> = {
  ai_generated: { text: 'AI 生成', className: 'rs-badge-ai' },
  database: { text: '精选', className: 'rs-badge-db' },
  database_fallback: { text: '数据库', className: 'rs-badge-db' },
}

const PRESET_SKILLS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'Node.js', 'Spring Boot',
  'Python', 'Docker', 'Kubernetes', 'AWS', 'MySQL', 'MongoDB',
  'Redis', 'Git', 'CI/CD', '微服务', '设计模式', '系统设计',
]

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
  const [recSource, setRecSource] = useState<string | undefined>()
  const [recLoading, setRecLoading] = useState(false)
  const [showSkillGapModal, setShowSkillGapModal] = useState(false)
  const [skillGaps, setSkillGaps] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [targetPosition, setTargetPosition] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  // 详情弹窗
  const [detail, setDetail] = useState<LearningResource | null>(null)

  // 收藏 (localStorage 持久化)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lr_favorites')
      return new Set(saved ? JSON.parse(saved) : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem('lr_favorites', JSON.stringify([...favoriteIds]))
  }, [favoriteIds])

  const toggleFavorite = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.success(`已取消收藏「${title}」`)
      } else {
        next.add(id)
        toast.success(`已收藏「${title}」`)
      }
      return next
    })
  }

  // 搜索防抖
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  // 搜索防抖
  const handleSearchChange = (val: string) => {
    setKeyword(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setPage(1), 400)
  }

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
      // 尝试从响应中提取 source（后端可能返回完整结构）
      if (res as any) {
        const raw = res as any
        setRecSource(raw?.source ?? undefined)
      }
      setShowSkillGapModal(false)
    } catch {
      // 静默失败
    } finally {
      setRecLoading(false)
    }
  }

  const addSkillGap = (val: string) => {
    const v = val.trim()
    if (v && !skillGaps.includes(v)) {
      setSkillGaps([...skillGaps, v])
    }
    setSkillInput('')
  }

  const removeSkillGap = (val: string) => {
    setSkillGaps(skillGaps.filter((s) => s !== val))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkillGap(skillInput)
    }
  }

  const clearFilters = () => {
    setKeyword('')
    setCategory(undefined)
    setDifficulty(undefined)
    setType(undefined)
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)
  const hasFilters = !!keyword || !!category || !!difficulty || !!type

  // 计算各分类实际数量
  const categoryCounts: Record<string, number> = {}
  for (const r of resources) {
    if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1
  }
  const enrichedCategories = categories.map((c) => ({
    ...c,
    count: categoryCounts[c.name] ?? c.count,
  })).filter((c) => c.count > 0 || c.name === category)

  const recSourceInfo = recSource ? SOURCE_LABELS[recSource] : undefined

  return (
    <div className="resources-page">
      <h1 className="page-title">学习资源</h1>
      <p className="page-desc">个性化学习资源推荐，助力技能提升</p>

      {/* AI 推荐区 */}
      <div className="rs-recommend-section">
        <div className="rs-recommend-header">
          <h3><ThunderboltOutlined /> AI 个性化推荐</h3>
          {recommendations.length > 0 && (
            <button className="rs-btn rs-btn-ghost" onClick={() => setShowSkillGapModal(true)}>
              重新配置
            </button>
          )}
          {recommendations.length === 0 && (
            <button className="rs-btn rs-btn-ghost" onClick={() => setShowSkillGapModal(true)}>
              配置技能缺口
            </button>
          )}
        </div>
        {recLoading ? (
          <Loading skeleton={{ rows: 3 }} />
        ) : recommendations.length > 0 ? (
          <div>
            {recSourceInfo && (
              <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                推荐来源：<span className={`rs-badge ${recSourceInfo.className}`}>{recSourceInfo.text}</span>
                {targetPosition && <span style={{ marginLeft: 12 }}>目标岗位：<strong>{targetPosition}</strong></span>}
              </div>
            )}
            {recommendations.map((item) => (
              <div key={item.id} className="rs-rec-item" onClick={() => setDetail(item)}>
                <div className="rs-rec-score-circle">
                  <span className="rs-rec-score-val">{item.relevanceScore ?? '?'}</span>
                  <div className="rs-rec-score-bar">
                    <div
                      className="rs-rec-score-fill"
                      style={{ width: `${Math.min((item.relevanceScore ?? 0) / 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rs-rec-info">
                  <h4>{item.title}</h4>
                  <div className="rs-rec-meta">
                    <span className="rs-tag-sm">{TYPE_LABELS[item.type] || item.type}</span>
                    <span className={`rs-tag-sm rs-diff-${item.difficulty}`}>
                      {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                    </span>
                  </div>
                  <div className="rs-rec-reason">{item.reason || '基于您的技能缺口推荐'}</div>
                </div>
                <button
                  className="rs-rec-fav-btn"
                  onClick={(e) => toggleFavorite(item.id, item.title, e)}
                  title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                >
                  {favoriteIds.has(item.id) ? (
                    <StarFilled style={{ color: '#faad14' }} />
                  ) : (
                    <StarOutlined />
                  )}
                </button>
                {item.url && (
                  <button
                    className="rs-rec-link-btn"
                    onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank') }}
                    title="打开资源"
                  >
                    去学习
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rs-empty-rec">
            <BulbOutlined style={{ fontSize: 32, opacity: 0.3, marginBottom: 8, display: 'block' }} />
            <p>配置您的技能缺口和目标岗位</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>获取 AI 个性化学习资源推荐</p>
            <button
              className="rs-btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => setShowSkillGapModal(true)}
            >
              立即配置
            </button>
          </div>
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {keyword && (
            <CloseOutlined
              className="rs-search-clear"
              onClick={() => { setKeyword(''); setPage(1) }}
            />
          )}
        </div>
        <select
          className="rs-filter-select"
          value={category ?? ''}
          onChange={(e) => { setCategory(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部分类</option>
          {enrichedCategories.map((c) => (
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
          <option value="documentation">文档</option>
        </select>
        {hasFilters && (
          <button className="rs-btn rs-btn-clear" onClick={clearFilters}>
            <CloseOutlined /> 清除筛选
          </button>
        )}
      </div>

      {/* 资源统计与列表 */}
      {loading ? (
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BulbOutlined />}
          title={hasFilters ? '未找到匹配的资源' : '暂无学习资源'}
          description={hasFilters ? '尝试调整筛选条件' : '系统正在自动生成资源，请稍后再来查看'}
          actionText={hasFilters ? '清除筛选' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <div className="rs-list-header">
            <span className="rs-list-count">共 <strong>{total}</strong> 个学习资源</span>
          </div>
          <div className="rs-grid">
            {resources.map((item) => (
              <div key={item.id} className="rs-card" onClick={() => setDetail(item)}>
                <div className="rs-card-icon">
                  {TYPE_ICONS[item.type] ?? <FileTextOutlined style={{ fontSize: 26 }} />}
                  {item.relevanceScore != null && item.relevanceScore > 0 && (
                    <span className="rs-card-hotness" title={`相关度 ${item.relevanceScore}`}>
                      <FireOutlined /> {item.relevanceScore}
                    </span>
                  )}
                </div>
                <h3 className="rs-card-title">{item.title}</h3>
                <p className="rs-card-desc">{item.description || '暂无描述'}</p>
                <div className="rs-card-tags">
                  <span className={`rs-tag rs-diff-${item.difficulty}`}>
                    {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                  </span>
                  <span className="rs-tag">{TYPE_LABELS[item.type] || item.type}</span>
                  {item.category && <span className="rs-tag rs-tag-cat">{item.category}</span>}
                </div>
                <div className="rs-card-footer">
                  {item.rating != null && item.rating > 0 && (
                    <div className="rs-card-rating">
                      <StarFilled style={{ marginRight: 2 }} />{item.rating}
                    </div>
                  )}
                  {item.usageCount != null && item.usageCount > 0 && (
                    <div className="rs-card-usage">
                      <TrophyOutlined /> {item.usageCount}
                    </div>
                  )}
                  <button
                    className="rs-card-fav-btn"
                    onClick={(e) => toggleFavorite(item.id, item.title, e)}
                    title={favoriteIds.has(item.id) ? '取消收藏' : '收藏'}
                  >
                    {favoriteIds.has(item.id) ? (
                      <StarFilled style={{ color: '#faad14' }} />
                    ) : (
                      <StarOutlined />
                    )}
                  </button>
                </div>
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
              <span className="rs-pagination-info">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
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
            <div className="rs-modal-tags">
              <span className={`rs-tag rs-diff-${detail.difficulty}`}>
                {DIFFICULTY_LABELS[detail.difficulty] || detail.difficulty}
              </span>
              <span className="rs-tag">{TYPE_LABELS[detail.type] || detail.type}</span>
              {detail.category && <span className="rs-tag rs-tag-cat">{detail.category}</span>}
              {detail.duration && <span className="rs-tag">⏱ {detail.duration}</span>}
              {(detail as any).aiGenerated && (
                <span className="rs-badge rs-badge-ai">AI 生成</span>
              )}
              {detail.usageCount != null && detail.usageCount > 0 && (
                <span className="rs-tag"><TrophyOutlined /> {detail.usageCount} 人学习</span>
              )}
              {detail.rating != null && detail.rating > 0 && (
                <span className="rs-tag" style={{ color: '#faad14' }}>
                  <StarFilled /> {detail.rating}
                </span>
              )}
            </div>
            <div className="rs-modal-desc">{detail.description}</div>
            {detail.tags && detail.tags.length > 0 && (
              <div className="rs-modal-tags" style={{ marginTop: 12 }}>
                {detail.tags.map((t) => (
                  <span key={t} className="rs-tag" style={{ marginRight: 4 }}>{t}</span>
                ))}
              </div>
            )}
            {detail.relevanceScore != null && detail.relevanceScore > 0 && (
              <div className="rs-modal-score">
                <span>相关度评分</span>
                <div className="rs-modal-score-bar">
                  <div
                    className="rs-modal-score-fill"
                    style={{ width: `${Math.min((detail.relevanceScore ?? 0) / 10, 100)}%` }}
                  />
                </div>
                <span className="rs-modal-score-val">{detail.relevanceScore}/10</span>
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
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '-12px 0 16px' }}>
              告诉我们您想提升的技能和目标岗位，AI 将推荐最适合的学习资源
            </p>
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
                      <span className="rs-skill-tag-remove" onClick={(e) => { e.stopPropagation(); removeSkillGap(s) }}>
                        <CloseOutlined />
                      </span>
                    </span>
                  ))}
                  <input
                    id="skill-gap-input"
                    placeholder={skillGaps.length === 0 ? '输入技能，按回车添加' : '添加更多...'}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                  />
                </div>
              </div>
              {/* 预设技能 */}
              <div className="rs-skill-presets">
                <button
                  className="rs-skill-preset-toggle"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  {showPresets ? <UpOutlined /> : <DownOutlined />}
                  常用技能预设
                </button>
                {showPresets && (
                  <div className="rs-skill-preset-list">
                    {PRESET_SKILLS.map((s) => (
                      <span
                        key={s}
                        className={`rs-skill-preset-item${skillGaps.includes(s) ? ' active' : ''}`}
                        onClick={() => {
                          if (skillGaps.includes(s)) {
                            removeSkillGap(s)
                          } else {
                            addSkillGap(s)
                          }
                        }}
                      >
                        {skillGaps.includes(s) && <CheckCircleOutlined style={{ fontSize: 12 }} />}
                        {s}
                      </span>
                    ))}
                  </div>
                )}
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
