import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { AuthResult, LoginRequest, RegisterRequest, UpdateProfileRequest, UserInfo, UserStats } from '@/types/auth'
import {
  MOCK_AUTH_RESULT,
  MOCK_USER,
  MOCK_USER_STATS,
} from '@/mock'

const useMock = import.meta.env.DEV

/** 延迟辅助函数 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 注册 */
export async function register(data: RegisterRequest): Promise<ApiResponse<AuthResult>> {
  if (useMock) {
    await delay(600)
    return { code: 200, message: '注册成功', data: MOCK_AUTH_RESULT }
  }
  return apiClient.post('/auth/register', data)
}

/** 登录 */
export async function login(data: LoginRequest): Promise<ApiResponse<AuthResult>> {
  if (useMock) {
    await delay(500)
    return { code: 200, message: '登录成功', data: MOCK_AUTH_RESULT }
  }
  return apiClient.post('/auth/login', data)
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

/** 获取用户统计 */
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: 'success', data: MOCK_USER_STATS }
  }
  return apiClient.get('/auth/stats')
}
