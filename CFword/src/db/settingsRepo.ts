import { db } from './schema'
import type { Settings } from '../types'

/** 默认设置 */
export const DEFAULT_SETTINGS: Settings = {
  newCardsPerDay: 10,
  reviewLimit: 100,
  requestRetention: 0.9,
  accent: 'us',
  autoPlay: false,
  lastBackupAt: null,
}

/** 读取全部设置，缺失项回退到默认值。 */
export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const map: Record<string, unknown> = {}
  for (const r of rows) map[r.key] = r.value
  return { ...DEFAULT_SETTINGS, ...map } as Settings
}

/** 合并写入设置（事务）。 */
export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of Object.entries(partial)) {
      await db.settings.put({ key, value })
    }
  })
}