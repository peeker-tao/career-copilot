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
 * POST /api/voice/tts，返回 audio blob → 前端创建 Blob URL
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

  const response = await apiClient.post(
    '/voice/tts',
    { text, voice },
    { responseType: 'blob' },
  )

  // axios 拦截器对 blob 类型不会自动解包，response 就是 blob
  const audioBlob = response as unknown as Blob
  const audioUrl = URL.createObjectURL(audioBlob)

  return {
    code: 201,
    message: 'success',
    data: { audioUrl },
  }
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
