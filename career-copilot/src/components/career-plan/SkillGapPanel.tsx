import { Link } from 'react-router-dom'
import { CheckOutlined, BookOutlined, RightOutlined } from '@ant-design/icons'

export interface SkillGapPanelProps {
  possessedSkills: string[]
  targetSkills: string[]
}

export default function SkillGapPanel({ possessedSkills, targetSkills }: SkillGapPanelProps) {
  const coverage = Math.round(
    (possessedSkills.length / (possessedSkills.length + targetSkills.length)) * 100
  )

  return (
    <>
      <div className="skill-gap-section">
        <h3 className="skill-gap-title">
          <CheckOutlined className="text-success" /> 已掌握
        </h3>
        <div className="skill-gap-tags">
          {possessedSkills.map((skill) => (
            <span key={skill} className="gap-tag possessed">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="skill-gap-section">
        <h3 className="skill-gap-title">
          <BookOutlined className="text-accent" /> 待学习
        </h3>
        <div className="skill-gap-tags">
          {targetSkills.map((skill) => (
            <span key={skill} className="gap-tag target">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="skill-summary">
        <div className="summary-stat">
          <span className="summary-num">{possessedSkills.length}</span>
          <span className="summary-label">已掌握</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-num">{targetSkills.length}</span>
          <span className="summary-label">待学习</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-num highlight">
            {coverage}%
          </span>
          <span className="summary-label">技能覆盖率</span>
        </div>
      </div>

      <Link to="/career-plan/market-insight" className="market-insight-card">
        <div>
<div className="fw-600 text-heading">
             查看市场洞察
           </div>
           <div className="fs-12 text-body mt-2">
            了解岗位需求趋势和薪资范围
          </div>
        </div>
        <RightOutlined className="text-accent" />
      </Link>
    </>
  )
}
