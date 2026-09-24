import Dexie from 'dexie'
import { db } from './schema'
import type { ReviewCard, ReviewLog } from '../types'

/** 获取某词库中已到期、非新卡的复习卡（按 due 升序，截取 limit）。 */
export async function getDueReviewCards(
  deckId: string,
  now: number,
  limit: number,
): Promise<ReviewCard[]> {
  const cards = await db.reviewCards
    .where('[deckId+due]')
    .between([deckId, Dexie.minKey], [deckId, now])
    .toArray()
  return cards
    .filter((c) => c.state !== 0) // 排除未学习的新卡
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
}

/** 获取某词库中的新卡（state=0），按创建时间（due）升序。 */
export async function getNewCards(
  deckId: string,
  limit: number,
): Promise<ReviewCard[]> {
  const cards = await db.reviewCards.where('deckId').equals(deckId).toArray()
  return cards
    .filter((c) => c.state === 0)
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
}

/** 读取单张卡片。 */
export async function getCard(wordId: string): Promise<ReviewCard | undefined> {
  return db.reviewCards.get(wordId)
}

/** 读取某词库全部卡片。 */
export async function getCardsByDeck(deckId: string): Promise<ReviewCard[]> {
  return db.reviewCards.where('deckId').equals(deckId).toArray()
}

/** 写入/更新一张卡片。 */
export async function upsertCard(card: ReviewCard): Promise<void> {
  await db.reviewCards.put(card)
}

/** 批量写入卡片（事务）。 */
export async function bulkUpsertCards(cards: ReviewCard[]): Promise<void> {
  if (cards.length === 0) return
  await db.transaction('rw', db.reviewCards, async () => {
    await db.reviewCards.bulkPut(cards)
  })
}

/** 写入新卡（为未排程的词条建卡），幂等。 */
export async function ensureCardsForWords(
  wordIds: string[],
  deckId: string,
  createCard: (wordId: string, deckId: string) => ReviewCard,
): Promise<void> {
  if (wordIds.length === 0) return
  const existing = await db.reviewCards.bulkGet(wordIds)
  const missing: ReviewCard[] = []
  wordIds.forEach((id, i) => {
    if (!existing[i]) missing.push(createCard(id, deckId))
  })
  await bulkUpsertCards(missing)
}

/** 统计某词库卡片总数。 */
export async function countCards(deckId: string): Promise<number> {
  return db.reviewCards.where('deckId').equals(deckId).count()
}

/** 找出某词库中尚未建卡（未进入学习）的词条 id。 */
export async function getUncardedWordIds(
  deckId: string,
  limit: number,
): Promise<string[]> {
  const wordIds = await db.words.where('deckId').equals(deckId).primaryKeys()
  const cardIds = new Set(
    await db.reviewCards.where('deckId').equals(deckId).primaryKeys(),
  )
  return (wordIds as string[])
    .filter((id) => !cardIds.has(id))
    .sort()
    .slice(0, limit)
}

/** 原子地应用一次复习：更新卡片 + 写入日志。 */
export async function applyReview(
  card: ReviewCard,
  log: ReviewLog,
): Promise<void> {
  await db.transaction('rw', [db.reviewCards, db.reviewLogs], async () => {
    await db.reviewCards.put(card)
    await db.reviewLogs.add(log)
  })
}