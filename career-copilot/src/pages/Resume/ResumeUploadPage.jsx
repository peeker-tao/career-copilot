import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  InboxOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import './Resume.css'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const ResumeUploadPage = () => {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedId, setUploadedId] = useState(null)

  const validateFile = useCallback((f) => {
    // 校验扩展名
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '不支持的文件格式，仅支持 PDF、DOCX'
    }
    // 校验 MIME 类型
    if (!ALLOWED_TYPES.includes(f.type) && f.type !== '') {
      // 某些浏览器可能不提供 type，所以仅用扩展名校验
    }
    // 校验大小
    if (f.size > MAX_SIZE) {
      return '文件超过 10MB 大小限制'
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f) => {
    setError(null)
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    setFile(f)
  }, [validateFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)

    // 模拟上传进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5
        return next >= 100 ? 100 : Math.min(next, 95)
      })
    }, 300)

    // 模拟 POST /resumes/upload
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500))
      clearInterval(interval)
      setProgress(100)

      // 模拟创建成功
      const newId = Date.now().toString()
      setUploadedId(newId)

      // 延迟跳转详情页
      setTimeout(() => {
        navigate(`/resume/${newId}`)
      }, 800)
    } catch {
      clearInterval(interval)
      setError('上传失败，请重试')
      setUploading(false)
    }
  }, [file, navigate])

  const resetUpload = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    setUploading(false)
    setUploadedId(null)
  }

  return (
    <div className="upload-page">
      {/* 页面头部 */}
      <div className="upload-header">
        <button
          className="detail-action-btn"
          style={{ marginBottom: 12 }}
          onClick={() => navigate('/resume')}
        >
          <ArrowLeftOutlined /> 返回列表
        </button>
        <h1 className="upload-title">上传简历</h1>
        <p className="upload-subtitle">上传你的简历文件，AI 将自动解析并提取结构化信息</p>
      </div>

      {/* 拖拽上传区域 */}
      {!file && !uploading && (
        <div
          className={`upload-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <div className="upload-dropzone-icon">
            <InboxOutlined />
          </div>
          <p className="upload-dropzone-text">点击或拖拽文件到此区域上传</p>
          <p className="upload-dropzone-hint">支持 PDF、DOCX 格式，最大 10MB</p>
          <div className="upload-dropzone-formats">
            <span className="format-badge">PDF</span>
            <span className="format-badge">DOCX</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="upload-error">
          <CloseCircleOutlined />
          <span>{error}</span>
          {file && (
            <button
              className="detail-action-btn"
              style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12 }}
              onClick={resetUpload}
            >
              重新选择
            </button>
          )}
        </div>
      )}

      {/* 已选文件 & 上传进度 */}
      {file && !uploadedId && (
        <div className="upload-progress-area">
          <div className="upload-progress-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileTextOutlined style={{ fontSize: 20, color: 'var(--accent)' }} />
              <div>
                <div className="upload-progress-name">{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <div className="upload-progress-percent">
              {uploading ? `${Math.round(progress)}%` : '就绪'}
            </div>
          </div>

          {uploading && (
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {!uploading && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn-secondary" onClick={resetUpload}>
                取消
              </button>
              <button className="btn-primary" onClick={handleUpload}>
                <UploadOutlined /> 开始上传
              </button>
            </div>
          )}

          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text)' }}>
              <LoadingOutlined style={{ marginRight: 6 }} />
              正在上传并解析...
            </div>
          )}
        </div>
      )}

      {/* 上传成功 */}
      {uploadedId && (
        <div className="upload-progress-area" style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 4px', color: 'var(--text-h)' }}>上传成功</h3>
          <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 16px' }}>
            正在跳转至简历详情页...
          </p>
        </div>
      )}
    </div>
  )
}

export default ResumeUploadPage
