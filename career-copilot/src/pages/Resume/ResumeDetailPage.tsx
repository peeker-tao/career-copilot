import { useState, useEffect, useCallback } from 'react'
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
import './Resume.css'

interface BasicInfo {
  name?: string
  phone?: string
  email?: string
}

interface Education {
  school: string
  major: string
  degree: string
  period: string
}

interface Experience {
  company: string
  position: string
  period: string
  description: string
}

interface Project {
  name: string
  role: string
  techStack: string[]
  description: string
}

interface ParsedData {
  basicInfo?: BasicInfo
  education?: Education[]
  experience?: Experience[]
  projects?: Project[]
  skills?: string[]
}

interface ResumeDetail {
  id: string
  title: string
  status: string
  fileUrl: string
  createdAt: string
  parsedData?: ParsedData
}

interface SkillScore {
  name: string
  score: number
}

const MOCK_RESUME_DETAIL: ResumeDetail = {
  id: '1',
  title: '小明_后端简历_2026.pdf',
  status: 'completed',
  fileUrl: '#',
  createdAt: '2026-06-15T10:30:00Z',
  parsedData: {
    basicInfo: {
      name: '小明',
      phone: '138****1234',
      email: 'xiaoming@example.com',
    },
    education: [
      { school: '华中科技大学', major: '软件工程', degree: '本科', period: '2022-2026' },
    ],
    experience: [
      {
        company: 'XX科技',
        position: '后端开发实习生',
        period: '2025.06-2025.09',
        description: '负责公司核心业务后端 API 开发与维护，使用 Spring Boot 框架实现了订单管理、用户认证等模块，日均处理请求 10万+。参与了数据库表结构设计与优化，将慢查询响应时间降低了 60%。',
      },
    ],
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git', 'RabbitMQ', 'Linux'],
    projects: [
      {
        name: '在线商城系统',
        role: '后端开发',
        techStack: ['Spring Boot', 'MySQL', 'Redis'],
        description: '独立开发了订单、支付、库存等核心微服务模块，使用 Redis 缓存热点数据，QPS 提升 3 倍。',
      },
      {
        name: '即时通讯中间件',
        role: '核心开发者',
        techStack: ['Netty', 'RabbitMQ', 'MongoDB'],
        description: '基于 Netty 实现了高性能消息推送服务，支持万人同时在线，消息延迟 < 100ms。',
      },
    ],
  },
}

const MOCK_SKILL_SCORES: SkillScore[] = [
  { name: 'Java', score: 85 },
  { name: 'Spring Boot', score: 80 },
  { name: 'MySQL', score: 75 },
  { name: 'Redis', score: 70 },
  { name: 'Docker', score: 65 },
  { name: 'Git', score: 80 },
]

const ResumeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reparsing, setReparsing] = useState(false)

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (!mounted) return
      try {
        const data = { ...MOCK_RESUME_DETAIL, id: id ?? MOCK_RESUME_DETAIL.id }
        setResume(data)
        setLoading(false)
      } catch {
        if (mounted) setError('加载简历失败')
        setLoading(false)
      }
    }, 500)
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    if (resume?.status !== 'parsing') return
    const timer = setInterval(() => {
      setResume((prev) =>
        prev?.status === 'parsing'
          ? { ...prev, status: 'completed', parsedData: MOCK_RESUME_DETAIL.parsedData }
          : prev
      )
    }, 3000)
    return () => clearInterval(timer)
  }, [resume?.status])

  const handleSaveEdit = useCallback((parsedData: ParsedData) => {
    setResume((prev) => prev ? { ...prev, parsedData } : prev)
    setShowEdit(false)
  }, [])

  const handleReparse = useCallback(async () => {
    setReparsing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setResume((prev) => prev ? { ...prev, status: 'completed' } : prev)
    setReparsing(false)
  }, [])

  const handleDelete = () => {
    setShowDelete(true)
  }

  const confirmDelete = () => {
    setShowDelete(false)
    navigate('/resume', { replace: true })
  }

  if (loading) {
    return (
      <div className="detail-page">
        <Loading skeleton={{ rows: 6 }} className="pad-24-0" />
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="detail-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="简历不存在或加载失败"
          description={error || '请检查简历 ID 是否正确'}
          actionText="返回列表"
          onAction={() => navigate('/resume')}
        />
      </div>
    )
  }

  const p = resume.parsedData || {} as ParsedData

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
            <span className="info-value">{p.basicInfo?.name || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">电话</span>
            <span className="info-value">{p.basicInfo?.phone || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">邮箱</span>
            <span className="info-value">{p.basicInfo?.email || '-'}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">
            <CodeOutlined className="section-icon" /> 技能评估
          </h3>
          <div className="radar-wrapper">
            <SkillRadar skills={MOCK_SKILL_SCORES} />
          </div>
        </div>

        <div className="detail-section full">
          <h3 className="detail-section-title">
            <BookOutlined className="section-icon" /> 教育背景
          </h3>
          {(p.education || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无教育背景信息</div>
          ) : (
            p.education!.map((edu, i) => (
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
          {(p.experience || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无工作经历信息</div>
          ) : (
            p.experience!.map((exp, i) => (
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
          {(p.projects || []).length === 0 ? (
            <div className="empty-text">暂无项目经验</div>
          ) : (
            p.projects!.map((proj, i) => (
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
          {(p.skills || []).length === 0 ? (
            <div className="empty-text">暂无技能标签</div>
          ) : (
            <div className="skills-cloud">
              {p.skills!.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditModal
          parsedData={p}
          onSave={handleSaveEdit}
          onClose={() => setShowEdit(false)}
        />
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
