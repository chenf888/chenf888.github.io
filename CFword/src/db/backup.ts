import { db } from './schema'
import type { BackupFile, ReviewCard, ReviewLog, WordRecord } from '../types'

export const BACKUP_SCHEMA_VERSION = 1

/** 组装备份对象（轻量不含 words；完整含 customWords）。 */
export async function buildBackup(
  includeCustomWords: boolean,
): Promise<BackupFile> {
  const settings = await db.settings.toArray()
  const deckMeta = await db.deckMeta.toArray()
  const reviewCards = await db.reviewCards.toArray()
  const reviewLogs = await db.reviewLogs.toArray()
  let customWords: WordRecord[] = []

  if (includeCustomWords) {
    const all = await db.words.toArray()
    customWords = all.filter((w) => w.tags?.includes('custom') ?? false)
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    deckMeta,
    reviewCards,
    reviewLogs,
    customWords,
  }
}

/** 校验备份 JSON，抛错时说明具体原因。 */
export function validateBackup(data: unknown): asserts data is BackupFile {
  if (typeof data !== 'object' || data === null) {
    throw new Error('备份文件不是有效对象')
  }
  const d = data as Record<string, unknown>
  if (d.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`不支持的 schemaVersion: ${String(d.schemaVersion)}`)
  }
  if (!Array.isArray(d.deckMeta)) throw new Error('deckMeta 必须是数组')
  if (!Array.isArray(d.reviewCards)) throw new Error('reviewCards 必须是数组')
  if (!Array.isArray(d.reviewLogs)) throw new Error('reviewLogs 必须是数组')
  if (!Array.isArray(d.customWords)) throw new Error('customWords 必须是数组')
  if (typeof d.settings !== 'object' || d.settings === null) {
    throw new Error('settings 必须是对象')
  }
}

/**
 * 事务导入备份。
 * 冲突策略：reviewCards 保留 lastReview 较新者；reviewLogs 按 id 去重；设置以导入为准。
 */
export async function importBackup(data: BackupFile): Promise<void> {
  validateBackup(data)

  await db.transaction(
    'rw',
    [db.settings, db.deckMeta, db.reviewCards, db.reviewLogs, db.words],
    async () => {
      // 设置以导入为准
      for (const [key, value] of Object.entries(data.settings)) {
        await db.settings.put({ key, value })
      }

      // 词库元信息保留较新者
      for (const meta of data.deckMeta) {
        const existing = await db.deckMeta.get(meta.deckId)
        if (!existing || meta.loadedAt > existing.loadedAt) {
          await db.deckMeta.put(meta)
        }
      }

      // 复习卡保留 lastReview 较新者
      for (const card of data.reviewCards as ReviewCard[]) {
        const existing = await db.reviewCards.get(card.wordId)
        if (
          !existing ||
          (card.lastReview ?? 0) > (existing.lastReview ?? 0)
        ) {
          await db.reviewCards.put(card)
        }
      }

      // 日志按 id 去重
      for (const log of data.reviewLogs as ReviewLog[]) {
        if (log.id != null) {
          const existing = await db.reviewLogs.get(log.id)
          if (!existing) await db.reviewLogs.put(log)
        } else {
          await db.reviewLogs.add(log)
        }
      }

      // 自定义词条
      for (const w of data.customWords as WordRecord[]) {
        await db.words.put(w)
      }
    },
  )
}