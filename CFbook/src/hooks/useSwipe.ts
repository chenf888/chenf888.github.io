import { useEffect, useRef, type RefObject } from 'react'

interface SwipeOptions {
  onPrev: () => void
  onNext: () => void
  threshold?: number
}

/** 移动端左右滑动手势：仅当横向位移超过阈值且远大于纵向时才触发翻页 */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  { onPrev, onNext, threshold = 40 }: SwipeOptions,
): void {
  const optsRef = useRef({ onPrev, onNext, threshold })
  optsRef.current = { onPrev, onNext, threshold }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0
    let startY = 0
    let startTime = 0

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startTime = Date.now()
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const dt = Date.now() - startTime
      const { onPrev: prev, onNext: next, threshold: th } = optsRef.current
      if (Math.abs(dx) > th && Math.abs(dx) > 1.5 * Math.abs(dy) && dt < 600) {
        if (dx < 0) next()
        else prev()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref])
}