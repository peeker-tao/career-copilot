import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  UserOutlined,
  BookOutlined,
  BuildOutlined,
  ProjectOutlined,
  CodeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState } from '@/components/common'
import { getResumeById } from '@/api/resumes'
import type { ResumeDetail } from '@/types/resume'
import './Resume.css'

const SECTION_LABELS: Record<string, string> = {
  user: '基本信息',
  education: '教育经历',
  experience: '工作经历',
  projects: '项目经历',
  skills: '技能标签',
}

const ResumeComparePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ids = useMemo(
    () => (searchParams.get('ids') || '').split(',').filter(Boolean),
    [searchParams]
  )

  const [resumes, setResumes] = useState<ResumeDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length < 2) {
      setError('请至少选择 2 份简历进行对比')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all(ids.map((id) => getResumeById(id).then((r) => r.data)))
      .then((data) => {
        if (!cancelled) {
          setResumes(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message || '加载简历失败')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [ids])

  if (loading) {
    return (
      <div className="compare-page page-container">
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="compare-page page-container">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="对比加载失败"
          description={error}
          actionText="返回列表"
          onAction={() => navigate('/resume')}
        />
      </div>
    )
  }

  return (
    <div className="compare-page page-container">
      <div className="compare-header">
        <button className="detail-action-btn" onClick={() => navigate('/resume')}>
          <ArrowLeftOutlined /> 返回列表
        </button>
        <h1 className="compare-title">简历对比</h1>
        <span className="compare-count">
          共 {resumes.length} 份简历
        </span>
      </div>

      <div
        className="compare-grid"
        style={{ gridTemplateColumns: `120px repeat(${Math.min(resumes.length, 4)}, 1fr)` }}
      >
        {/* 标签列占位 + 每列标题 */}
        <div className="compare-label-placeholder" />
        {resumes.map((r) => (
          <div key={r.id} className="compare-col">
            <div className="compare-col-header" onClick={() => navigate(`/resume/${r.id}`)}>
              <div className="compare-col-title">{r.title}</div>
              <div className="compare-col-meta">
                {r.status === 'completed' ? '已完成' : r.status}
                {' · '}
                {new Date(r.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        ))}

        {/* 基本信息 */}
        <div className="compare-label"><UserOutlined /> {SECTION_LABELS.user}</div>
        {resumes.map((r) => (
          <div key={r.id} className="compare-cell">
            <div className="compare-basic-row"><span>姓名</span><span>{r.parsedData?.basicInfo?.name || '-'}</span></div>
            <div className="compare-basic-row"><span>电话</span><span>{r.parsedData?.basicInfo?.phone || '-'}</span></div>
            <div className="compare-basic-row"><span>邮箱</span><span>{r.parsedData?.basicInfo?.email || '-'}</span></div>
          </div>
        ))}

        {/* 技能标签 */}
        <div className="compare-label"><CodeOutlined /> {SECTION_LABELS.skills}</div>
        {resumes.map((r) => (
          <div key={r.id} className="compare-cell">
            {(r.parsedData?.skills || []).length === 0 ? (
              <span className="empty-text">暂无技能</span>
            ) : (
              <div className="skills-cloud">
                {(r.parsedData?.skills || []).map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 教育经历 */}
        <div className="compare-label"><BookOutlined /> {SECTION_LABELS.education}</div>
        {resumes.map((r) => (
          <div key={r.id} className="compare-cell">
            {(r.parsedData?.education || []).length === 0 ? (
              <span className="empty-text">暂无教育经历</span>
            ) : (
              (r.parsedData?.education || []).map((edu, i) => (
                <div key={i} className="compare-timeline-item">
                  <div className="compare-timeline-title">{edu.school}</div>
                  <div className="compare-timeline-sub">
                    {edu.major} · {edu.degree}
                  </div>
                  <div className="compare-timeline-period">{edu.period}</div>
                </div>
              ))
            )}
          </div>
        ))}

        {/* 工作经历 */}
        <div className="compare-label"><BuildOutlined /> {SECTION_LABELS.experience}</div>
        {resumes.map((r) => (
          <div key={r.id} className="compare-cell">
            {(r.parsedData?.experience || []).length === 0 ? (
              <span className="empty-text">暂无工作经历</span>
            ) : (
              (r.parsedData?.experience || []).map((exp, i) => (
                <div key={i} className="compare-timeline-item">
                  <div className="compare-timeline-title">{exp.company}</div>
                  <div className="compare-timeline-sub">{exp.position}</div>
                  <div className="compare-timeline-period">{exp.period}</div>
                  <div className="compare-timeline-desc">{exp.description}</div>
                </div>
              ))
            )}
          </div>
        ))}

        {/* 项目经历 */}
        <div className="compare-label"><ProjectOutlined /> {SECTION_LABELS.projects}</div>
        {resumes.map((r) => (
          <div key={r.id} className="compare-cell">
            {(r.parsedData?.projects || []).length === 0 ? (
              <span className="empty-text">暂无项目经历</span>
            ) : (
              (r.parsedData?.projects || []).map((proj, i) => (
                <div key={i} className="compare-timeline-item">
                  <div className="compare-timeline-title">{proj.name}</div>
                  <div className="compare-timeline-sub">角色：{proj.role}</div>
                  <div className="compare-timeline-sub">
                    技术栈：{proj.techStack?.join('、')}
                  </div>
                  <div className="compare-timeline-desc">{proj.description}</div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResumeComparePage
