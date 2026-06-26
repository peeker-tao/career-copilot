import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useAsync - 通用异步请求 Hook
 * 统一管理 loading / error / data 状态，消除页面中的重复样板代码
 *
 * @param asyncFn 异步请求函数
 * @param immediate 是否立即执行（默认 false）
 * @returns { data, loading, error, execute, reset }
 */
export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  immediate = false
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: unknown[]) => {
      setLoading(true)
      setError(null)
      try {
        const result = await asyncFn(...args)
        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
        return result
      } catch (err) {
        if (mountedRef.current) {
          setError((err as Error).message)
          setLoading(false)
        }
        throw err
      }
    },
    [asyncFn]
  )

  useEffect(() => {
    if (immediate) {
      // loading 已通过 useState(immediate) 初始化为 true，无需再 setLoading(true)
      const run = async () => {
        setError(null)
        try {
          const result = await asyncFn()
          if (mountedRef.current) {
            setData(result)
          }
        } catch (err) {
          if (mountedRef.current) {
            setError((err as Error).message)
          }
        } finally {
          if (mountedRef.current) {
            setLoading(false)
          }
        }
      }
      run()
    }
  }, [immediate, asyncFn])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
