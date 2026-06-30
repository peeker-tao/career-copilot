import { useState } from 'react'
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import * as screeningApi from '@/api/screening'
import type { BenchmarkStats, EvaluationResult } from '@/api/screening'
import Loading from '@/components/common/Loading'
import './Resume.css'

const ROLE_OPTIONS = ['Software Engineer', 'Data Scientist', 'Cybersecurity Analyst', 'Java Developer']

export default function ScreeningPage() {
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const [jsonRecords, setJsonRecords] = useState('')
  const [jsonLoading, setJsonLoading] = useState(false)
  const [jsonResult, setJsonResult] = useState<string | null>(null)

  const [stats, setStats] = useState<BenchmarkStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  const [evalRole, setEvalRole] = useState('')
  const [evalSkills, setEvalSkills] = useState('')
  const [evalExp, setEvalExp] = useState('3')
  const [evalEdu, setEvalEdu] = useState('本科')
  const [evalCerts, setEvalCerts] = useState('')
  const [evalProjects, setEvalProjects] = useState('5')
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null)

  const handleSeed = async () => {
    setSeedLoading(true)
    setSeedResult(null)
    try {
      const res = await screeningApi.seedBenchmarks()
      setSeedResult(res.data?.message || `已导入 ${res.data?.imported} 条记录`)
    } catch {
      setSeedResult('种子数据导入失败')
    } finally {
      setSeedLoading(false)
    }
  }

  const handleLoadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await screeningApi.getBenchmarkStats(selectedRole || undefined)
      setStats(res.data)
    } catch {
      setStats([])
    } finally {
      setStatsLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!evalRole.trim() || !evalSkills.trim()) return
    setEvalLoading(true)
    setEvalResult(null)
    try {
      const res = await screeningApi.evaluateCandidate({
        jobRole: evalRole.trim(),
        skills: evalSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceYears: Number(evalExp) || 0,
        education: evalEdu,
        certifications: evalCerts.trim() || undefined,
        projectsCount: Number(evalProjects) || 0,
      })
      setEvalResult(res.data)
    } catch {
    } finally {
      setEvalLoading(false)
    }
  }

  return (
    <div className="resume-page">
      <h1 className="page-title">AI 简历筛选基准测试</h1>
      <p className="page-desc">导入基准数据集，评估 AI 简历筛选准确率</p>

      {/* 种子数据 */}
      <div className="rs-recommend-section" style={{ marginBottom: 20 }}>
        <div className="rs-recommend-header">
          <h3><DatabaseOutlined /> 种子数据</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          从 CSV 数据集导入 1000 条岗位筛选基准记录
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="qb-btn-primary" disabled={seedLoading} onClick={handleSeed}>
            <DatabaseOutlined /> {seedLoading ? '导入中...' : '导入种子数据'}
          </button>
          {seedResult && (
            <span style={{ fontSize: 13, color: seedResult.includes('失败') ? 'var(--danger)' : 'var(--success)' }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} />{seedResult}
            </span>
          )}
        </div>
      </div>

      {/* JSON 导入 */}
      <div className="rs-recommend-section" style={{ marginBottom: 20 }}>
        <div className="rs-recommend-header">
          <h3><UploadOutlined /> JSON 数据导入</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          服务端缺少 CSV 文件时，可直接粘贴 JSON 格式的基准记录（绕过文件系统路径问题）
        </p>
        <textarea
          style={{
            width: '100%', minHeight: 120, padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontFamily: 'Consolas, monospace', color: 'var(--text-h)',
            background: 'var(--bg)', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', marginBottom: 10,
          }}
          placeholder={'[\n  {\n    "resumeId": 1,\n    "name": "张三",\n    "skills": ["Python","TensorFlow"],\n    "experienceYears": 5,\n    "education": "硕士",\n    "jobRole": "Software Engineer",\n    "recruiterDecision": "Hire",\n    "salaryExpectation": 120000,\n    "projectsCount": 8,\n    "aiScore": 85\n  }\n]'}
          value={jsonRecords}
          onChange={(e) => setJsonRecords(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="qb-btn-primary" disabled={!jsonRecords.trim() || jsonLoading} onClick={async () => {
            setJsonLoading(true)
            setJsonResult(null)
            try {
              const records = JSON.parse(jsonRecords)
              if (!Array.isArray(records)) throw new Error('必须是数组')
              const res = await screeningApi.importBenchmarks(records)
              setJsonResult(res.data?.message || `已导入 ${res.data?.imported} 条`)
            } catch (err) {
              setJsonResult('导入失败: ' + ((err as Error).message || 'JSON 格式错误'))
            } finally {
              setJsonLoading(false)
            }
          }}>
            <UploadOutlined /> {jsonLoading ? '导入中...' : '导入 JSON 数据'}
          </button>
          {jsonResult && (
            <span style={{ fontSize: 13, color: jsonResult.includes('失败') ? 'var(--danger)' : 'var(--success)' }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} />{jsonResult}
            </span>
          )}
        </div>
      </div>

      {/* 基准统计 */}
      <div className="rs-recommend-section" style={{ marginBottom: 20 }}>
        <div className="rs-recommend-header">
          <h3><BarChartOutlined /> 基准统计</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="qb-gen-field">
            <label className="qb-gen-label">筛选岗位</label>
            <select className="qb-gen-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">全部岗位</option>
              {ROLE_OPTIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <button className="qb-btn-primary" disabled={statsLoading} onClick={handleLoadStats}>
            <ReloadOutlined /> {statsLoading ? '加载中...' : '加载统计'}
          </button>
        </div>
        {stats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.map((s) => (
              <div key={s.jobRole} className="qb-gen-item" style={{ cursor: 'default' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>{s.jobRole}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text)' }}>
                  <span>总数: <strong>{s.total}</strong></span>
                  <span>平均分: <strong>{s.avgAiScore}</strong></span>
                  <span>最低: <strong>{s.minScore}</strong></span>
                  <span>最高: <strong>{s.maxScore}</strong></span>
                </div>
                {s.decisionDistribution && Object.keys(s.decisionDistribution).length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    决策分布: {Object.entries(s.decisionDistribution).map(([k, v]) => (
                      <span key={k} className="qb-tag" style={{ marginLeft: 4 }}>{k}: {v}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 评估测试 */}
      <div className="rs-recommend-section">
        <div className="rs-recommend-header">
          <h3><ThunderboltOutlined /> AI 评估测试</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="qb-gen-field">
            <label className="qb-gen-label">岗位</label>
            <input className="qb-gen-input" style={{ minWidth: 180 }} placeholder="如 Software Engineer" value={evalRole} onChange={(e) => setEvalRole(e.target.value)} list="eval-roles" />
            <datalist id="eval-roles">{ROLE_OPTIONS.map((r) => (<option key={r} value={r} />))}</datalist>
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">技能（逗号分隔）</label>
            <input className="qb-gen-input" style={{ minWidth: 200 }} placeholder="Python, TensorFlow, NLP" value={evalSkills} onChange={(e) => setEvalSkills(e.target.value)} />
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">经验（年）</label>
            <input className="qb-gen-input short" type="number" min={0} max={30} value={evalExp} onChange={(e) => setEvalExp(e.target.value)} />
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">学历</label>
            <select className="qb-gen-select" value={evalEdu} onChange={(e) => setEvalEdu(e.target.value)}>
              <option value="高中">高中</option><option value="大专">大专</option><option value="本科">本科</option><option value="硕士">硕士</option><option value="博士">博士</option>
            </select>
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">证书</label>
            <input className="qb-gen-input" style={{ minWidth: 140 }} placeholder="如 AWS, PMP" value={evalCerts} onChange={(e) => setEvalCerts(e.target.value)} />
          </div>
          <div className="qb-gen-field">
            <label className="qb-gen-label">项目数</label>
            <input className="qb-gen-input short" type="number" min={0} max={50} value={evalProjects} onChange={(e) => setEvalProjects(e.target.value)} />
          </div>
          <button className="qb-btn-primary" disabled={!evalRole.trim() || !evalSkills.trim() || evalLoading} onClick={handleEvaluate}>
            <ThunderboltOutlined /> {evalLoading ? '评估中...' : '评估'}
          </button>
        </div>

        {evalLoading && <Loading skeleton={{ rows: 4 }} className="pad-24-0" />}

        {evalResult && !evalLoading && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700,
                background: evalResult.evaluation.overallScore >= 80 ? 'var(--success-bg)' : evalResult.evaluation.overallScore >= 60 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                color: evalResult.evaluation.overallScore >= 80 ? 'var(--success)' : evalResult.evaluation.overallScore >= 60 ? 'var(--warning)' : 'var(--danger)',
              }}>
                {evalResult.evaluation.overallScore}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>综合评分</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  推荐决策: <strong style={{
                    color: evalResult.evaluation.recommendation === 'hire' ? 'var(--success)' : evalResult.evaluation.recommendation === 'review' ? 'var(--warning)' : 'var(--danger)',
                  }}>{evalResult.evaluation.recommendation === 'hire' ? '录用' : evalResult.evaluation.recommendation === 'review' ? '待定' : '不录用'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: '技能匹配', score: evalResult.evaluation.skillMatch },
                { label: '经验相关', score: evalResult.evaluation.experienceRelevance },
                { label: '教育适配', score: evalResult.evaluation.educationFit },
              ].map((d) => (
                <div key={d.label} style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{d.label}</div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg)' }}>
                    <div style={{ width: `${d.score}%`, height: '100%', borderRadius: 4, background: 'var(--accent-gradient-strong)' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{d.score}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text)' }}>
              {evalResult.evaluation.strengths?.length > 0 && (
                <div><span style={{ color: 'var(--success)', fontWeight: 600 }}>优势:</span> {evalResult.evaluation.strengths.join('、')}</div>
              )}
              {evalResult.evaluation.weaknesses?.length > 0 && (
                <div><span style={{ color: 'var(--danger)', fontWeight: 600 }}>不足:</span> {evalResult.evaluation.weaknesses.join('、')}</div>
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              {evalResult.evaluation.comment}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}