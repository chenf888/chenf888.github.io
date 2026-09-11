/**
 * 安全 localStorage 封装：隐私模式 / 超限时降级为内存 Map，保证不崩溃。
 */

const memoryStore = new Map<string, string>()
let warned = false

function warnOnce(): void {
  if (warned) return
  warned = true
  console.warn('[CFbook] localStorage 不可用，已降级为内存存储')
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return memoryStore.get(key) ?? null
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      warnOnce()
      memoryStore.set(key, value)
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      memoryStore.delete(key)
    }
  },
}