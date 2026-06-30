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
 *
 * 后端返回 { url: string }，url 已是完整可访问的地址（OSS 直链 或 含 host 的本地路径），
 * 前端直接 fetch 即可，不需要再拼接 baseURL。
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

  // 1. 请求 TTS 获取音频文件 URL（后端返回 { url: "完整URL" }）
  const resp = await apiClient.post<{ url: string }>(
    '/voice/tts',
    { text, voice },
  )
  const url: string = resp.data?.url || ''
  if (!url) throw new Error('TTS 返回的音频 URL 为空')

  // 2. url 已是完整 URL（OSS 直链 或 http://host/uploads/audio/xxx.mp3），直接 fetch
  const audioResponse = await fetch(url)
  if (!audioResponse.ok) throw new Error(`TTS 音频下载失败 (${audioResponse.status})`)
  const audioBlob = await audioResponse.blob()
  const audioUrl = URL.createObjectURL(audioBlob)

  return {
    code: 200,
    message: 'success',
    data: { audioUrl },
  }
}

/**
 * TTS 音色显示名映射（后端支持 DashScope CosyVoice + OpenAI TTS）
 *
 * DashScope 发音人（CosyVoice）：
 *   longanyang     - 阳光大男孩
 *   longxiaochun_v3 - 知性积极女
 *   longwan_v3     - 细腻柔声女
 *   longanyun_v3   - 居家暖男
 *   longanzhi_v3   - 睿智轻熟男
 *
 * OpenAI 发音人：
 *   alloy/echo/fable/onyx/nova/shimmer
 */
export const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: '面试官（中性友好）',
  echo: '面试官（成熟沉稳）',
  fable: '引导介绍（知性积极）',
  onyx: '放松场景（居家暖男）',
  nova: '温和反馈（细腻柔声）',
  shimmer: '默认通用（知性积极）',
  longanyang: '阳光大男孩（CosyVoice）',
  longxiaochun_v3: '知性积极女（CosyVoice）',
  longwan_v3: '细腻柔声女（CosyVoice）',
  longanyun_v3: '居家暖男（CosyVoice）',
  longanzhi_v3: '睿智轻熟男（CosyVoice）',
}

/**
 * 可用 TTS 语音键列表（目前由前端静态管理，后续如需后端动态下发再做调整）
 */
export function getVoiceList(): string[] {
  return Object.keys(VOICE_DISPLAY_NAMES)
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
