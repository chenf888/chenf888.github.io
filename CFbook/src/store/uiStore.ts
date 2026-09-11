import { create } from 'zustand'
import { safeStorage } from '@/utils/storage'

type DrawerKind = 'settings' | 'catalog'
type GlobalTheme = 'light' | 'dark'

interface Toast {
  id: number
  message: string
}

interface UIState {
  toolbarVisible: boolean
  drawer: DrawerKind | null
  toast: Toast | null
  globalTheme: GlobalTheme
  setToolbarVisible: (v: boolean) => void
  toggleToolbarVisible: () => void
  openDrawer: (d: DrawerKind) => void
  closeDrawer: () => void
  showToast: (message: string) => void
  clearToast: () => void
  setGlobalTheme: (t: GlobalTheme) => void
  toggleGlobalTheme: () => void
}

const THEME_KEY = 'cfbook-theme'

function applyTheme(t: GlobalTheme): void {
  document.documentElement.classList.toggle('dark', t === 'dark')
  safeStorage.setItem(THEME_KEY, t)
}

function initialTheme(): GlobalTheme {
  const saved = safeStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/** 不持久化的 UI 状态：工具栏、抽屉、Toast、全局主题 */
export const useUIStore = create<UIState>()((set, get) => ({
  toolbarVisible: true,
  drawer: null,
  toast: null,
  globalTheme: initialTheme(),

  setToolbarVisible: (v) => set({ toolbarVisible: v }),
  toggleToolbarVisible: () =>
    set((s) => ({ toolbarVisible: !s.toolbarVisible })),

  openDrawer: (d) => set({ drawer: d }),
  closeDrawer: () => set({ drawer: null }),

  showToast: (message) => set({ toast: { id: Date.now(), message } }),
  clearToast: () => set({ toast: null }),

  setGlobalTheme: (t) => {
    set({ globalTheme: t })
    applyTheme(t)
  },
  toggleGlobalTheme: () => {
    const t = get().globalTheme === 'dark' ? 'light' : 'dark'
    get().setGlobalTheme(t)
  },
}))