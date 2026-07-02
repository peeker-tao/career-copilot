import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：自动携带 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 自动跳转登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

/* ====== 认证 API ====== */
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  profile: () => api.get('/auth/profile'),
};

/* ====== 用户管理 API ====== */
export const userApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  get: (id: string) => api.get(`/admin/users/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}`, data),
  remove: (id: string) => api.delete(`/admin/users/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
};

/* ====== 简历管理 API ====== */
export const resumeApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/resumes', { params }),
  get: (id: string) => api.get(`/admin/resumes/${id}`),
  remove: (id: string) => api.delete(`/admin/resumes/${id}`),
};

/* ====== 面试管理 API ====== */
export const interviewApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/interviews', { params }),
  get: (id: string) => api.get(`/admin/interviews/${id}`),
};

/* ====== 职业规划 API ====== */
export const careerPlanApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/career-plans', { params }),
};

/* ====== 题库 API ====== */
export const questionApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get('/admin/question-bank', { params }),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/question-bank', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/question-bank/${id}`, data),
  remove: (id: string) => api.delete(`/admin/question-bank/${id}`),
  generate: (data: { position?: string; category?: string; difficulty?: string; type?: string; count?: number }) =>
    api.post('/question-bank/generate', data),
};

/* ====== 学习资源 API ====== */
export const resourceApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get('/admin/learning-resources', { params }),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/learning-resources', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/learning-resources/${id}`, data),
  remove: (id: string) => api.delete(`/admin/learning-resources/${id}`),
  generate: (data: { topic: string; count?: number }) =>
    api.post('/admin/learning-resources/generate', data),
};

/* ====== Dashboard 统计 API ====== */
export const dashboardApi = {
  stats: () => api.get('/admin/dashboard'),
};
