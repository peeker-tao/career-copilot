import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { PaginationResult } from '@/types/api'
import type {
  VoiceInterview,
  VoiceInterviewSummary,
  VoiceInterviewListItem,
  CreateVoiceInterviewRequest,
  SaveTranscriptRequest,
} from '@/types/voice-interview'

/** 创建语音面试会话 */
export async function createVoiceInterview(data: CreateVoiceInterviewRequest): Promise<ApiResponse<VoiceInterview>> {
  const response: any = await apiClient.post('/voice-interviews', data)
  return { code: response.code, message: response.message, data: response.data }
}

/** 获取语音面试历史 */
export async function getVoiceInterviews(params?: {
  page?: number
  limit?: number
}): Promise<ApiResponse<PaginationResult<VoiceInterviewListItem>>> {
  const response: any = await apiClient.get('/voice-interviews', { params })
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data?.list ?? response.data ?? [],
      page: response.data?.pagination?.page ?? 1,
      pageSize: response.data?.pagination?.pageSize ?? 20,
      total: response.data?.pagination?.total ?? 0,
    },
  }
}

/** 获取语音面试详情 */
export async function getVoiceInterviewById(id: string): Promise<ApiResponse<VoiceInterview>> {
  return apiClient.get(`/voice-interviews/${id}`)
}

/** 获取 AI 生成面试摘要 */
export async function getVoiceInterviewSummary(id: string): Promise<ApiResponse<VoiceInterviewSummary>> {
  return apiClient.get(`/voice-interviews/${id}/summary`)
}

/** 暂停/恢复面试 */
export async function togglePause(id: string): Promise<ApiResponse<null>> {
  return apiClient.patch(`/voice-interviews/${id}/toggle-pause`)
}

/** 保存转录内容 */
export async function saveTranscript(id: string, data: SaveTranscriptRequest): Promise<ApiResponse<null>> {
  return apiClient.post(`/voice-interviews/${id}/transcript`, data)
}

/** 结束语音面试 */
export async function completeVoiceInterview(id: string): Promise<ApiResponse<{ summary: { score: number; duration: number; questionCount: number } }>> {
  return apiClient.post(`/voice-interviews/${id}/complete`)
}

/** 删除语音面试记录 */
export async function deleteVoiceInterview(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete(`/voice-interviews/${id}`)
}
