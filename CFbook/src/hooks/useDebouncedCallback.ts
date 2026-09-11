import { useCallback, useEffect, useRef } from 'react'

/** 防抖回调：delay 毫秒内重复调用只执行最后一次 */
export function useDebouncedCallback<A extends unknown[]>(
  cb: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  const cbRef = useRef(cb)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    cbRef.current = cb
  })

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current)
    }
  }, [])

  return useCallback(
    (...args: A) => {
      if (timer.current !== undefined) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => cbRef.current(...args), delay)
    },
    [delay],
  )
}