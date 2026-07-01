import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { getResumeById, getRewriteSuggestions, rewriteSection, updateResume, type RewriteSuggestion } from '@/api/resumes'
import type { ResumeDetail, ParsedResumeData } from '@/types/resume'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import { toast } from '@/store/useToastStore'
import './ResumeRewrite.css'

type RewriteSection = 'experience' | 'skills' | 'projects'

const SECTION_LABELS: Record<string, string> = {
  summary: '个人总结',
  experience: '工作经历',
  skills: '技能',
  projects: '项目经历',
}

const ALL_SECTIONS: RewriteSection[] = ['experience', 'projects', 'skills']

function getSectionContent(data: ParsedResumeData | undefined, section: RewriteSection): string {
  if (!data) return ''
  switch (section) {
    case 'experience': return Array.isArray(data.experience) ? data.experience.map((e) => `${e.company} - ${e.position}: ${e.description}`).join('\n') : ''
    case 'skills': return Array.isArray(data.skills) ? data.skills.join(', ') : ''
    case 'projects': return Array.isArray(data.projects) ? data.projects.map((p) => `${p.name}(${p.role}): ${p.description}`).join('\n') : ''
    default: return ''
  }
}

export default function ResumeRewritePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [targetPosition, setTargetPosition] = useState('')
  const [activeSection, setActiveSection] = useState<RewriteSection>('experience')
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const [manualContent, setManualContent] = useState('')
  const [manualResult, setManualResult] = useState<{ rewritten: string; changes: string[] } | null>(null)
  const [manualLoading, setManualLoading] = useState(false)

  const [replacedIndexes, setReplacedIndexes] = useState<Set<number>>(new Set())
  const [saveLoading, setSaveLoading] = useState(false)

  const [batchProgress, setBatchProgress] = useState<{ total: number; done: number; section: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getResumeById(id)
      .then((res) => setResume(res.data))
      .catch(() => toast.error('加载简历失败'))
      .finally(() => setLoading(false))
  }, [id])

  const handleGetSuggestions = useCallback(async () => {
    if (!id || !targetPosition.trim()) return
    setSuggestionsLoading(true)
    try {
      const res = await getRewriteSuggestions(id, targetPosition.trim())
      const list = res.data?.suggestions ?? []
      setSuggestions(list)
      setReplacedIndexes(new Set())
      if (list.length === 0) toast.success('已获取改写建议，暂无具体优化项')
      else toast.success(`已获取 ${list.length} 条改写建议`)
    } catch {
      toast.error('获取改写建议失败，请检查 AI 服务配置')
    } finally {
      setSuggestionsLoading(false)
    }
  }, [id, targetPosition])

  const handleManualRewrite = async () => {
    if (!id || !targetPosition.trim()) return
    const content = manualContent.trim() || sectionContent.trim()
    if (!content) { toast.warning('该章节暂无内容可改写'); return }
    setManualLoading(true)
    try {
      const res = await rewriteSection(id, {
        section: activeSection,
        targetPosition: targetPosition.trim(),
        content,
      })
      setManualResult(res.data)
      toast.success(`${SECTION_LABELS[activeSection]}改写成功`)
    } catch {
      toast.error('改写失败，请检查 AI 服务配置')
    } finally {
      setManualLoading(false)
    }
  }

  const handleSaveRewrite = async () => {
    if (!id || !resume?.parsedData) return
    const content = (manualContent || sectionContent)?.trim()
    if (!content) return
    setSaveLoading(true)
    try {
      const parsed = JSON.parse(JSON.stringify(resume.parsedData))
      if (activeSection === 'skills') {
        ;(parsed as any).skills = content.split(',').map((s) => s.trim()).filter(Boolean)
      } else {
        ;(parsed as any)[`${activeSection}_rewritten`] = content
      }
      await updateResume(id, { parsedData: parsed as any })
      toast.success('修改已保存到简历')
      setManualContent('')
      setManualResult(null)
    } catch {
      toast.error('保存失败')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleBatchRewrite = async () => {
    if (!id || !targetPosition.trim()) return
    const sectionsToRewrite = ALL_SECTIONS
    setBatchProgress({ total: sectionsToRewrite.length, done: 0, section: '' })

    for (let i = 0; i < sectionsToRewrite.length; i++) {
      const sec = sectionsToRewrite[i]
      setBatchProgress({ total: sectionsToRewrite.length, done: i, section: sec })
      const content = getSectionContent(resume?.parsedData, sec)
      if (!content.trim()) {
        setBatchProgress((p) => p ? { ...p, done: p.done + 1 } : null)
        continue
      }
      try {
        await rewriteSection(id, {
          section: sec,
          targetPosition: targetPosition.trim(),
          content,
        })
      } catch {
        toast.error(`${SECTION_LABELS[sec] || sec} 改写失败`)
      }
      setBatchProgress((p) => p ? { ...p, done: p.done + 1 } : null)
    }
    setBatchProgress(null)
    toast.success('全部章节改写完成！可返回简历详情查看')
  }

  const handleApplySuggestion = async (index: number) => {
    if (!id) return
    const suggestion = suggestions[index]
    if (!suggestion) return
    if (suggestion.section === 'summary') {
      toast.warning('个人总结为 AI 智能生成，无法直接保存到简历中，请参考建议手动编辑')
      return
    }
    try {
      await rewriteSection(id, {
        section: suggestion.section,
        targetPosition: targetPosition.trim(),
        content: suggestion.suggested,
      })
      setReplacedIndexes((prev) => new Set([...prev, index]))
      toast.success(`${SECTION_LABELS[suggestion.section] || suggestion.section} 已应用`)
    } catch {
      toast.error('应用失败')
    }
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

      {/* 目标岗位 + 获取建议 */}
      <div className="rrw-section">
        <div className="rrw-form-row">
          <div className="rrw-form-field">
            <label className="rrw-form-label">目标岗位</label>
            <input className="rrw-form-input" placeholder="输入您要投递的目标岗位" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} />
          </div>
          <button className="rrw-btn-primary" disabled={!targetPosition.trim() || suggestionsLoading} onClick={handleGetSuggestions}>
            <ThunderboltOutlined />{suggestionsLoading ? '获取中...' : '获取AI改写建议'}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '12px 14px', background: 'var(--accent-bg)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>已获取 {suggestions.length} 条建议</span>
            <button className="rrw-btn-primary" disabled={batchProgress !== null} onClick={handleBatchRewrite} style={{ padding: '6px 16px', fontSize: 13 }}>
              {batchProgress ? <LoadingOutlined /> : <ThunderboltOutlined />}
              {batchProgress ? `改写中 ${batchProgress.done + 1}/${batchProgress.total}` : '一键全部改写'}
            </button>
          </div>
        )}
      </div>

      {/* 段落切换 + 建议 */}
      <div className="rrw-section">
        <h3 className="rrw-section-title">选择改写段落</h3>
        <div className="rrw-tabs">
{(['experience', 'projects', 'skills', 'summary'] as const).map((key) => {
            const label = SECTION_LABELS[key] || key
            return (
            <button
              key={key}
              className={`rrw-tab ${activeSection === key ? 'active' : ''}`}
              onClick={() => { if (key !== 'summary') { setActiveSection(key as RewriteSection); setManualResult(null); setManualContent('') } }}
            >
              {label}
              {suggestions.filter((s) => s.section === key).length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>
                  {suggestions.filter((s) => s.section === key).length}
                </span>
              )}
            </button>
          )})}
        </div>

        {sectionSuggestions.length > 0 && (
          <div>
            {sectionSuggestions.map((suggestion, index) => {
              const globalIndex = suggestions.indexOf(suggestion)
              const isReplaced = replacedIndexes.has(globalIndex)
              return (
                <div key={index} className="rrw-compare-card" style={{ opacity: isReplaced ? 0.6 : 1 }}>
                  <div className="rrw-compare-num">建议 {index + 1}</div>
                  <div className="rrw-original"><strong>原文：</strong>{suggestion.original}</div>
                  <div className="rrw-suggested"><strong>改写：</strong>{suggestion.suggested}</div>
                  <div className="rrw-reason"><strong>理由：</strong>{suggestion.reason}</div>
                  <button className="rrw-btn-apply" disabled={isReplaced} onClick={() => handleApplySuggestion(globalIndex)}>
                    <CheckOutlined />{isReplaced ? '已应用' : '应用此建议'}
                  </button>
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
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-h)', marginBottom: 8 }}>原始内容</label>
          <textarea rows={5} value={manualContent || sectionContent} onChange={(e) => setManualContent(e.target.value)} placeholder={`请输入需要改写的${SECTION_LABELS[activeSection]}内容`} />
        </div>
<div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <button className="rrw-btn-primary" disabled={!targetPosition.trim() || manualLoading} onClick={handleManualRewrite} style={{ fontSize: 13, padding: '8px 18px' }}>
              <ReloadOutlined />{manualLoading ? '改写中...' : 'AI 改写此段落'}
            </button>
            <button className="rrw-btn-apply" onClick={handleSaveRewrite} disabled={saveLoading || !((manualContent || sectionContent)?.trim())} style={{ padding: '8px 18px', fontSize: 13 }}>
              {saveLoading ? '保存中...' : '保存修改'}
            </button>
          </div>

        {manualResult && (
          <div className="rrw-manual-result">
            <strong>改写结果：</strong>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
              {typeof manualResult.rewritten === 'string'
                ? manualResult.rewritten
                : (manualResult.rewritten as any)?.improved || JSON.stringify(manualResult.rewritten, null, 2)}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="rrw-btn-apply" onClick={handleSaveRewrite} disabled={saveLoading}>
                {saveLoading ? '保存中...' : '保存到简历'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}