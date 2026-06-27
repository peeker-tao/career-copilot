import { useRef, useState, useCallback } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'

export interface UseMediaRecorderReturn {
  isRecording: boolean
  start: () => Promise<void>
  stop: () => Promise<Blob | null>
  error: string | null
}

const MIME_TYPE = 'audio/webm;codecs=opus'

/**
 * MediaRecorder 封装 Hook
 *
 * 使用：
 *   const recorder = useMediaRecorder()
 *   await recorder.start()
 *   // ... 录音中 ...
 *   const audioBlob = await recorder.stop()
 */
export function useMediaRecorder(): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const resolveRef = useRef<((blob: Blob) => void) | null>(null)

  const start = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mime = MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (resolveRef.current) {
          resolveRef.current(blob)
          resolveRef.current = null
        }
      }

      recorder.onerror = () => {
        setError('录音出错')
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      const msg =
        (err as DOMException).name === 'NotAllowedError'
          ? '麦克风权限被拒绝'
          : (err as Error).message
      setError(msg)
      useVoiceStore.getState().setError(msg)
    }
  }, [])

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      // 清理流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setIsRecording(false)
      return null
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve
      recorder.stop()
      setIsRecording(false)
    })
  }, [])

  return { isRecording, start, stop, error }
}
