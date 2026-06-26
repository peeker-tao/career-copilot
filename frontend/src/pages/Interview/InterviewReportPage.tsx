import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftOutlined, TrophyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Loading, EmptyState } from '@/components/common'
import type { InterviewReport } from '@/types/interview'
import { getInterviewReport } from '@/api/interviews'
import { useInterviewStore } from '@/store/useInterviewStore'
import './InterviewReport.css'

const getScoreLevel = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: '优秀', color: '#22c55e' }
  if (score >= 80) return { label: '良好', color: '#3b82f6' }
  if (score >= 70) return { label: '中等', color: '#eab308' }
  return { label: '需加强', color: '#ef4444' }
}

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const storedReport = useInterviewStore((s) => s.report)
  const [fetchedReport, setFetchedReport] = useState<InterviewReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  // store 中有就用 store 的（自动生成），否则用本地 fetch 的
  const report = storedReport || fetchedReport
  const loading = !report && !error

  useEffect(() => {
    // store 中已有报告，无需 fetch
    if (storedReport) return

    let mounted = true
    const fetchReport = async () => {
      if (!id) {
        if (mounted) setError('缺少面试 ID')
        return
      }
      try {
        const res = await getInterviewReport(id)
        if (!mounted) return
        if (res.code !== 200 && res.code !== 201) {
          throw new Error(res.message || '获取报告失败')
        }
        setFetchedReport(res.data)
      } catch (err) {
        if (!mounted) setError((err as Error).message || '获取报告失败')
      }
    }
    fetchReport()

    return () => { mounted = false }
  }, [id, storedReport])

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
        <button className="btn-primary" onClick={() => navigate(`/interview/${id}`)}>
          查看聊天记录
        </button>
        <button className="btn-secondary" onClick={() => navigate('/interview')}>
          再来一次
        </button>
        <button className="btn-secondary" onClick={() => navigate('/career-plan')}>
          查看学习规划
        </button>
      </div>
    </div>
  )
}
