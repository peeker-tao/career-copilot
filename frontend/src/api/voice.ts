/**
 * 语音服务 SDK — ASR / TTS
 *
 * API 端点：
 *   POST /api/voice/asr  — 语音识别，接受 FormData (audio file)，返回 { text }
 *   POST /api/voice/tts  — 语音合成，接受 { text, voice }，返回 audio blob
 */

import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { SpeechToTextResult, TextToSpeechResult } from '@/types/voice'
import { MOCK_SPEECH_TO_TEXT, MOCK_TEXT_TO_SPEECH } from '@/mock/voice'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 默认 TTS 音色 */
const DEFAULT_VOICE = 'alloy'

/**
 * 语音识别：将音频 Blob 转为文字
 * POST /api/voice/asr，FormData 携带音频文件
 */
export async function speechToText(audioBlob: Blob): Promise<ApiResponse<SpeechToTextResult>> {
  if (useMock) {
    const result = await MOCK_SPEECH_TO_TEXT(audioBlob)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')

  const response: ApiResponse<SpeechToTextResult> = await apiClient.post('/voice/asr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response
}

/**
 * 语音合成：将文字转为可播放的 Blob URL
 * POST /api/voice/tts → 获取音频文件 URL → 下载 binary → 创建 Blob URL
 */
export async function textToSpeech(
  text: string,
  voice: string = DEFAULT_VOICE,
): Promise<ApiResponse<TextToSpeechResult>> {
  if (useMock) {
    const result = await MOCK_TEXT_TO_SPEECH(text)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  // 1. 先请求 TTS，获取音频文件 URL（后端返回 { url, path }）
  const resp = await apiClient.post(
    '/voice/tts',
    { text, voice },
  ) as ApiResponse<{ url: string; path: string }>
  const url: string = resp.data?.url || ''

  // 2. 根据 baseURL 拼接完整 URL 并下载音频 binary
  const baseURL = apiClient.defaults.baseURL?.replace(/\/api$/, '') || ''
  const audioResponse = await fetch(`${baseURL}${url}`)
  const audioBlob = await audioResponse.blob()
  const audioUrl = URL.createObjectURL(audioBlob)

  return {
    code: 201,
    message: 'success',
    data: { audioUrl },
  }
}

/**
 * TTS 音色显示名映射（后端 DashScope 发音人）
 * 后端 getAvailableVoices 返回 alloy/echo/fable/onyx/nova/shimmer
 */
export const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: '面试官（中性友好）',
  echo: '面试官（成熟沉稳）',
  fable: '引导介绍（知性积极）',
  onyx: '放松场景（居家暖男）',
  nova: '温和反馈（细腻柔声）',
  shimmer: '默认通用（知性积极）',
}

/**
 * 获取可用 TTS 语音列表
 * GET /api/voice/voices-list → string[]
 */
export async function getVoiceList(): Promise<string[]> {
  if (useMock) {
    await delay(200)
    return Object.keys(VOICE_DISPLAY_NAMES)
  }
  const result = await apiClient.get('/voice/voices-list') as ApiResponse<string[]>
  return result.data ?? result
}

/**
 * 检测浏览器语音能力
 */
export function checkVoiceCapability() {
  return {
    microphoneSupported: !!navigator.mediaDevices?.getUserMedia,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    speechRecognitionSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    ttsSupported: !!window.speechSynthesis,
  }
}
