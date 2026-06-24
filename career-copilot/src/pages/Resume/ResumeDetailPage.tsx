import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  BookOutlined,
  BuildOutlined,
  ProjectOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '@/components/common'
import { EditModal, SkillRadar } from '@/components/resume'
import { useResumeStore } from '@/store/useResumeStore'
import { toast } from '@/store/useToastStore'
import type { ParsedResumeData } from '@/types/resume'
import './Resume.css'

/** 从 skills 字符串数组生成 SkillRadar 所需的 {name, score} 格式 */
function makeSkillScores(skills: string[]): Array<{ name: string; score: number }> {
  return skills.map((name, i) => ({
    name,
    score: Math.round(95 - i * (30 / Math.max(skills.length - 1, 1))),
  }))
}

const ResumeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resume = useResumeStore((s) => s.currentResume)
  const loading = useResumeStore((s) => s.loading)
  const storeError = useResumeStore((s) => s.error)
  const fetchResumeById = useResumeStore((s) => s.fetchResumeById)
  const deleteResume = useResumeStore((s) => s.deleteResume)
  const updateResume = useResumeStore((s) => s.updateResume)
  const reparseResume = useResumeStore((s) => s.reparseResume)

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reparsing, setReparsing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // 首次加载
  useEffect(() => {
    if (id) fetchResumeById(id)
    return () => { useResumeStore.getState().resetCurrent() }
  }, [id, fetchResumeById])

  // 解析中轮询（仅依赖 id，不自残重建间隔）
  useEffect(() => {
    if (!id) return

    timerRef.current = setInterval(() => {
      const cur = useResumeStore.getState().currentResume
      if (!cur || cur.status !== 'parsing') {
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      fetchResumeById(id)
    }, 3000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [id, fetchResumeById])

  const handleSaveEdit = useCallback(async (data: { basicInfo?: { name?: string; phone?: string; email?: string }; skills?: string[] }) => {
    if (!id) return
    const cur = useResumeStore.getState().currentResume
    const existingParsed = cur?.parsedData
    setEditError(null)
    try {
      const merged: ParsedResumeData = {
        basicInfo: {
          name: data.basicInfo?.name ?? existingParsed?.basicInfo?.name ?? '',
          phone: data.basicInfo?.phone ?? existingParsed?.basicInfo?.phone ?? '',
          email: data.basicInfo?.email ?? existingParsed?.basicInfo?.email ?? '',
        },
        education: existingParsed?.education ?? [],
        experience: existingParsed?.experience ?? [],
        projects: existingParsed?.projects ?? [],
        skills: data.skills ?? existingParsed?.skills ?? [],
      }
      await updateResume(id, { parsedData: merged } as any)
      setShowEdit(false)
    } catch (err) {
      setEditError((err as Error).message || '保存失败')
    }
  }, [id, updateResume])

  const handleReparse = useCallback(async () => {
    if (!id) return
    setReparsing(true)
    try {
      await reparseResume(id)
    } catch {
      // reparseResume 后端暂未实现时静默处理
      toast.error('重新解析简历失败，功能暂不可用')
    } finally {
      setReparsing(false)
    }
  }, [id, reparseResume])

  const handleDelete = () => {
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (!id) return
    setShowDelete(false)
    await deleteResume(id)
    navigate('/resume', { replace: true })
  }

  // 首次加载中
  if (loading && !resume) {
    return (
      <div className="detail-page">
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      </div>
    )
  }

  // 加载失败
  if ((storeError && !resume) || (!loading && !resume)) {
    return (
      <div className="detail-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="简历不存在或加载失败"
          description={storeError || '请检查简历 ID 是否正确'}
          actionText="返回列表"
          onAction={() => navigate('/resume')}
        />
      </div>
    )
  }

  if (!resume) return null

  const parsed = resume.parsedData || ({} as ParsedResumeData)
  const skillScores = makeSkillScores(resume.skills || [])

  // 解析中状态
  if (resume.status === 'parsing') {
    return (
      <div className="detail-page">
        <div className="parsing-overlay">
          <LoadingOutlined className="parsing-icon" />
          <h3 style={{ margin: 0, color: 'var(--text-h)' }}>简历解析中</h3>
          <p>AI 正在提取简历中的结构化信息，请稍候...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-header-icon">
            <FileTextOutlined />
          </div>
          <div className="detail-header-info">
            <h1>{resume.title}</h1>
            <div className="detail-meta">
              <span className="status-badge completed">已完成</span>
              <span className="separator">|</span>
              上传于 {new Date(resume.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <button
            className="detail-action-btn"
            onClick={() => setShowEdit(true)}
          >
            <EditOutlined /> 编辑
          </button>
          <button
            className="detail-action-btn"
            onClick={handleReparse}
            disabled={reparsing}
          >
            {reparsing ? <LoadingOutlined /> : <ReloadOutlined />}
            {reparsing ? '重新解析中...' : '重新解析'}
          </button>
          <button
            className="detail-action-btn danger"
            onClick={handleDelete}
          >
            <DeleteOutlined /> 删除
          </button>
          <button
            className="detail-action-btn"
            onClick={() => navigate('/resume')}
          >
            <ArrowLeftOutlined /> 返回
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3 className="detail-section-title">
            <UserOutlined className="section-icon" /> 基本信息
          </h3>
          <div className="info-row">
            <span className="info-label">姓名</span>
            <span className="info-value">{parsed.basicInfo?.name || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">电话</span>
            <span className="info-value">{parsed.basicInfo?.phone || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">邮箱</span>
            <span className="info-value">{parsed.basicInfo?.email || '-'}</span>
          </div>
        </div>

        {skillScores.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">
              <CodeOutlined className="section-icon" /> 技能评估
            </h3>
            <div className="radar-wrapper">
              <SkillRadar skills={skillScores} />
            </div>
          </div>
        )}

        <div className="detail-section full">
          <h3 className="detail-section-title">
            <BookOutlined className="section-icon" /> 教育背景
          </h3>
          {(parsed.education || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无教育背景信息</div>
          ) : (
            parsed.education!.map((edu, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-title">{edu.school}</div>
                <div className="timeline-sub">
                  {edu.major} · {edu.degree} · {edu.period}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="detail-section full">
          <h3 className="detail-section-title">
            <BuildOutlined className="section-icon" /> 工作经历
          </h3>
          {(parsed.experience || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无工作经历信息</div>
          ) : (
            parsed.experience!.map((exp, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-title">{exp.company} · {exp.position}</div>
                <div className="timeline-sub">{exp.period}</div>
                <div className="timeline-desc">{exp.description}</div>
              </div>
            ))
          )}
        </div>

        <div className="detail-section full">
          <h3 className="detail-section-title">
            <ProjectOutlined className="section-icon" /> 项目经验
          </h3>
          {(parsed.projects || []).length === 0 ? (
            <div className="empty-text">暂无项目经验</div>
          ) : (
            parsed.projects!.map((proj, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-title">{proj.name}</div>
                <div className="timeline-sub">
                  角色：{proj.role} · 技术栈：{proj.techStack?.join('、')}
                </div>
                <div className="timeline-desc">{proj.description}</div>
              </div>
            ))
          )}
        </div>

        <div className="detail-section full">
          <h3 className="detail-section-title">
            <CodeOutlined className="section-icon" /> 技能标签
          </h3>
          {(parsed.skills || []).length === 0 ? (
            <div className="empty-text">暂无技能标签</div>
          ) : (
            <div className="skills-cloud">
              {parsed.skills!.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditModal
          parsedData={parsed}
          onSave={handleSaveEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      {editError && (
        <div className="toast-error">{editError}</div>
      )}

      <ConfirmModal
        open={showDelete}
        title="删除简历"
        message="删除后无法恢复，确定要删除这份简历吗？"
        type="danger"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

export default ResumeDetailPage
