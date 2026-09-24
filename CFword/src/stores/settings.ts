import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from '../db/settingsRepo'
import type { Settings } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  /** 从 IndexedDB 载入设置（应用启动时调用一次）。 */
  async function init(): Promise<void> {
    settings.value = await loadSettings()
    loaded.value = true
  }

  /** 合并更新设置并持久化。 */
  async function update(partial: Partial<Settings>): Promise<void> {
    settings.value = { ...settings.value, ...partial }
    await saveSettings(partial)
  }

  return { settings, loaded, init, update }
})