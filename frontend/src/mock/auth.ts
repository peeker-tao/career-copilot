import type { UserInfo, UserStats, AuthResult } from '@/types/auth'

export const MOCK_USER: UserInfo = {
  id: '1',
  avatar: '',
  name: '求职者',
  email: 'user@example.com',
  phone: '138****8888',
  education: '华中科技大学 · 软件工程 · 本科',
  targetPosition: '后端开发工程师',
  bio: '热爱编程，正在为梦想努力 💪',
  role: 'user',
  createdAt: '2026-01-15',
}

export const MOCK_USER_STATS: UserStats = {
  totalInterviews: 12,
  avgScore: 86.5,
  resumeCount: 3,
  activePlans: 2,
}

export const MOCK_AUTH_RESULT: AuthResult = {
  user: MOCK_USER,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}
