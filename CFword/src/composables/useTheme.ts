import { onMounted, ref } from 'vue'

export type Theme = 'light' | 'dark'

/** 与主页一致：主题存 localStorage，默认浅色。 */
const STORAGE_KEY = 'cfword-theme'

/** 浏览器地址栏/状态栏配色，随主题切换。 */
const THEME_COLOR: Record<Theme, string> = {
  light: '#F4F4F0',
  dark: '#0F0F0F',
}

function readStored(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    // 隐私模式等场景下 localStorage 不可用
    return 'light'
  }
}

const theme = ref<Theme>(readStored())

/** 读取当前背景色，用于圆形扩散过渡的填充色。 */
function currentBg(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg')
    .trim()
  return value || '#f4f4f0'
}

/** 应用主题：写入 <html data-theme>、同步 theme-color、持久化。 */
function applyTheme(next: Theme): void {
  theme.value = next
  document.documentElement.setAttribute('data-theme', next)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[next])
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // 忽略写入失败
  }
}

// 模块加载即同步一次（index.html 的预渲染脚本已设置过属性，此处保持幂等）
applyTheme(theme.value)

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 圆形扩散过渡的当前阶段，用于阻止连点重入。 */
let phase: 'idle' | 'expanding' | 'shrinking' = 'idle'
let rippleEl: HTMLElement | null = null
let pendingTheme: Theme | null = null

/**
 * 主页同款的圆形扩散过渡：以父元素中心为圆心扩散，
 * expanding 结束后切换主题，再 shrinking 收起，全程不遮挡界面。
 */
function startRipple(next: Theme): void {
  const el = rippleEl
  const rect = el?.parentElement?.getBoundingClientRect()
  if (!el || !rect) return

  phase = 'expanding'
  pendingTheme = next
  el.style.display = 'block'
  el.style.transformOrigin = `${rect.width / 2}px ${rect.height / 2}px`
  el.style.transform = 'scale(0)'
  el.style.backgroundColor = currentBg()
  el.style.transition = 'none'

  // 双 rAF 确保初始态先上屏，过渡才会生效
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'scale(1)'
      el.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)'
    })
  })
}

/** 过渡结束回调：驱动 切换主题 -> 收起 -> 隐藏 各阶段。 */
function onRippleEnd(e: TransitionEvent): void {
  if (e.propertyName !== 'transform') return
  const el = rippleEl
  if (!el) return
  if (phase === 'expanding') {
    if (pendingTheme) applyTheme(pendingTheme)
    el.style.backgroundColor = currentBg()
    el.style.transform = 'scale(0)'
    el.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)'
    phase = 'shrinking'
  } else if (phase === 'shrinking') {
    el.style.display = 'none'
    phase = 'idle'
  }
}

export function useTheme() {
  const rippleRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    rippleEl = rippleRef.value
    rippleEl?.addEventListener('transitionend', onRippleEnd)
  })

  function toggleTheme(): void {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    // 无过渡元素或用户开启「减少动态」时直接切换
    if (phase !== 'idle' || prefersReducedMotion() || !rippleRef.value) {
      applyTheme(next)
      return
    }
    startRipple(next)
  }

  return { theme, rippleRef, toggleTheme }
}
