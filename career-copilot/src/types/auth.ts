/** 用户信息 */
export interface UserInfo {
  id: string
  email: string
  name: string
  avatar?: string | null
  phone?: string
  education?: string | null
  targetPosition?: string | null
  bio?: string
  role: 'user' | 'admin'
  createdAt: string
}

/** 认证结果 */
export interface AuthResult {
  user: UserInfo
  accessToken: string
  refreshToken: string
}

/** 注册请求 */
export interface RegisterRequest {
  email: string
  password: string
  name: string
}

/** 登录请求 */
export interface LoginRequest {
  email: string
  password: string
}

/** 更新资料请求 */
export interface UpdateProfileRequest {
  name?: string
  avatar?: string
  education?: string
  targetPosition?: string
  bio?: string
}

/** 用户统计 */
export interface UserStats {
  totalInterviews: number
  avgScore: number
  resumeCount: number
  activePlans: number
}
