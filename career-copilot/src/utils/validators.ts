import { ALLOWED_RESUME_EXTENSIONS, MAX_RESUME_SIZE } from './constants'

/** 校验简历文件 */
export function validateResumeFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
    return '不支持的文件格式，仅支持 PDF、DOCX'
  }
  if (file.size > MAX_RESUME_SIZE) {
    return '文件超过 10MB 大小限制'
  }
  return null
}

/** 校验邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** 校验密码强度（至少6位） */
export function isValidPassword(password: string): boolean {
  return password.length >= 6
}
