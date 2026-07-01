import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftOutlined, TrophyOutlined, ExclamationCircleOutlined, FileTextOutlined, BarChartOutlined, SoundOutlined, PauseCircleFilled, LoadingOutlined } from '@ant-design/icons'
import { Loading, EmptyState } from '@/components/common'
import type { InterviewReport } from '@/types/interview'
import { getInterviewReport } from '@/api/interviews'
import { useInterviewStore } from '@/store/useInterviewStore'
import { textToSpeech } from '@/api/voice'
import { useVoiceStore } from '@/store/useVoiceStore'
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
  const [refresh, setRefresh] = useState(0) // 用于强制刷新 useEffect
  // 报告 TTS 播放状态
  const [reportTtsLoading, setReportTtsLoading] = useState(false)
  const [reportTtsPlaying, setReportTtsPlaying] = useState(false)
  const [reportTtsDuration, setReportTtsDuration] = useState(0)
  const [reportTtsCurrentTime, setReportTtsCurrentTime] = useState(0)
  const reportTtsAudioRef = useRef<HTMLAudioElement | null>(null)
  const reportTtsAnimRef = useRef<number>(0)

  useEffect(() => {
    // store 中已有报告，无需 fetch
    if (report) return
    console.log('Fetching interview report for id:', id)
    let mounted = true
    const fetchReport = async () => {
      if (!id) {
        if (mounted) setError('缺少面试 ID')
        return
      }
      try {
        const res = await getInterviewReport(id)
        console.log('Interview report fetched:', res)
        if (!mounted) return
        if (res.code !== 200 && res.code !== 201 && res.code !== 202) {
          console.error('Failed to fetch interview report:', res)
          throw new Error(res.message || '获取报告失败')
        }
        if (!res.data) {
          console.warn('No report data returned from backend for id:', id)
          setTimeout(() => setRefresh((prev) => prev + 1), 1000)
          return
        }
        setFetchedReport(res.data)
      } catch (err) {
        if (!mounted) setError((err as Error).message || '获取报告失败')
      }
    }
    fetchReport()

    return () => { mounted = false }
  }, [id, report, refresh])

  /** 格式化时间 mm:ss */
  const fmtDur = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /** 报告 TTS 进度更新 */
  const updateReportTtsProgress = () => {
    const audio = reportTtsAudioRef.current
    if (!audio) return
    setReportTtsCurrentTime(audio.currentTime)
    if (audio.currentTime < audio.duration) {
      reportTtsAnimRef.current = requestAnimationFrame(updateReportTtsProgress)
    }
  }

  /** 构建报告朗读文本 */
  const buildReportSpeechText = () => {
    const parts: string[] = []
    if (!report) return ''
    parts.push(`你的面试总体得分为${report.overallScore}分，${getScoreLevel(report.overallScore).label}。`)
    if (report.strengths.length > 0) {
      parts.push('优势方面：' + report.strengths.join('，'))
    }
    if (report.weaknesses.length > 0) {
      parts.push('待改进方面：' + report.weaknesses.join('，'))
    }
    if (report.suggestions.length > 0) {
      parts.push('学习建议：' + report.suggestions.join('，'))
    }
    if (report.skillScores.length > 0) {
      const skillTexts = report.skillScores.map(s => `${s.name}：${s.score}分`)
      parts.push('技能评分：' + skillTexts.join('，'))
    }
    if (report.summary) {
      parts.push(report.summary)
    }
    return parts.join('。')
  }

  /** 播放/暂停报告 TTS */
  const handleReportTtsPlay = async () => {
    // 如果正在播放，暂停
    if (reportTtsAudioRef.current && reportTtsPlaying) {
      reportTtsAudioRef.current.pause()
      setReportTtsPlaying(false)
      cancelAnimationFrame(reportTtsAnimRef.current)
      return
    }
    // 如果已暂停，恢复
    if (reportTtsAudioRef.current && !reportTtsPlaying) {
      reportTtsAudioRef.current.play()
      setReportTtsPlaying(true)
      reportTtsAnimRef.current = requestAnimationFrame(updateReportTtsProgress)
      return
    }
    // 生成新音频
    setReportTtsLoading(true)
    try {
      const text = buildReportSpeechText()
      const selectedVoice = useVoiceStore.getState().settings.voice
      const res = await textToSpeech(text, selectedVoice)
      const audio = new Audio(res.data.audioUrl)
      reportTtsAudioRef.current = audio
      audio.onloadedmetadata = () => setReportTtsDuration(audio.duration)
      audio.onended = () => { setReportTtsPlaying(false); setReportTtsCurrentTime(0) }
      audio.onerror = () => { setReportTtsPlaying(false); setReportTtsCurrentTime(0); setReportTtsLoading(false) }
      setReportTtsLoading(false)
      audio.play()
      setReportTtsPlaying(true)
      reportTtsAnimRef.current = requestAnimationFrame(updateReportTtsProgress)
    } catch {
      setReportTtsLoading(false)
    }
  }

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
          <div className="report-tts-bar">
            <span
              className={`report-tts-btn ${reportTtsPlaying ? 'playing' : ''}`}
              onClick={handleReportTtsPlay}
              title={reportTtsPlaying ? '暂停朗读' : '朗读报告'}
            >
              {reportTtsLoading ? <LoadingOutlined /> : reportTtsPlaying ? <PauseCircleFilled /> : <SoundOutlined />}
            </span>
            <span className={`report-tts-label ${reportTtsPlaying ? 'playing' : ''}`}>
              {reportTtsLoading ? '生成语音中...' : reportTtsPlaying ? '朗读中...' : '朗读报告'}
            </span>
            {reportTtsPlaying && (
              <span className="report-tts-timer">{fmtDur(reportTtsCurrentTime)} / {fmtDur(reportTtsDuration)}</span>
            )}
          </div>
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
        <h2 className="report-section-title"><FileTextOutlined /> 学习建议</h2>
        <ul className="report-list">
          {report.suggestions.map((s, i) => (
            <li key={i} className="report-list-item suggestion">{s}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h2 className="report-section-title"><BarChartOutlined /> 技能评分</h2>
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
