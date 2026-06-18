import { useState, useEffect, useRef } from 'react'

/**
 * useStreamingText - 打字机效果 Hook
 * 将完整文本逐字显示，模拟流式输出
 *
 * @param fullText 完整文本
 * @param speed 每个字符间隔（毫秒），默认 30
 * @returns 当前已显示的文本
 */
export function useStreamingText(fullText: string, speed = 30): string {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    indexRef.current = 0

    if (!fullText) return

    const timer = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current >= fullText.length) {
        setDisplayed(fullText)
        clearInterval(timer)
      } else {
        setDisplayed(fullText.slice(0, indexRef.current))
      }
    }, speed)

    return () => clearInterval(timer)
  }, [fullText, speed])

  return displayed
}
