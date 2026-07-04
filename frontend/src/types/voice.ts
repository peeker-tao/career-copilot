/** 语音识别结果 */
export interface SpeechToTextResult {
  text: string
  confidence?: number
}

/** 语音合成结果 */
export interface TextToSpeechResult {
  audioUrl: string
  duration?: number
}

/** 语音设置 */
export interface VoiceSettings {
  /** 语音输入开关 */
  inputEnabled: boolean
  /** 语音输出(TTS)开关 */
  outputEnabled: boolean
  /** 识别到语音后是否自动发送 */
  autoSend: boolean
  /** TTS 语速 (0.5 ~ 2.0) */
  speed: number
  /** TTS 音色 */
  voice: string
}

/** 语音服务可用性 */
export interface VoiceCapability {
  microphoneSupported: boolean
  speechRecognitionSupported: boolean
  ttsSupported: boolean
}
