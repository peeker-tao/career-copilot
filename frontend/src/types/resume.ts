/** 简历状态 */
export type ResumeStatus = 'parsing' | 'completed' | 'failed'

/** 简历摘要（列表项） */
export interface ResumeSummary {
  id: string
  title: string
  status: ResumeStatus
  skills: string[]
  createdAt: string
  isDefault?: boolean
  /** 解析出的姓名，未知时为 null */
  name?: string | null
  /** 解析出的电话，未知时为 null */
  phone?: string | null
  /** 解析出的邮箱，未知时为 null */
  email?: string | null
}

/** 教育经历 */
export interface Education {
  school: string
  major: string
  degree: string
  period: string
}

/** 工作经历 */
export interface Experience {
  company: string
  position: string
  period: string
  description: string
}

/** 项目经历 */
export interface Project {
  name: string
  role: string
  techStack: string[]
  description: string
}

/** 简历解析数据 */
export interface ParsedResumeData {
  basicInfo: {
    name: string
    phone: string
    email: string
  }
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: string[]
}

/** 简历详情 */
export interface ResumeDetail extends ResumeSummary {
  fileUrl?: string
  parsedData?: ParsedResumeData
}

/** 技能评分（雷达图） */
export interface SkillScore {
  name: string
  score: number
}
