import Dexie, { type Table } from 'dexie'
import type { WordRecord, ReviewCard, ReviewLog, DeckMeta } from '../types'

/** settings 表行结构 */
export interface SettingsRow {
  key: string
  value: unknown
}

/**
 * CFword 的 IndexedDB 数据库。
 * 所有表结构变更必须通过新增版本号 + 迁移函数完成，不破坏旧数据。
 */
class CFwordDB extends Dexie {
  words!: Table<WordRecord, string>
  reviewCards!: Table<ReviewCard, string>
  reviewLogs!: Table<ReviewLog, number>
  settings!: Table<SettingsRow, string>
  deckMeta!: Table<DeckMeta, string>

  constructor() {
    super('cfword')
    this.version(1).stores({
      words: 'id, deckId, word, frequency, *tags',
      reviewCards: 'wordId, deckId, due, state, [deckId+due]',
      reviewLogs: '++id, wordId, deckId, reviewedAt, [deckId+reviewedAt]',
      settings: 'key',
      deckMeta: 'deckId',
    })
  }
}

export const db = new CFwordDB()