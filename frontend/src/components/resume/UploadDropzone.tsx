import { useRef, useState, useCallback } from 'react'
import { InboxOutlined } from '@ant-design/icons'

export interface UploadDropzoneProps {
  onFileSelect: (files: File[]) => void
  error?: string | null
  /** 是否允许多选，默认 false */
  multiple?: boolean
  /** 已选文件数（批量模式下回传展示用） */
  selectedCount?: number
}

const UploadDropzone = ({ onFileSelect, multiple = false, selectedCount }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = multiple
      ? Array.from(e.dataTransfer.files ?? [])
      : (e.dataTransfer.files?.[0] ? [e.dataTransfer.files[0]] : [])
    if (files.length) onFileSelect(files)
  }, [onFileSelect, multiple])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFileSelect(files)
    // reset so re-selecting same file works
    if (inputRef.current) inputRef.current.value = ''
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
      <p className="upload-dropzone-text">
        {multiple ? '点击或拖拽多个文件到此区域批量上传' : '点击或拖拽文件到此区域上传'}
      </p>
      <p className="upload-dropzone-hint">支持 PDF、DOCX 格式，最大 10MB{multiple ? '，可同时选择多个' : ''}</p>
      <div className="upload-dropzone-formats">
        <span className="format-badge">PDF</span>
        <span className="format-badge">DOCX</span>
      </div>
      {(selectedCount ?? 0) > 0 && (
        <p className="upload-dropzone-count">
          已选择 {selectedCount} 个文件
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden-input"
        title="选择简历文件"
        onChange={handleInputChange}
      />
    </div>
  )
}

export default UploadDropzone
