import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { ResumeSummary, ResumeDetail } from '@/types/resume'
import { MOCK_RESUMES, MOCK_RESUME_DETAIL } from '@/mock'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 获取简历列表 */
export async function getResumes(): Promise<ApiResponse<ResumeSummary[]>> {
  if (useMock) {
    await delay(400)
    return { code: 200, message: 'success', data: MOCK_RESUMES }
  }
  // 后端 NestJS ResponseInterceptor → {code, message, data: {items, total, page, limit, totalPages}}
  const response: any = await apiClient.get('/resumes')
  const list = Array.isArray(response.data)
    ? response.data
    : (response.data?.items || response.data?.list || [])
  return {
    code: response.code,
    message: response.message,
    data: Array.isArray(list) ? list : [],
  }
}

/** 获取简历详情 */
export async function getResumeById(id: string): Promise<ApiResponse<ResumeDetail>> {
  if (useMock) {
    await delay(500)
    return { code: 200, message: 'success', data: { ...MOCK_RESUME_DETAIL, id } }
  }
  return apiClient.get(`/resumes/${id}`)
}

/** 上传简历 */
export async function uploadResume(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ApiResponse<ResumeDetail>> {
  if (useMock) {
    // 模拟上传进度
    const interval = setInterval(() => {
      onProgress?.(Math.min(Math.random() * 15 + 5, 95))
    }, 300)
    await delay(2500)
    clearInterval(interval)
    onProgress?.(100)
    return {
      code: 200,
      message: '上传成功',
      data: { ...MOCK_RESUME_DETAIL, id: Date.now().toString() },
    }
  }
  const form = new FormData()
  form.append('file', file)
  return apiClient.post('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total))
    },
  })
}

/** 删除简历 */
export async function deleteResume(id: string): Promise<ApiResponse<null>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '删除成功', data: null }
  }
  return apiClient.delete(`/resumes/${id}`)
}

/** 更新简历解析结果 */
export async function updateResume(id: string, data: Partial<ResumeDetail>): Promise<ApiResponse<ResumeDetail>> {
  if (useMock) {
    await delay(300)
    return { code: 200, message: '更新成功', data: { ...MOCK_RESUME_DETAIL, id, ...data } }
  }
  return apiClient.put(`/resumes/${id}`, { parsedData: data.parsedData })
}

/** 重新解析简历 */
export async function reparseResume(id: string): Promise<ApiResponse<ResumeDetail>> {
  if (useMock) {
    await delay(2000)
    return {
      code: 200,
      message: '重新解析成功',
      data: { ...MOCK_RESUME_DETAIL, id },
    }
  }
  // 后端暂未实现独立的 reparse 端点，通过 PUT 设置 status=parsing 触发重新解析
  return apiClient.put(`/resumes/${id}`, { status: 'parsing' })
}
