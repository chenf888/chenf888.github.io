import { db } from './schema'
import type { ReviewLog } from '../types'

/** 按词库读取全部复习日志。 */
export async function getLogsByDeck(deckId: string): Promise<ReviewLog[]> {
  return db.reviewLogs.where('deckId').equals(deckId).toArray()
}

/** 按时间范围读取某词库日志（用于统计）。 */
export async function getLogsBetween(
  deckId: string,
  start: number,
  end: number,
): Promise<ReviewLog[]> {
  return db.reviewLogs
    .where('[deckId+reviewedAt]')
    .between([deckId, start], [deckId, end])
    .toArray()
}

/** 批量导入日志（备份恢复，按 id 去重）。 */
export async function bulkPutLogs(logs: ReviewLog[]): Promise<void> {
  if (logs.length === 0) return
  await db.transaction('rw', db.reviewLogs, async () => {
    for (const log of logs) {
      if (log.id != null) {
        await db.reviewLogs.put(log)
      } else {
        await db.reviewLogs.add(log)
      }
    }
  })
}