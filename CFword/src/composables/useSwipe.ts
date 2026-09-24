import { ref } from 'vue'

/**
 * 复习卡滑动手势：左滑 = 忘记，右滑 = 记得。
 * 仅在水平位移大于垂直位移 1.5 倍时激活，避免与页面滚动冲突。
 */
export function useSwipe(opts: {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}) {
  const dx = ref(0)
  const dragging = ref(false)
  const horizontalActive = ref(false)

  let startX = 0
  let startY = 0

  function onStart(e: TouchEvent): void {
    const t = e.touches[0]
    if (!t) return
    startX = t.clientX
    startY = t.clientY
    dragging.value = true
    horizontalActive.value = false
  }

  function onMove(e: TouchEvent): void {
    if (!dragging.value) return
    const t = e.touches[0]
    if (!t) return
    const horizontal = t.clientX - startX
    const vertical = t.clientY - startY
    if (Math.abs(horizontal) > Math.abs(vertical) * 1.5) {
      horizontalActive.value = true
      dx.value = horizontal
    } else {
      horizontalActive.value = false
      dx.value = 0
    }
  }

  function onEnd(): void {
    const threshold = opts.threshold ?? 96
    if (horizontalActive.value) {
      if (dx.value > threshold) opts.onSwipeRight()
      else if (dx.value < -threshold) opts.onSwipeLeft()
    }
    dx.value = 0
    dragging.value = false
    horizontalActive.value = false
  }

  return { dx, dragging, horizontalActive, onStart, onMove, onEnd }
}