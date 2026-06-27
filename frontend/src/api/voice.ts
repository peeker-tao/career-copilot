/**
 * 语音服务 SDK — 框架版本
 *
 * 当前实现：
 *   VITE_USE_MOCK=true  → 调用 mock 数据模拟识别/合成
 *   VITE_USE_MOCK=false → 抛出 Error（待接入真实语音服务后实现）
 *
 * 接入说明（以 Azure Speech Services 为例）：
 *   1. 安装 @microsoft/cognitiveservices-speech-sdk
 *   2. 在 speechToText() 中用 SpeechSDK.AudioConfig.fromStreamInput() 处理 audioBlob
 *   3. 在 textToSpeech() 中用 SpeechSDK.SpeechSynthesizer 生成音频流
 *   4. 删除本文件顶部的 mock 分支，改为真实 SDK 调用
 */

import type { ApiResponse } from '@/types/api'
import type { SpeechToTextResult, TextToSpeechResult } from '@/types/voice'
import { MOCK_SPEECH_TO_TEXT, MOCK_TEXT_TO_SPEECH } from '@/mock/voice'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 语音识别：将音频 Blob 转为文字
 * @param audioBlob 来自 MediaRecorder 的录音数据（推荐 WebM/Opus 或 WAV）
 */
export async function speechToText(audioBlob: Blob): Promise<ApiResponse<SpeechToTextResult>> {
  if (useMock) {
    const result = await MOCK_SPEECH_TO_TEXT(audioBlob)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  // TODO: 接入真实语音识别服务
  throw new Error('语音识别服务未实现 — 请接入 Azure Speech Services 或等替代方案后实现')
}

/**
 * 语音合成：将文字转为音频 URL
 * @param text 需要朗读的文字
 */
export async function textToSpeech(text: string): Promise<ApiResponse<TextToSpeechResult>> {
  if (useMock) {
    const result = await MOCK_TEXT_TO_SPEECH(text)
    await delay(300)
    return { code: 200, message: 'success', data: result }
  }

  // TODO: 接入真实 TTS 服务
  throw new Error('语音合成服务未实现 — 请接入 Azure Speech Services 或等替代方案后实现')
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
