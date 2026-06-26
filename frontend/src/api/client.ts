import axios from 'axios'
import { toast } from '@/store/useToastStore'

declare module 'axios' {
  export interface AxiosRequestConfig {
    __skipAuthRedirect?: boolean
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('API Client initialized with base URL:', apiClient.defaults.baseURL)

// 刷新令牌状态
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(err: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (err) p.reject(err)
    else p.resolve(token!)
  })
  pendingQueue = []
}

/** 尝试用 refreshToken 换取新令牌 */
async function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await axios.post(
    `${apiClient.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )
  const data = res.data.data ?? res.data
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.accessToken
}

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器（含自动刷新）
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    // 网络错误（无响应）→ 显示气泡提示
    if (!error.response) {
      toast.error('网络连接失败，请检查网络后重试')
      return Promise.reject(new Error('网络连接失败'))
    }

    // 非 401、或已经是刷新请求、或标记了跳过 → 直接拒绝
    if (
      error.response?.status !== 401 ||
      originalRequest?.__skipAuthRedirect ||
      originalRequest?._retry
    ) {
      const message = error.response?.data?.message || error.message || '网络错误'
      // 不显示 400 业务错误的 toast（由各页面自行展示），但显示 5xx 等
      if (error.response.status >= 500) {
        toast.error(message || '服务器异常，请稍后重试')
      } else if (error.response.status === 403) {
        toast.warning('没有权限执行此操作')
      } else if (error.response.status === 404) {
        toast.warning('请求的资源不存在')
      }
      return Promise.reject(new Error(message))
    }

    // 已有一个刷新在进行中 → 排队等它完成
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          },
          reject,
        })
      })
    }

    // 开始刷新
    isRefreshing = true
    originalRequest._retry = true

    try {
      const newToken = await doRefresh()
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      toast.warning('登录已过期，请重新登录')
      // 短暂延迟让用户看到提示再跳转
      setTimeout(() => {
        if (!originalRequest?.__skipAuthRedirect) {
          window.location.href = '/login'
        }
      }, 1500)
      return Promise.reject(new Error('登录已过期'))
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
