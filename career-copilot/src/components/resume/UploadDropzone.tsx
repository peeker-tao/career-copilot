import { useRef, useState, useCallback } from 'react'
import { InboxOutlined } from '@ant-design/icons'

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  error?: string | null
}

const UploadDropzone = ({ onFileSelect }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFileSelect(f)
  }, [onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFileSelect(f)
  }, [onFileSelect])

  return (
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
        className="hidden-input"
        onChange={handleInputChange}
      />
    </div>
  )
}

export default UploadDropzone
