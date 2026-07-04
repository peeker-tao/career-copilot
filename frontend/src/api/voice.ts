import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { SpeechToTextResult, TextToSpeechResult } from '@/types/voice'
import { MOCK_SPEECH_TO_TEXT, MOCK_TEXT_TO_SPEECH } from '@/mock/voice'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 默认 TTS 音色 */
const DEFAULT_VOICE = 'alloy'

/**
 * 带超时的 fetch，超时自动中断
 */
async function fetchWithTimeout(url: string, timeoutMs: number, retries = 0): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      return res
    } catch (err) {
      clearTimeout(timer)
      const isLast = attempt === retries
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (isLast) throw new Error(`⏱️ TTS 请求超时（已重试 ${retries} 次）`)
        // 不是最后一次则继续重试
        continue
      }
      if (isLast) throw err
      // 网络错误重试
      continue
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error('TTS 请求失败')
}

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

  const form = new FormData()
  form.append('file', audioBlob, 'recording.webm')
  return apiClient.post('/voice/asr', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 语音合成：将文字转为可播放的 Blob URL
 * POST /api/voice/tts → 获取音频文件 URL → 下载 binary → 创建 Blob URL
 *
 * 内置超时 + 自动重试（1 次）
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

  // 1. 先请求 TTS，获取音频文件 URL（后端返回 { url, path }）— 15s 超时
  const ttsController = new AbortController()
  const ttsTimer = setTimeout(() => ttsController.abort(), 15000)
  let resp: ApiResponse<{ url: string; path: string }>
  try {
    resp = await apiClient.post('/voice/tts', { text, voice }, { signal: ttsController.signal }) as ApiResponse<{ url: string; path: string }>
  } catch (err: unknown) {
    clearTimeout(ttsTimer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('⏱️ TTS 生成超时，请稍后重试')
    }
    throw new Error('🔊 TTS 服务暂不可用，请稍后重试')
  } finally {
    clearTimeout(ttsTimer)
  }
  const url: string = resp.data?.url || ''
  if (!url) {
    throw new Error('🔊 TTS 返回为空，请稍后重试')
  }

  // 2. 如果后端返回的是绝对 URL（DashScope OSS 直链）则直接使用，否则拼接 baseURL
  const isAbsolute = url.startsWith('http://') || url.startsWith('https://')
  const fetchUrl = isAbsolute
    ? url
    : `${apiClient.defaults.baseURL?.replace(/\/api$/, '') || ''}${url}`

  // 3. 下载音频 — 30s 超时 + 1 次重试
  const audioResponse = await fetchWithTimeout(fetchUrl, 30000, 1)
  if (!audioResponse.ok) {
    throw new Error(`🔊 音频下载失败 (${audioResponse.status})`)
  }
  const audioBlob = await audioResponse.blob()
  const audioObjectUrl = URL.createObjectURL(audioBlob)

  return {
    code: 200,
    message: 'success',
    data: { audioUrl: audioObjectUrl },
  }
}

/**
 * TTS 音色显示名映射（后端 DashScope CosyVoice 发音人）
 * 支持 DashScope 原生音色名 + 兼容 old OpenAI 风格别名
 * DashScope v3-flash 标杆音色:
 *   longanyang      — 阳光大男孩
 *   longxiaochun_v3 — 知性积极女
 *   longwan_v3      — 细腻柔声女
 *   longanyun_v3    — 居家暖男
 *   longanzhi_v3    — 睿智轻熟男
 */
export const VOICE_DISPLAY_NAMES: Record<string, string> = {
  // DashScope 原生发音人
  longanyang: '阳光大男孩（标杆）',
  longxiaochun_v3: '知性积极女',
  longwan_v3: '细腻柔声女',
  longanyun_v3: '居家暖男',
  longanzhi_v3: '睿智轻熟男',
  // 兼容旧版 OpenAI 风格别名（后端映射到 DashScope）
  alloy: '面试官（中性友好）',
  echo: '面试官（成熟沉稳）',
  fable: '引导介绍（知性积极）',
  onyx: '放松场景（居家暖男）',
  nova: '温和反馈（细腻柔声）',
  shimmer: '默认通用（知性积极）',
}

/**
 * 获取可用 TTS 语音列表
 * 后端 DashScope CosyVoice 支持以下发音人
 */
export async function getVoiceList(): Promise<string[]> {
  if (useMock) {
    await delay(200)
    return Object.keys(VOICE_DISPLAY_NAMES)
  }
  // 后端无独立 voice-list 接口，直接返回前端内置列表
  return Object.keys(VOICE_DISPLAY_NAMES)
}

/**
 * 检测浏览器语音能力
 */
export function checkVoiceCapability() {
  return {
    microphoneSupported: !!navigator.mediaDevices?.getUserMedia,
    speechRecognitionSupported:
      !!(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      ),
    ttsSupported: !!window.speechSynthesis,
  }
}