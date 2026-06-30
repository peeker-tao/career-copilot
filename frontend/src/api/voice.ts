import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { SpeechToTextResult, TextToSpeechResult } from '@/types/voice'
import { MOCK_SPEECH_TO_TEXT, MOCK_TEXT_TO_SPEECH } from '@/mock/voice'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function speechToText(audioBlob: Blob): Promise<ApiResponse<SpeechToTextResult>> {
  if (useMock) {
    const result = await MOCK_SPEECH_TO_TEXT(audioBlob)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  return apiClient.post('/voice-interviews/stt', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function textToSpeech(text: string): Promise<ApiResponse<TextToSpeechResult>> {
  if (useMock) {
    const result = await MOCK_TEXT_TO_SPEECH(text)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  return apiClient.post('/voice-interviews/tts', { text }, {
    headers: { 'Content-Type': 'application/json' },
  })
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