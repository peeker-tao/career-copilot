import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftOutlined, TrophyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Loading, EmptyState } from '@/components/common'
import type { InterviewReport } from '@/types/interview'
import './InterviewReport.css'

const MOCK_REPORT: InterviewReport = {
  overallScore: 85,
  strengths: [
    '对 Java 基础知识和集合框架理解深入',
    '算法与数据结构基础扎实',
    '沟通表达清晰，逻辑性强',
  ],
  weaknesses: [
    '分布式系统实践经验不足',
    '对微服务架构的理解需要加强',
  ],
  suggestions: [
    '建议深入学习 Spring Cloud 微服务架构',
    '参与开源项目积累分布式系统经验',
    '多练习系统设计类题目',
  ],
  skillScores: [
    { name: 'Java', score: 90 },
    { name: 'Spring Boot', score: 85 },
    { name: 'MySQL', score: 80 },
    { name: 'Redis', score: 75 },
    { name: '分布式', score: 60 },
    { name: '系统设计', score: 65 },
  ],
}

const getScoreLevel = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: '优秀', color: '#22c55e' }
  if (score >= 80) return { label: '良好', color: '#3b82f6' }
  if (score >= 70) return { label: '中等', color: '#eab308' }
  return { label: '需加强', color: '#ef4444' }
}

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setTimeout(() => {
      if (!mounted) return
      setReport(MOCK_REPORT)
      setLoading(false)
    }, 800)
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="report-page">
        <Loading skeleton={{ rows: 8 }} className="pad-24-0" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="report-page">
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="报告加载失败"
          description={error || '无法获取面试报告'}
          actionText="返回面试列表"
          onAction={() => navigate('/interview')}
        />
      </div>
    )
  }

  const scoreLevel = getScoreLevel(report.overallScore)

  return (
    <div className="report-page">
      <Link to="/interview" className="report-back">
        <ArrowLeftOutlined /> 返回面试列表
      </Link>

      <div className="report-header">
        <div className="report-score-ring">
          <div className="score-circle" style={{ borderColor: scoreLevel.color }}>
            <span className="score-value" style={{ color: scoreLevel.color }}>
              {report.overallScore}
            </span>
            <span className="score-label" style={{ color: scoreLevel.color }}>
              {scoreLevel.label}
            </span>
          </div>
        </div>
        <div className="report-header-text">
          <h1 className="report-title">面试报告</h1>
          <p className="report-desc">模拟面试已完成，以下是你的表现分析</p>
        </div>
      </div>

      <div className="report-section">
        <h2 className="report-section-title">
          <TrophyOutlined className="text-success" style={{ marginRight: 8 }} />
          优势
        </h2>
        <ul className="report-list">
          {report.strengths.map((s, i) => (
            <li key={i} className="report-list-item strength">{s}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h2 className="report-section-title">
          <ExclamationCircleOutlined className="text-warning" style={{ marginRight: 8 }} />
          待改进
        </h2>
        <ul className="report-list">
          {report.weaknesses.map((w, i) => (
            <li key={i} className="report-list-item weakness">{w}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h2 className="report-section-title">📝 学习建议</h2>
        <ul className="report-list">
          {report.suggestions.map((s, i) => (
            <li key={i} className="report-list-item suggestion">{s}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h2 className="report-section-title">📊 技能评分</h2>
        <div className="skill-bars">
          {report.skillScores.map((skill) => (
            <div key={skill.name} className="skill-bar-item">
              <div className="skill-bar-header">
                <span className="skill-bar-name">{skill.name}</span>
                <span className="skill-bar-score">{skill.score}分</span>
              </div>
              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill"
                  style={{
                    width: `${skill.score}%`,
                    backgroundColor:
                      skill.score >= 80 ? '#22c55e' :
                      skill.score >= 70 ? '#3b82f6' :
                      skill.score >= 60 ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="report-actions">
        <button className="btn-primary" onClick={() => navigate('/interview')}>
          再来一次
        </button>
        <button className="btn-secondary" onClick={() => navigate('/career-plan')}>
          查看学习规划
        </button>
      </div>
    </div>
  )
}
