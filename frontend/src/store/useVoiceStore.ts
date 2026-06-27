import { create } from 'zustand'
import { speechToText, textToSpeech } from '@/api/voice'
import type { VoiceSettings } from '@/types/voice'

export interface VoiceState {
  /** 语音总开关 */
  enabled: boolean
  /** 是否正在录音 */
  isRecording: boolean
  /** 是否正在播放 TTS */
  isSpeaking: boolean
  /** 识别到的文本（确认发送前可预览） */
  recognizedText: string | null
  /** 识别中 */
  isProcessing: boolean
  /** 错误信息 */
  error: string | null
  /** 设置 */
  settings: VoiceSettings

  /** 切换语音开关 */
  toggleEnabled: () => void
  /** 切换自动发送 */
  toggleAutoSend: () => void
  /** 开始录音（由 useMediaRecorder 调用） */
  setRecording: (v: boolean) => void
  /** 设置处理中状态 */
  setProcessing: (v: boolean) => void
  /** 设置识别结果 */
  setRecognizedText: (text: string | null) => void
  /** 语音识别: blob -> text */
  recognizeSpeech: (audioBlob: Blob) => Promise<string | null>
  /** 语音合成: text -> play */
  speakText: (text: string) => Promise<void>
  /** 停止 TTS */
  stopSpeaking: () => void
  /** 清除错误 */
  clearError: () => void
  /** 重置所有录音相关状态 */
  resetRecording: () => void
}

let currentAudio: HTMLAudioElement | null = null

export const useVoiceStore = create<VoiceState>((set, get) => ({
  enabled: false,
  isRecording: false,
  isSpeaking: false,
  recognizedText: null,
  isProcessing: false,
  error: null,
  settings: {
    inputEnabled: true,
    outputEnabled: true,
    autoSend: true,
    speed: 1.0,
    voice: 'zh-CN-XiaoxiaoNeural',
  },

  toggleEnabled: () => set((s) => ({ enabled: !s.enabled })),
  toggleAutoSend: () =>
    set((s) => ({ settings: { ...s.settings, autoSend: !s.settings.autoSend } })),
  setRecording: (v) => set({ isRecording: v }),
  setProcessing: (v) => set({ isProcessing: v }),
  setRecognizedText: (text) => set({ recognizedText: text }),

  recognizeSpeech: async (audioBlob) => {
    set({ isProcessing: true, error: null })
    try {
      const res = await speechToText(audioBlob)
      const text = res.data.text
      set({ recognizedText: text, isProcessing: false })
      return text
    } catch (err) {
      const msg = (err as Error).message
      set({ error: msg, isProcessing: false })
      return null
    }
  },

  speakText: async (text) => {
    const { settings } = get()
    if (!settings.outputEnabled) return
    set({ isSpeaking: true })
    try {
      const res = await textToSpeech(text)
      // 停止上一个播放
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }
      const audio = new Audio(res.data.audioUrl)
      currentAudio = audio
      audio.onended = () => {
        set({ isSpeaking: false })
        currentAudio = null
      }
      audio.onerror = () => {
        set({ isSpeaking: false, error: '语音播放失败' })
        currentAudio = null
      }
      await audio.play()
    } catch (err) {
      const msg = (err as Error).message
      set({ isSpeaking: false, error: msg })
    }
  },

  stopSpeaking: () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    set({ isSpeaking: false })
  },

  clearError: () => set({ error: null }),
  resetRecording: () => set({ isRecording: false, recognizedText: null, isProcessing: false }),
}))
