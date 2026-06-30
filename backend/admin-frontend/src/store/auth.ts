import { create } from 'zustand';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('admin_token'),
  user: (() => {
    try {
      const raw = localStorage.getItem('admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      // 全局 ResponseInterceptor 包装为 { code, message, data }，需解包
      const data = res.data?.data || res.data;
      const { accessToken, user } = data;
      localStorage.setItem('admin_token', accessToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({ token: accessToken, user, loading: false });
    } catch (error: any) {
      set({ loading: false });
      const msg =
        error?.response?.data?.message || '登录失败，请检查邮箱和密码';
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) return false;
    try {
      const res = await authApi.profile();
      const userData = res.data?.data || res.data;
      set({ user: userData });
      localStorage.setItem('admin_user', JSON.stringify(userData));
      return true;
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      set({ token: null, user: null });
      return false;
    }
  },
}));
