import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS, DEFAULT_READER_SETTINGS } from '@/constants'
import { safeStorage } from '@/utils/storage'
import type { ReaderSettings } from '@/types'

interface ReaderState {
  settings: ReaderSettings
  updateSettings: (patch: Partial<ReaderSettings>) => void
  resetSettings: () => void
}

/**
 * 阅读器设置：随 localStorage 持久化（仅 settings 字段）。
 * 后续升级可在此处增加 migrate 逻辑。
 */
export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      settings: DEFAULT_READER_SETTINGS,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_READER_SETTINGS }),
    }),
    {
      name: STORAGE_KEYS.readerSettings,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
)