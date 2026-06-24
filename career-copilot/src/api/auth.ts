import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { AuthResult, LoginRequest, RegisterRequest, UpdateProfileRequest, UserInfo, UserStats } from '@/types/auth'
import {
  MOCK_AUTH_RESULT,
  MOCK_USER,
  MOCK_USER_STATS,
} from '@/mock'

const useMock = import.meta.env.USE_MOCK

/** 延迟辅助函数 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 注册 */
export async function register(data: RegisterRequest): Promise<ApiResponse<AuthResult>> {
  if (useMock) {
    await delay(600)
    return { code: 200, message: '注册成功', data: MOCK_AUTH_RESULT }
  }
  return apiClient.post('/auth/register', data, { __skipAuthRedirect: true })
}

/** 登录 */
export async function login(data: LoginRequest): Promise<ApiResponse<AuthResult>> {
  if (useMock) {
    await delay(500)
    return { code: 200, message: '登录成功', data: MOCK_AUTH_RESULT }
  }
  return apiClient.post('/auth/login', data, { __skipAuthRedirect: true })
}

/** 刷新 Token */
export async function refreshToken(refreshToken: string): Promise<ApiResponse<AuthResult>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '刷新成功', data: MOCK_AUTH_RESULT }
  }
  return apiClient.post('/auth/refresh', { refreshToken })
}

/** 获取用户信息 */
export async function getProfile(): Promise<ApiResponse<UserInfo>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: 'success', data: MOCK_USER }
  }
  return apiClient.get('/auth/profile')
}

/** 更新用户信息 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserInfo>> {
  if (useMock) {
    await delay(600)
    return { code: 200, message: '更新成功', data: { ...MOCK_USER, ...data } }
  }
  return apiClient.patch('/auth/profile', data)
}

/** 获取用户统计（首页仪表盘数据） */
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: 'success', data: MOCK_USER_STATS }
  }
  try {
    // 调用 /dashboard 接口获取首页概览数据
    const response: any = await apiClient.get('/dashboard')
    
    // 从响应中提取 stats，并映射字段名
    const apiStats = response.data?.stats
    if (apiStats) {
      const stats: UserStats = {
        totalInterviews: apiStats.totalInterviews ?? 0,
        avgScore: apiStats.averageScore ?? 0, // API 返回 averageScore，映射为 avgScore
        resumeCount: apiStats.totalResumes ?? 0, // API 返回 totalResumes，映射为 resumeCount
        activePlans: apiStats.activePlans ?? 0,
      }
      return {
        code: response.code || 200,
        message: response.message || 'success',
        data: stats,
      }
    }
    
    // 返回默认值
    return {
      code: 200,
      message: 'success',
      data: { totalInterviews: 0, avgScore: 0, resumeCount: 0, activePlans: 0 },
    }
  } catch (err) {
    console.warn('获取统计数据失败，使用默认值:', err)
    // 接口不可用时返回默认值，不中断应用
    return {
      code: 200,
      message: 'success',
      data: { totalInterviews: 0, avgScore: 0, resumeCount: 0, activePlans: 0 },
    }
  }
}
