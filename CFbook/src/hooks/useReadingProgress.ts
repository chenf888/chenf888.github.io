import { useEffect, useRef, useState } from 'react'

/** 记录阅读秒数，返回累计分钟数与重置函数（用于「本次阅读 xx 分钟」） */
export function useReadingProgress(active: boolean): {
  minutes: number
  reset: () => void
} {
  const [minutes, setMinutes] = useState(0)
  const seconds = useRef(0)

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      seconds.current += 1
      setMinutes(Math.floor(seconds.current / 60))
    }, 1000)
    return () => window.clearInterval(id)
  }, [active])

  const reset = () => {
    seconds.current = 0
    setMinutes(0)
  }

  return { minutes, reset }
}