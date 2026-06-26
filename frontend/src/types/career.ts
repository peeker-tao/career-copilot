/** 学习阶段 */
export interface StudyStage {
  id: string
  title: string
  duration: string
  goal: string
  resources: Resource[]
  learned: boolean
}

/** 学习资源 */
export interface Resource {
  name: string
  type: '文档' | '视频' | '书籍'
  url: string
}

/** 职业规划 */
export interface CareerPlan {
  id: string
  targetPosition: string
  progress: number
  createdAt: string
  possessedSkills: string[]
  targetSkills: string[]
  stages: StudyStage[]
}

/** 规划摘要（列表项） */
export interface CareerPlanSummary {
  id: string
  targetPosition: string
  progress: number
  createdAt: string
  skills?: string[]
}

/** 薪资范围 */
export interface SalaryRange {
  position: string
  min: number
  max: number
}

/** 技能需求 */
export interface SkillDemand {
  name: string
  count: number
}

/** 经验分布 */
export interface ExperienceDistribution {
  name: string
  value: number
}

/** 市场洞察数据 */
export interface MarketInsight {
  salary: SalaryRange[]
  trend: number[]
  topSkills: SkillDemand[]
  experienceDistribution: ExperienceDistribution[]
}
