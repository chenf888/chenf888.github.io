import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 键盘快捷键封装。
 * `map` 返回当前按键 → 动作的映射（支持闭包读取最新状态）。
 * 在输入框内不触发快捷键。
 */
export function useHotkeys(map: () => Record<string, () => void>): void {
  function handler(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return
    }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const fn = map()[key]
    if (fn) {
      e.preventDefault()
      fn()
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
}