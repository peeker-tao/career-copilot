/* ====== 用户 ====== */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  phone?: string;
  education?: string;
  targetPosition?: string;
  targetIndustry?: string;
  createdAt: string;
  updatedAt: string;
}

/* ====== 简历 ====== */
export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  status: string;
  parsedData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'name'>;
}

/* ====== 面试 ====== */
export interface Interview {
  id: string;
  userId: string;
  position: string;
  type: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'name'>;
}

export interface InterviewMessage {
  id: string;
  interviewId: string;
  role: string;
  content: string;
  createdAt: string;
}

/* ====== 职业规划 ====== */
export interface CareerPlan {
  id: string;
  userId: string;
  title: string;
  content?: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'name'>;
}

/* ====== 题库 ====== */
export interface QuestionBank {
  id: string;
  question: string;
  answer?: string;
  category: string;
  difficulty: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

/* ====== 学习资源 ====== */
export interface LearningResource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  category: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

/* ====== 分页响应 ====== */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ====== 统计数据 (Dashboard) ====== */
export interface DashboardStats {
  userCount: number;
  resumeCount: number;
  interviewCount: number;
  careerPlanCount: number;
  questionCount: number;
  recentUsers: User[];
  dailyStats: { date: string; count: number }[];
}
