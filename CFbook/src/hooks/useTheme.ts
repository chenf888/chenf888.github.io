import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

/** 将全局主题同步到 <html> 的 dark class 上 */
export function useTheme(): void {
  const theme = useUIStore((s) => s.globalTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
}