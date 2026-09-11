import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const KEY_PREFIX = 'scroll:'

/**
 * 列表/详情页滚动位置恢复：sessionStorage key `scroll:{pathname}`。
 * 返回时双 rAF 恢复；阅读页不启用此 hook。
 */
export function useScrollRestoration(enabled = true): void {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!enabled) return
    const key = KEY_PREFIX + pathname
    const saved = window.sessionStorage.getItem(key)
    const target = saved ? Number(saved) : 0

    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => window.scrollTo(0, target))
    })

    const onScroll = () => {
      window.sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', onScroll)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', onScroll)
    }
  }, [pathname, enabled])
}