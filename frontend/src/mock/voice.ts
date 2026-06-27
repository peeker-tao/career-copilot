import type { SpeechToTextResult, TextToSpeechResult } from '@/types/voice'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 模拟语音 -> 文字 (模拟识别延时 + 预设文本) */
export async function MOCK_SPEECH_TO_TEXT(audioBlob: Blob): Promise<SpeechToTextResult> {
  await delay(1200)

  const mockTexts = [
    '我认为 HashMap 的底层是数组加链表加红黑树实现的，当链表长度超过8时会转为红黑树。',
    '负载因子默认是0.75，这是时间成本和空间成本的平衡点。',
    'MySQL 的 InnoDB 引擎使用 B+ 树作为索引结构，它可以支持高效的范围查询。',
    'Redis 支持五种基本数据类型：String、Hash、List、Set 和 Zset。',
  ]
  const text = mockTexts[Math.floor(Math.random() * mockTexts.length)]

  return { text, confidence: 0.85 + Math.random() * 0.15 }
}

/** 模拟文字 -> 语音 (返回一个静音 audio URL) */
export async function MOCK_TEXT_TO_SPEECH(text: string): Promise<TextToSpeechResult> {
  await delay(800)
  // 模拟模式下直接返回一个占位 data URL（极小静音 wav）
  return {
    audioUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    duration: text.length * 0.15,
  }
}
