import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'

export interface UploadProgressProps {
  file: File
  uploading: boolean
  progress: number
  uploadedId: string | null
  onCancel: () => void
  onUpload: () => void
  error?: string | null
  onReset: () => void
}

const UploadProgress = ({
  file,
  uploading,
  progress,
  uploadedId,
  onCancel,
  onUpload,
  error,
  onReset,
}: UploadProgressProps) => {
  if (uploadedId) {
    return (
      <div className="upload-progress-area text-center">
        <CheckCircleOutlined className="fs-40 text-success mb-12" />
        <h3 className="m-0 mb-4 text-heading">上传成功</h3>
        <p className="fs-13 text-body m-0 mb-16">
          正在跳转至简历详情页...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="upload-progress-area">
        <div className="upload-progress-info">
          <div className="flex items-center gap-10">
            <FileTextOutlined className="fs-20 text-accent" />
            <div>
              <div className="upload-progress-name">{file.name}</div>
              <div className="fs-12 text-body">
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
          <div className="flex gap-10 justify-end mt-8">
            <button className="btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button className="btn-primary" onClick={onUpload}>
              <UploadOutlined /> 开始上传
            </button>
          </div>
        )}

        {uploading && (
          <div className="text-center mt-8 fs-13 text-body">
            <LoadingOutlined className="mr-6" />
            正在上传并解析...
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <CloseCircleOutlined />
          <span>{error}</span>
          <button
            className="detail-action-btn ml-auto fs-12" style={{ padding: '4px 12px' }}
            onClick={onReset}
          >
            重新选择
          </button>
        </div>
      )}
    </>
  )
}

export default UploadProgress
