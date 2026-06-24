import { create } from 'zustand'
import type { UserInfo, UserStats } from '@/types/auth'
import * as authApi from '@/api/auth'

interface AuthState {
  user: UserInfo | null
  stats: UserStats | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  fetchStats: () => Promise<void>
  updateProfile: (data: Partial<UserInfo>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  stats: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.login({ email, password })
      const { user, accessToken, refreshToken } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, isAuthenticated: true, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.register({ email, password, name })
      const { user, accessToken, refreshToken } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, isAuthenticated: true, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false, stats: null })
  },

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.getProfile()
      set({ user: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchStats: async () => {
    try {
      const res = await authApi.getUserStats()
      set({ stats: res.data })
    } catch {
      // Stats 加载失败不阻塞 UI
      set({ stats: null })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.updateProfile(data as import('@/types/auth').UpdateProfileRequest)
      set({ user: res.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
