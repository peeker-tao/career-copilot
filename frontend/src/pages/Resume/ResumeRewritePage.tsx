import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { getResumeById, getRewriteSuggestions, rewriteSection, type RewriteSuggestion } from '@/api/resumes'
import type { ResumeDetail, ParsedResumeData } from '@/types/resume'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import './ResumeRewrite.css'

type RewriteSection = 'summary' | 'experience' | 'skills' | 'projects'

const SECTION_LABELS: Record<RewriteSection, string> = {
  summary: '个人总结',
  experience: '工作经历',
  skills: '技能',
  projects: '项目经历',
}

function getSectionContent(data: ParsedResumeData | undefined, section: RewriteSection): string {
  if (!data) return ''
  switch (section) {
    case 'summary':
      return data.basicInfo?.name ? `${data.basicInfo.name}的简历` : ''
    case 'experience':
      return data.experience?.map((e) => `${e.company} - ${e.position}: ${e.description}`).join('\n') ?? ''
    case 'skills':
      return data.skills?.join(', ') ?? ''
    case 'projects':
      return data.projects?.map((p) => `${p.name}(${p.role}): ${p.description}`).join('\n') ?? ''
    default:
      return ''
  }
}

export default function ResumeRewritePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // 改写状态
  const [targetPosition, setTargetPosition] = useState('')
  const [activeSection, setActiveSection] = useState<RewriteSection>('summary')
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // 手动改写
  const [manualContent, setManualContent] = useState('')
  const [manualResult, setManualResult] = useState<{ rewritten: string; changes: string[] } | null>(null)
  const [manualLoading, setManualLoading] = useState(false)

  // 替换追踪
  const [replacedIndexes, setReplacedIndexes] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getResumeById(id)
      .then((res) => setResume(res.data))
      .catch(() => {
        // 静默失败
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleGetSuggestions = useCallback(async () => {
    if (!id || !targetPosition.trim()) return
    setSuggestionsLoading(true)
    try {
      const res = await getRewriteSuggestions(id, targetPosition.trim())
      setSuggestions(res.data?.suggestions ?? [])
      setReplacedIndexes(new Set())
    } catch {
      // 静默失败
    } finally {
      setSuggestionsLoading(false)
    }
  }, [id, targetPosition])

  const handleManualRewrite = async () => {
    if (!id || !targetPosition.trim() || !manualContent.trim()) return
    setManualLoading(true)
    try {
      const res = await rewriteSection(id, {
        section: activeSection,
        targetPosition: targetPosition.trim(),
        content: manualContent.trim(),
      })
      setManualResult(res.data)
    } catch {
      // 静默失败
    } finally {
      setManualLoading(false)
    }
  }

  const handleApplySuggestion = (index: number) => {
    setReplacedIndexes((prev) => new Set([...prev, index]))
  }

  if (loading) return <Loading skeleton={{ rows: 8 }} className="pad-24-0" />
  if (!resume) return <EmptyState icon={<EditOutlined />} title="简历不存在" />

  const sectionContent = getSectionContent(resume.parsedData, activeSection)
  const sectionSuggestions = suggestions.filter((s) => s.section === activeSection)

  return (
    <div className="resume-rewrite-page">
      <button className="rrw-back" onClick={() => navigate(`/resume/${id}`)}>
        <ArrowLeftOutlined /> 返回简历详情
      </button>

      <h1 className="rrw-title">简历改写 - {resume.title}</h1>

      {/* 目标岗位输入 */}
      <div className="rrw-section">
        <div className="rrw-form-row">
          <div className="rrw-form-field">
            <label className="rrw-form-label">目标岗位</label>
            <input
              className="rrw-form-input"
              placeholder="输入您要投递的目标岗位"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
            />
          </div>
          <button
            className="rrw-btn-primary"
            disabled={!targetPosition.trim() || suggestionsLoading}
            onClick={handleGetSuggestions}
          >
            <ThunderboltOutlined />
            {suggestionsLoading ? '获取中...' : '获取AI改写建议'}
          </button>
        </div>
      </div>

      {/* 段落选择 */}
      <div className="rrw-section">
        <h3 className="rrw-section-title">选择改写段落</h3>
        <div className="rrw-tabs">
          {(Object.entries(SECTION_LABELS) as [RewriteSection, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`rrw-tab ${activeSection === key ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(key)
                setManualResult(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* AI 改写建议 */}
        {sectionSuggestions.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-h)', marginBottom: 16 }}>
              <ThunderboltOutlined style={{ marginRight: 6 }} />AI 改写建议
            </h3>
            {sectionSuggestions.map((suggestion, index) => {
              const globalIndex = suggestions.indexOf(suggestion)
              const isReplaced = replacedIndexes.has(globalIndex)
              return (
                <div key={index} className="rrw-compare-card" style={{ opacity: isReplaced ? 0.6 : 1 }}>
                  <div className="rrw-compare-num">建议 {index + 1}</div>
                  <div className="rrw-original">
                    <strong>原文：</strong>{suggestion.original}
                  </div>
                  <div className="rrw-suggested">
                    <strong>改写：</strong>{suggestion.suggested}
                  </div>
                  <div className="rrw-reason">
                    <strong>理由：</strong>{suggestion.reason}
                  </div>
                  <div>
                    <button
                      className="rrw-btn-apply"
                      disabled={isReplaced}
                      onClick={() => handleApplySuggestion(globalIndex)}
                    >
                      <CheckOutlined />
                      {isReplaced ? '已应用' : '应用此建议'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 手动改写 */}
      <div className="rrw-manual">
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-h)' }}>
          <EditOutlined style={{ marginRight: 6 }} />手动改写 {SECTION_LABELS[activeSection]}
        </h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-h)', marginBottom: 8 }}>
            原始内容
          </label>
          <textarea
            rows={5}
            value={sectionContent || manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder={`请输入需要改写的${SECTION_LABELS[activeSection]}内容`}
          />
        </div>
        <button
          className="rrw-btn-primary"
          disabled={!targetPosition.trim() || manualLoading}
          onClick={handleManualRewrite}
          style={{ fontSize: 13, padding: '8px 18px' }}
        >
          <ReloadOutlined />
          {manualLoading ? '改写中...' : 'AI 改写此段落'}
        </button>

        {manualResult && (
          <div className="rrw-manual-result">
            <strong>改写结果：</strong>{manualResult.rewritten}
            {manualResult.changes?.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                修改说明：
                {manualResult.changes.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block', marginLeft: 6, padding: '2px 10px',
                      borderRadius: 20, fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
