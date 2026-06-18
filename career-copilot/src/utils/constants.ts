/** 难度映射 */
export const DIFFICULTY_MAP = {
  easy: { label: '简单', cls: 'easy' },
  medium: { label: '中等', cls: 'medium' },
  hard: { label: '困难', cls: 'hard' },
} as const

/** 面试状态映射 */
export const STATUS_MAP = {
  completed: { label: '已完成', cls: 'completed' },
  interrupted: { label: '未完成', cls: 'interrupted' },
  pending: { label: '待开始', cls: 'pending' },
  in_progress: { label: '进行中', cls: 'in_progress' },
} as const

/** 简历状态映射 */
export const RESUME_STATUS_CONFIG = {
  completed: { label: '已完成', cls: 'completed' },
  parsing: { label: '解析中', cls: 'parsing' },
  failed: { label: '解析失败', cls: 'failed' },
} as const

/** 资源类型颜色映射 */
export const RESOURCE_TYPE_COLORS: Record<string, string> = {
  文档: '#1890ff',
  视频: '#52c41a',
  书籍: '#7c3aed',
}

/** 允许上传的简历文件类型 */
export const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/** 允许上传的简历扩展名 */
export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx']

/** 简历最大上传大小（10MB） */
export const MAX_RESUME_SIZE = 10 * 1024 * 1024
