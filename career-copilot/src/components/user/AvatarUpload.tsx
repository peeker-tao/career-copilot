import { useRef, useState } from 'react'
import { UserOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons'

export interface AvatarUploadProps {
  avatar: string
  nickname: string
  onUpload: (url: string) => void
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ avatar, nickname, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(avatar)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      onUpload?.(URL.createObjectURL(file))
    }, 800)
  }

  return (
    <div className="avatar-wrapper" onClick={handleClick}>
      {uploading ? (
        <div className="avatar-uploading">
          <LoadingOutlined />
        </div>
      ) : preview ? (
        <img src={preview} alt={nickname} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">
          <UserOutlined />
        </div>
      )}
      <div className="avatar-overlay">
        <CameraOutlined />
        <span>更换头像</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden-input"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default AvatarUpload
