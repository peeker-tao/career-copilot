import { useRef, useEffect } from 'react'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from '@ant-design/icons'

export interface BatchFileItem {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  resultId?: string
}

export interface BatchUploadProgressProps {
  items: BatchFileItem[]
  /** 是否有正在上传中的 */
  uploading: boolean
  /** 是否有待上传的 */
  hasPending: boolean
  onUpload: () => void
  onCancel: () => void
  onRetry: (index: number) => void
  onRemove: (index: number) => void
  onAddMore: () => void
}

const BatchUploadProgress = ({
  items,
  uploading,
  hasPending,
  onUpload,
  onCancel,
  onRetry,
  onRemove,
  onAddMore,
}: BatchUploadProgressProps) => {
  const successCount = items.filter((i) => i.status === 'success').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const allDone = items.length > 0 && items.every((i) => i.status === 'success' || i.status === 'error')

  return (
    <div className="batch-upload-area">
      <div className="batch-upload-header">
        <span className="fs-15 fw-600 text-heading">
          {allDone
            ? `上传完成（${successCount} 成功${errorCount > 0 ? `, ${errorCount} 失败` : ''}）`
            : uploading
              ? `正在上传... (${successCount}/${items.length})`
              : `已选择 ${items.length} 个文件`}
        </span>
        <span className="fs-12 text-body">
          {items.reduce((s, i) => s + i.file.size, 0) > 1024 * 1024
            ? `${(items.reduce((s, i) => s + i.file.size, 0) / (1024 * 1024)).toFixed(1)} MB`
            : `${(items.reduce((s, i) => s + i.file.size, 0) / 1024).toFixed(0)} KB`}
        </span>
      </div>

      <div className="batch-file-list">
        {items.map((item, idx) => (
          <div key={`${item.file.name}-${idx}`} className={`batch-file-item batch-file-${item.status}`}>
            <div className="batch-file-icon">
              {item.status === 'uploading' && <LoadingOutlined className="spin-icon" />}
              {item.status === 'success' && <CheckCircleOutlined className="text-success" />}
              {item.status === 'error' && <CloseCircleOutlined className="text-danger" />}
              {item.status === 'pending' && <FileTextOutlined className="text-accent" />}
            </div>
            <div className="batch-file-info">
              <div className="batch-file-name" title={item.file.name}>{item.file.name}</div>
              {item.status === 'uploading' && (
                <div className="batch-file-progress-bar">
                  <div className="batch-file-progress-fill" data-progress={item.progress} ref={(el) => { if (el) el.style.width = `${item.progress}%` }} />
                </div>
              )}
              {item.status === 'error' && item.error && (
                <div className="batch-file-error">{item.error}</div>
              )}
              {item.status === 'pending' && (
                <div className="batch-file-meta">{(item.file.size / 1024).toFixed(0)} KB</div>
              )}
              {item.status === 'success' && (
                <div className="batch-file-meta">上传成功</div>
              )}
            </div>
            {(item.status === 'error' || item.status === 'pending') && (
              <div className="batch-file-actions">
                {item.status === 'error' && (
                  <button className="batch-file-btn" onClick={() => onRetry(idx)} title="重试">
                    重试
                  </button>
                )}
                {!uploading && (
                  <button className="batch-file-btn danger" onClick={() => onRemove(idx)} title="移除">
                    <CloseCircleOutlined />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!allDone && (
        <div className="batch-upload-footer">
          {!uploading && hasPending && (
            <button className="btn-primary flex-1" onClick={onUpload}>
              <UploadOutlined /> 全部上传
            </button>
          )}
          {!uploading && (
            <button className="btn-secondary" onClick={onAddMore}>
              继续添加
            </button>
          )}
          {uploading && (
            <button className="btn-secondary" onClick={onCancel}>
              取消
            </button>
          )}
          {!uploading && items.length > 0 && (
            <button className="btn-secondary danger" onClick={onCancel}>
              清空
            </button>
          )}
        </div>
      )}

      {allDone && (
        <div className="batch-upload-footer">
          <button className="btn-secondary" onClick={onCancel}>
            返回
          </button>
        </div>
      )}
    </div>
  )
}

export default BatchUploadProgress
