import { useEffect, useRef } from 'react'

interface KeyboardOptions {
  onNext: () => void
  onPrev: () => void
  onEscape: () => void
  onScrollUp?: () => void
  onScrollDown?: () => void
}

/** 桌面键盘翻页：→/PageDown/Space 下页，←/PageUp 上页，Esc 关闭，输入框聚焦时禁用 */
export function useKeyboardPage(opts: KeyboardOptions): void {
  const ref = useRef(opts)
  ref.current = opts

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const tag = active ? active.tagName : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return

      const o = ref.current
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          o.onNext()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          o.onPrev()
          break
        case 'Escape':
          o.onEscape()
          break
        case 'ArrowDown':
          o.onScrollDown?.()
          break
        case 'ArrowUp':
          o.onScrollUp?.()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}