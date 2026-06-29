import { useState, useEffect, useCallback } from 'react'
import {
  QuestionCircleOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  EditOutlined,
  CheckSquareOutlined,
  BulbOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import type { QuestionBankItem, QuestionCategory, QuestionType } from '@/types/question-bank'
import * as questionBankApi from '@/api/question-bank'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './QuestionBank.css'

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  choice: <CheckSquareOutlined />,
  short_answer: <EditOutlined />,
  coding: <CodeOutlined />,
}

const TYPE_LABELS: Record<QuestionType, string> = {
  choice: '选择题',
  short_answer: '简答题',
  coding: '编程题',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export default function QuestionBankPage() {
  // 列表
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // 筛选
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [category, setCategory] = useState<string | undefined>()
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [type, setType] = useState<string | undefined>()

  // AI生成
  const [genPosition, setGenPosition] = useState('')
  const [genSkills, setGenSkills] = useState<string[]>([])
  const [genSkillInput, setGenSkillInput] = useState('')
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [genCount, setGenCount] = useState(5)
  const [genTypes, setGenTypes] = useState<QuestionType[]>(['short_answer'])
  const [genLoading, setGenLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionBankItem[]>([])

  // 详情
  const [detail, setDetail] = useState<QuestionBankItem | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      const res = await questionBankApi.getCategories()
      setCategories(res.data ?? [])
    } catch { setCategories([]) }
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await questionBankApi.getQuestions({ page, limit: pageSize, category, difficulty, type })
      setQuestions(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [page, category, difficulty, type])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleGenerate = async () => {
    if (!genPosition.trim()) return
    setGenLoading(true)
    try {
      const res = await questionBankApi.generateQuestions({
        position: genPosition.trim(),
        skills: genSkills,
        difficulty: genDifficulty,
        count: genCount,
        types: genTypes,
      })
      setGeneratedQuestions(res.data?.questions ?? [])
    } catch {
      // 静默失败
    } finally {
      setGenLoading(false)
    }
  }

  const addSkill = (val: string) => {
    if (val && !genSkills.includes(val)) setGenSkills([...genSkills, val])
    setGenSkillInput('')
  }

  const removeSkill = (val: string) => {
    setGenSkills(genSkills.filter((s) => s !== val))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill(genSkillInput.trim())
    }
  }

  const toggleGenType = (t: QuestionType) => {
    setGenTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="question-bank-page">
      <h1 className="page-title">面试题库</h1>
      <p className="page-desc">AI 驱动的面试题目生成与管理</p>

      {/* AI 生成区 */}
      <div className="qb-generate-section">
        <h3><ThunderboltOutlined /> AI 智能出题</h3>
        <div className="qb-gen-form">
          <div className="qb-gen-field">
            <label className="qb-gen-label">目标岗位</label>
            <input
              className="qb-gen-input"
              placeholder="例如：后端开发工程师"
              value={genPosition}
              onChange={(e) => setGenPosition(e.target.value)}
            />
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">技能标签</label>
            <div
              className="qb-gen-input"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minHeight: 36, padding: '4px 8px', cursor: 'text' }}
              onClick={() => document.getElementById('gen-skill-input')?.focus()}
            >
              {genSkills.map((s) => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                    padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                  }}
                >
                  {s}
                  <CloseOutlined style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => removeSkill(s)} />
                </span>
              ))}
              <input
                id="gen-skill-input"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  color: 'var(--text-h)', fontSize: 14, minWidth: 100, flex: 1,
                  padding: '2px 0', fontFamily: 'var(--sans)',
                }}
                placeholder={genSkills.length === 0 ? '技能关键词' : ''}
                value={genSkillInput}
                onChange={(e) => setGenSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
            </div>
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">难度</label>
            <select
              className="qb-gen-select"
              value={genDifficulty}
              onChange={(e) => setGenDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">数量</label>
            <input
              className="qb-gen-input short"
              type="number"
              min={1}
              max={20}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value) || 5)}
            />
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">题型</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['short_answer', 'choice', 'coding'] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  className={`qb-btn ${genTypes.includes(t) ? 'qb-btn-primary' : ''}`}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => toggleGenType(t)}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              className="qb-btn-primary"
              disabled={!genPosition.trim() || genLoading}
              onClick={handleGenerate}
            >
              <ThunderboltOutlined /> {genLoading ? '生成中...' : '生成题目'}
            </button>
          </div>
        </div>

        {generatedQuestions.length > 0 && (
          <div className="qb-generated-list">
            <div className="qb-gen-result-header">
              <span>生成结果 ({generatedQuestions.length}题)</span>
              <button
                className="qb-btn"
                style={{ padding: '4px 14px', fontSize: 12 }}
                onClick={() => setGeneratedQuestions([])}
              >
                收起
              </button>
            </div>
            {generatedQuestions.map((q, i) => (
              <div key={i} className="qb-gen-item">
                <div className="qb-gen-item-q">{i + 1}. {q.question}</div>
                <div className="qb-card-tags">
                  <span className={`qb-tag ${q.difficulty}`}>
                    {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                  </span>
                  <span className="qb-tag">{TYPE_LABELS[q.type] || q.type}</span>
                  <span className="qb-tag">{q.category}</span>
                </div>
                {q.answer && (
                  <div className="qb-gen-item-answer">
                    <strong>答案：</strong>{q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 筛选 */}
      <div className="qb-toolbar">
        <select
          className="qb-filter-select"
          value={category ?? ''}
          onChange={(e) => { setCategory(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
          ))}
        </select>
        <select
          className="qb-filter-select"
          value={difficulty ?? ''}
          onChange={(e) => { setDifficulty(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
        <select
          className="qb-filter-select"
          value={type ?? ''}
          onChange={(e) => { setType(e.target.value || undefined); setPage(1) }}
        >
          <option value="">全部题型</option>
          <option value="short_answer">简答题</option>
          <option value="choice">选择题</option>
          <option value="coding">编程题</option>
        </select>
      </div>

      {/* 题目列表 */}
      {loading ? (
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<QuestionCircleOutlined />}
          title="暂无题目"
          description="尝试调整筛选条件或使用AI智能出题"
        />
      ) : (
        <>
          <div className="qb-list">
            {questions.map((item) => (
              <div key={item.id} className="qb-card" onClick={() => setDetail(item)}>
                <div className="qb-card-question">{item.question}</div>
                <div className="qb-card-tags">
                  <span className={`qb-tag ${item.difficulty}`}>
                    {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                  </span>
                  <span className="qb-tag">
                    {TYPE_ICONS[item.type]} {TYPE_LABELS[item.type] || item.type}
                  </span>
                  <span className="qb-tag">{item.category}</span>
                  {item.tags?.map((t: string) => (
                    <span key={t} className="qb-tag">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="qb-pagination">
              <button
                className="qb-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ArrowLeftOutlined /> 上一页
              </button>
              <span className="qb-pagination-info">{page} / {totalPages}</span>
              <button
                className="qb-pagination-btn"
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
        <div className="qb-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="qb-modal">
            <h3>{detail.category || '题目详情'}</h3>
            <div style={{ marginBottom: 12 }}>
              <span className={`qb-tag ${detail.difficulty}`}>
                {DIFFICULTY_LABELS[detail.difficulty] || detail.difficulty}
              </span>
              <span className="qb-tag" style={{ marginLeft: 6 }}>
                {TYPE_ICONS[detail.type]} {TYPE_LABELS[detail.type] || detail.type}
              </span>
              <span className="qb-tag" style={{ marginLeft: 6 }}>{detail.category}</span>
            </div>
            <div className="qb-modal-body">{detail.question}</div>
            {detail.hint && (
              <div className="qb-modal-hint">
                <BulbOutlined style={{ marginRight: 4 }} />
                <strong>提示：</strong>{detail.hint}
              </div>
            )}
            {detail.answer && (
              <div className="qb-modal-answer">
                <strong>参考答案：</strong><br />{detail.answer}
              </div>
            )}
            {detail.tags && detail.tags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {detail.tags.map((t: string) => (
                  <span key={t} className="qb-tag" style={{ marginRight: 4 }}>{t}</span>
                ))}
              </div>
            )}
            <div className="qb-modal-close">
              <button className="qb-btn" onClick={() => setDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
