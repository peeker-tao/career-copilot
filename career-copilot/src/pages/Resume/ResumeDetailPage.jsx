import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
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
  CloseOutlined,
} from '@ant-design/icons'
import { Loading, EmptyState, ConfirmModal } from '../../components/common'
import './Resume.css'

/* Mock 完整简历数据 */
const MOCK_RESUME_DETAIL = {
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

/* Mock 技能雷达评分 */
const MOCK_SKILL_SCORES = [
  { name: 'Java', score: 85 },
  { name: 'Spring Boot', score: 80 },
  { name: 'MySQL', score: 75 },
  { name: 'Redis', score: 70 },
  { name: 'Docker', score: 65 },
  { name: 'Git', score: 80 },
]

/* 编辑弹窗 */
function EditModal({ parsedData, onSave, onClose }) {
  const [form, setForm] = useState({ ...parsedData })
  const [saving, setSaving] = useState(false)

  const handleBasicChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }))
  }

  const handleSkillsChange = (value) => {
    setForm((prev) => ({
      ...prev,
      skills: value.split(',').map((s) => s.trim()).filter(Boolean),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSaving(false)
    onSave(form)
  }

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>编辑简历信息</h3>
          <button className="edit-modal-close" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        {/* 基本信息 */}
        <div className="edit-field">
          <label>姓名</label>
          <input
            value={form.basicInfo?.name || ''}
            onChange={(e) => handleBasicChange('name', e.target.value)}
          />
        </div>
        <div className="edit-field">
          <label>手机号</label>
          <input
            value={form.basicInfo?.phone || ''}
            onChange={(e) => handleBasicChange('phone', e.target.value)}
          />
        </div>
        <div className="edit-field">
          <label>邮箱</label>
          <input
            value={form.basicInfo?.email || ''}
            onChange={(e) => handleBasicChange('email', e.target.value)}
          />
        </div>

        {/* 技能标签 */}
        <div className="edit-field">
          <label>技能（逗号分隔）</label>
          <input
            value={(form.skills || []).join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value)}
          />
        </div>

        <div className="edit-modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* 技能雷达图 */
function SkillRadar({ skills }) {
  const option = useMemo(() => {
    if (!skills || skills.length === 0) return null
    return {
      radar: {
        indicator: skills.map((s) => ({ name: s.name, max: 100 })),
        center: ['50%', '50%'],
        radius: '70%',
        axisName: {
          color: 'var(--text)',
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(24, 144, 255, 0.02)', 'rgba(24, 144, 255, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: { color: 'var(--border)' },
        },
        splitLine: {
          lineStyle: { color: 'var(--border)' },
        },
      },
      series: [
        {
          type: 'radar',
          data: [{ value: skills.map((s) => s.score), name: '技能评估' }],
          symbol: 'none',
          lineStyle: { color: '#7c3aed', width: 2 },
          areaStyle: {
            color: 'rgba(124, 58, 237, 0.15)',
          },
        },
      ],
    }
  }, [skills])

  if (!option) {
    return <div className="resume-empty" style={{ padding: 40 }}>暂无技能数据</div>
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
    />
  )
}

/* 主组件 */
const ResumeDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reparsing, setReparsing] = useState(false)

  useEffect(() => {
    let mounted = true
    let pollTimer

    const load = () => {
      // 模拟 GET /resumes/:id
      setTimeout(() => {
        if (!mounted) return
        try {
          const data = { ...MOCK_RESUME_DETAIL, id }
          setResume(data)
          setLoading(false)
        } catch {
          if (mounted) setError('加载简历失败')
          setLoading(false)
        }
      }, 500)
    }

    load()
    return () => { mounted = false; clearTimeout(pollTimer) }
  }, [id])

  // 模拟解析中轮询
  useEffect(() => {
    if (resume?.status !== 'parsing') return
    const timer = setInterval(() => {
      setResume((prev) =>
        prev?.status === 'parsing'
          ? { ...prev, status: 'completed', parsedData: MOCK_RESUME_DETAIL.parsedData, skills: MOCK_RESUME_DETAIL.parsedData.skills }
          : prev
      )
    }, 3000)
    return () => clearInterval(timer)
  }, [resume?.status])

  const handleSaveEdit = useCallback((parsedData) => {
    setResume((prev) => ({ ...prev, parsedData }))
    setShowEdit(false)
  }, [])

  const handleReparse = useCallback(async () => {
    setReparsing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setResume((prev) => ({ ...prev, status: 'completed' }))
    setReparsing(false)
  }, [])

  const handleDelete = () => {
    setShowDelete(true)
  }

  const confirmDelete = () => {
    setShowDelete(false)
    navigate('/resume', { replace: true })
  }

  /* --- 加载状态 --- */
  if (loading) {
    return (
      <div className="detail-page">
        <Loading skeleton rows={6} style={{ padding: '24px 0' }} />
      </div>
    )
  }

  /* --- 错误状态 --- */
  if (error || !resume) {
    return (
      <div className="detail-page">
        <EmptyState
          icon={ExclamationCircleOutlined}
          title="简历不存在或加载失败"
          description={error || '请检查简历 ID 是否正确'}
          actionText="返回列表"
          onAction={() => navigate('/resume')}
        />
      </div>
    )
  }

  const p = resume.parsedData || {}

  /* --- 解析中状态 --- */
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
      {/* 顶部操作栏 */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-header-icon">
            <FileTextOutlined />
          </div>
          <div className="detail-header-info">
            <h1>{resume.title}</h1>
            <div className="detail-meta">
              <span className="status-badge completed">已完成</span>
              <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
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

      {/* 双栏内容 */}
      <div className="detail-content">
        {/* 基本信息 */}
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

        {/* 技能雷达图 */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <CodeOutlined className="section-icon" /> 技能评估
          </h3>
          <div className="radar-wrapper">
            <SkillRadar skills={MOCK_SKILL_SCORES} />
          </div>
        </div>

        {/* 教育背景 */}
        <div className="detail-section full">
          <h3 className="detail-section-title">
            <BookOutlined className="section-icon" /> 教育背景
          </h3>
          {(p.education || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无教育背景信息</div>
          ) : (
            p.education.map((edu, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-title">{edu.school}</div>
                <div className="timeline-sub">
                  {edu.major} · {edu.degree} · {edu.period}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 工作经历 */}
        <div className="detail-section full">
          <h3 className="detail-section-title">
            <BuildOutlined className="section-icon" /> 工作经历
          </h3>
          {(p.experience || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无工作经历信息</div>
          ) : (
            p.experience.map((exp, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-title">{exp.company} · {exp.position}</div>
                <div className="timeline-sub">{exp.period}</div>
                <div className="timeline-desc">{exp.description}</div>
              </div>
            ))
          )}
        </div>

        {/* 项目经验 */}
        <div className="detail-section full">
          <h3 className="detail-section-title">
            <ProjectOutlined className="section-icon" /> 项目经验
          </h3>
          {(p.projects || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无项目经验</div>
          ) : (
            p.projects.map((proj, i) => (
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

        {/* 技能标签云 */}
        <div className="detail-section full">
          <h3 className="detail-section-title">
            <CodeOutlined className="section-icon" /> 技能标签
          </h3>
          {(p.skills || []).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text)', padding: '8px 0' }}>暂无技能标签</div>
          ) : (
            <div className="skills-cloud">
              {p.skills.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEdit && (
        <EditModal
          parsedData={p}
          onSave={handleSaveEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* 删除确认 */}
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
