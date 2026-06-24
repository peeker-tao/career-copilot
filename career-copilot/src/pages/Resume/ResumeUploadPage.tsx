import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { UploadDropzone, UploadProgress } from '@/components/resume'
import { useResumeStore } from '@/store/useResumeStore'
import './Resume.css'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_SIZE = 10 * 1024 * 1024

const ResumeUploadPage = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)

  const uploadResume = useResumeStore((s) => s.uploadResume)
  const uploading = useResumeStore((s) => s.uploading)
  const progress = useResumeStore((s) => s.uploadProgress)

  const validateFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '不支持的文件格式，仅支持 PDF、DOCX'
    }
    if (!ALLOWED_TYPES.includes(f.type) && f.type !== '') {
    }
    if (f.size > MAX_SIZE) {
      return '文件超过 10MB 大小限制'
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    setError(null)
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    setFile(f)
  }, [validateFile])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setError(null)
    const newId = await uploadResume(file)
    if (newId) {
      setUploadedId(newId)
      setTimeout(() => navigate(`/resume/${newId}`), 800)
    } else {
      // 上传失败——读取 store 中的最新错误（闭包安全）
      const store = useResumeStore.getState()
      setError(store.error || '上传失败，请重试')
    }
  }, [file, navigate, uploadResume])

  const resetUpload = () => {
    setFile(null)
    setError(null)
    setUploadedId(null)
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button
          className="detail-action-btn mb-12"
          onClick={() => navigate('/resume')}
        >
          <ArrowLeftOutlined /> 返回列表
        </button>
        <h1 className="upload-title">上传简历</h1>
        <p className="upload-subtitle">上传你的简历文件，AI 将自动解析并提取结构化信息</p>
      </div>

      {!file && !uploading && (
        <UploadDropzone onFileSelect={handleFileSelect} error={error} />
      )}

      {file && (
        <UploadProgress
          file={file}
          uploading={uploading}
          progress={progress}
          uploadedId={uploadedId}
          onCancel={resetUpload}
          onUpload={handleUpload}
          error={error}
          onReset={resetUpload}
        />
      )}
    </div>
  )
}

export default ResumeUploadPage
