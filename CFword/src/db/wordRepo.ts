import { db } from './schema'
import type { Word, WordRecord } from '../types'

/**
 * 以事务方式写入一批词条（upsert），并更新词库元信息。
 * 批量超过 500 条时由 Web Worker 调用以避开主线程。
 */
export async function importWords(
  deckId: string,
  words: Word[],
  sourceVersion: string,
): Promise<void> {
  const records: WordRecord[] = words.map((w) => ({ ...w, deckId }))
  await db.transaction('rw', [db.words, db.deckMeta], async () => {
    await db.words.bulkPut(records)
    await db.deckMeta.put({
      deckId,
      wordCount: words.length,
      loadedAt: Date.now(),
      sourceVersion,
    })
  })
}

/** 按 deckId 读取全部词条。 */
export async function getWordsByDeck(deckId: string): Promise<WordRecord[]> {
  return db.words.where('deckId').equals(deckId).toArray()
}

/** 按主键读取单词。 */
export async function getWord(id: string): Promise<WordRecord | undefined> {
  return db.words.get(id)
}

/** 删除某个词库的全部词条与复习卡（事务）。 */
export async function deleteDeck(deckId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.words, db.reviewCards, db.deckMeta],
    async () => {
      await db.words.where('deckId').equals(deckId).delete()
      await db.reviewCards.where('deckId').equals(deckId).delete()
      await db.deckMeta.delete(deckId)
    },
  )
}

/** 词库中词条总数。 */
export async function countWords(deckId: string): Promise<number> {
  return db.words.where('deckId').equals(deckId).count()
}