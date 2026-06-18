import {
  FileTextOutlined,
  StarOutlined,
  EyeOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons'

export interface ResumeCardProps {
  resume: {
    id: string
    title: string
    status: string
    skills: string[]
    createdAt: string
    isDefault: boolean
  }
  onView: (id: string) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: '已完成', cls: 'completed' },
  parsing: { label: '解析中', cls: 'parsing' },
  failed: { label: '解析失败', cls: 'failed' },
}

const ResumeCard = ({ resume, onView, onDelete, onSetDefault }: ResumeCardProps) => {
  const statusInfo = STATUS_CONFIG[resume.status] || { label: '未知', cls: '' }
  const displaySkills = resume.skills.slice(0, 5)
  const moreCount = resume.skills.length - 5

  return (
    <div
      className={`resume-card ${resume.isDefault ? 'resume-card-default' : ''}`}
      onClick={() => onView(resume.id)}
    >
      <div className="resume-card-top">
        <div className="resume-card-icon">
          <FileTextOutlined />
        </div>
        <span className="resume-card-date">
          {new Date(resume.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      <div className="resume-card-name">{resume.title}</div>

      <div className="resume-card-status">
        <span className={`status-badge ${statusInfo.cls}`}>
          {resume.status === 'parsing' && <LoadingOutlined className="spin-icon" />}
          {statusInfo.label}
        </span>
        {resume.isDefault && (
          <span className="status-badge completed">
            <StarOutlined /> 默认
          </span>
        )}
      </div>

      {resume.skills.length > 0 && (
        <div className="resume-card-skills">
          {displaySkills.map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
          {moreCount > 0 && (
            <span className="skill-tag-more">+{moreCount}</span>
          )}
        </div>
      )}

      <div className="resume-card-actions" onClick={(e) => e.stopPropagation()}>
        {!resume.isDefault && resume.status === 'completed' && (
          <button
            className="card-action-btn"
            onClick={() => onSetDefault(resume.id)}
            title="设为默认"
          >
            <StarOutlined />
          </button>
        )}
        <button
          className="card-action-btn"
          onClick={() => onView(resume.id)}
          title="查看详情"
        >
          <EyeOutlined />
        </button>
        <button
          className="card-action-btn danger"
          onClick={() => onDelete(resume.id)}
          title="删除"
        >
          <DeleteOutlined />
        </button>
      </div>
    </div>
  )
}

export default ResumeCard
