import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { UploadDropzone, UploadProgress, BatchUploadProgress } from '@/components/resume'
import type { BatchFileItem } from '@/components/resume/BatchUploadProgress'
import { useResumeStore } from '@/store/useResumeStore'
import './Resume.css'

const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_SIZE = 10 * 1024 * 1024

const ResumeUploadPage = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)
  /** true = 批量模式, false = 单个模式 */
  const [batchMode, setBatchMode] = useState(false)
  /** 批量模式下是否正在追加文件（显示 dropzone） */
  const [addingMore, setAddingMore] = useState(false)

  const uploadResume = useResumeStore((s) => s.uploadResume)
  const uploading = useResumeStore((s) => s.uploading)
  const progress = useResumeStore((s) => s.uploadProgress)
  const batchItems = useResumeStore((s) => s.batchItems)
  const batchUploading = useResumeStore((s) => s.batchUploading)
  const setBatchItems = useResumeStore((s) => s.setBatchItems)
  const batchUploadResumes = useResumeStore((s) => s.batchUploadResumes)
  const cancelBatchUpload = useResumeStore((s) => s.cancelBatchUpload)
  const resetBatch = useResumeStore((s) => s.resetBatch)
  const retryBatchItem = useResumeStore((s) => s.retryBatchItem)
  const removeBatchItem = useResumeStore((s) => s.removeBatchItem)

  const validateFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '不支持的文件格式，仅支持 PDF、DOCX'
    }
    if (f.size > MAX_SIZE) {
      return `"${f.name}" 超过 10MB 大小限制`
    }
    return null
  }, [])

  // ──── 单个上传 ────
  const handleFileSelect = useCallback((files: File[]) => {
    setError(null)
    const f = files[0]
    if (!f) return
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
      const store = useResumeStore.getState()
      setError(store.error || '上传失败，请重试')
    }
  }, [file, navigate, uploadResume])

  const resetUpload = () => {
    setFile(null)
    setError(null)
    setUploadedId(null)
  }

  // ──── 批量上传 ────
  const handleBatchFileSelect = useCallback((files: File[]) => {
    setError(null)
    const errs: string[] = []
    const validFiles: File[] = []
    files.forEach((f) => {
      const err = validateFile(f)
      if (err) errs.push(err)
      else validFiles.push(f)
    })
    if (errs.length) setError(errs.join('；'))
    if (validFiles.length === 0) return

    // 去重并转为 BatchFileItem
    const existingNames = new Set(batchItems.map((i) => i.file.name))
    const newItems: BatchFileItem[] = validFiles
      .filter((f) => !existingNames.has(f.name))
      .map((f) => ({ file: f, progress: 0, status: 'pending' as const }))

    if (newItems.length === 0) {
      setError('所选文件已全部在列表中')
      return
    }
    setBatchItems([...batchItems, ...newItems])
    setAddingMore(false)
  }, [validateFile, batchItems, setBatchItems])

  const handleBatchUpload = useCallback(() => {
    setError(null)
    batchUploadResumes()
  }, [batchUploadResumes])

  const handleBatchCancel = useCallback(() => {
    if (batchUploading) {
      cancelBatchUpload()
    } else {
      resetBatch()
      setAddingMore(false)
    }
  }, [batchUploading, cancelBatchUpload, resetBatch])

  const handleBatchRetry = useCallback((idx: number) => {
    retryBatchItem(idx)
  }, [retryBatchItem])

  const handleBatchRemove = useCallback((idx: number) => {
    removeBatchItem(idx)
  }, [removeBatchItem])

  const handleBatchAddMore = useCallback(() => {
    setAddingMore(true)
  }, [])

  const handleToggleMode = useCallback(() => {
    setBatchMode((v) => !v)
    resetUpload()
    resetBatch()
    setAddingMore(false)
  }, [resetBatch])

  const hasPending = useMemo(
    () => batchItems.some((i) => i.status === 'pending'),
    [batchItems],
  )

  // 无文件 → 展示上传区；批量模式下点击"继续添加"也展示
  const showDropzone = (!batchMode && !file && !uploading) || (batchMode && (batchItems.length === 0 || addingMore))

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button
          className="detail-action-btn mb-12"
          onClick={() => navigate('/resume')}
        >
          <ArrowLeftOutlined /> 返回列表
        </button>
        <div className="upload-header-row">
          <div>
            <h1 className="upload-title">上传简历</h1>
            <p className="upload-subtitle">
              {batchMode
                ? '批量上传多个简历，AI 将逐个解析并提取结构化信息'
                : '上传你的简历文件，AI 将自动解析并提取结构化信息'}
            </p>
          </div>
          <button className="btn-secondary" onClick={handleToggleMode} title={batchMode ? '切换为单个上传' : '切换为批量上传'}>
            <SwapOutlined /> {batchMode ? '单个上传' : '批量上传'}
          </button>
        </div>
      </div>

      {error && (!batchItems.length || addingMore) && (
        <div className="upload-error">
          <span>{error}</span>
        </div>
      )}

      {showDropzone && (
        <UploadDropzone
          onFileSelect={batchMode ? handleBatchFileSelect : handleFileSelect}
          error={error}
          multiple={batchMode}
          selectedCount={batchMode ? batchItems.length : undefined}
        />
      )}

      {!batchMode && file && (
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

      {batchMode && batchItems.length > 0 && (
        <BatchUploadProgress
          items={batchItems}
          uploading={batchUploading}
          hasPending={hasPending}
          onUpload={handleBatchUpload}
          onCancel={handleBatchCancel}
          onRetry={handleBatchRetry}
          onRemove={handleBatchRemove}
          onAddMore={handleBatchAddMore}
        />
      )}
    </div>
  )
}

export default ResumeUploadPage
