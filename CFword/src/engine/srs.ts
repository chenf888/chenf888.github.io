import { FSRS, Rating, State, createEmptyCard, type Card, type Grade } from 'ts-fsrs'
import type { ReviewCard, RatingValue } from '../types'

/** FSRS 评分档 → ts-fsrs Rating 枚举 */
const ratingMap: Record<RatingValue, Rating> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
}

/** FSRS 可调配置 */
export interface FsrsConfig {
  maximumInterval: number
  requestRetention: number
}

const MAX_INTERVAL = 36500

let instance: FSRS | null = null
let currentConfig: FsrsConfig = {
  maximumInterval: MAX_INTERVAL,
  requestRetention: 0.9,
}

/** 获取（并按需重建）FSRS 实例。 */
export function getFsrs(config?: Partial<FsrsConfig>): FSRS {
  const next: FsrsConfig = { ...currentConfig, ...config }
  if (
    !instance ||
    next.maximumInterval !== currentConfig.maximumInterval ||
    next.requestRetention !== currentConfig.requestRetention
  ) {
    instance = new FSRS({
      maximum_interval: next.maximumInterval,
      request_retention: next.requestRetention,
      enable_fuzz: true,
    })
    currentConfig = next
  }
  return instance
}

/** 存储的 ReviewCard → ts-fsrs Card */
export function toTsCard(record: ReviewCard): Card {
  return {
    due: new Date(record.due),
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsedDays,
    scheduled_days: record.scheduledDays,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state as State,
    last_review:
      record.lastReview != null ? new Date(record.lastReview) : undefined,
  }
}

/** ts-fsrs Card → 存储的 ReviewCard */
export function fromTsCard(card: Card, wordId: string, deckId: string): ReviewCard {
  return {
    wordId,
    deckId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? card.last_review.getTime() : null,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
  }
}

/** 为一词创建新卡（state=New）。 */
export function createCardRecord(
  wordId: string,
  deckId: string,
  now = new Date(),
): ReviewCard {
  const card = createEmptyCard(now)
  return fromTsCard(card, wordId, deckId)
}

/** 一次复习的结果 */
export interface ReviewOutcome {
  card: ReviewCard
  rating: RatingValue
  previousState: number
}

/** 按评分对卡片进行一次 FSRS 复习，返回新卡片状态。 */
export function reviewCardRecord(
  record: ReviewCard,
  rating: RatingValue,
  now = new Date(),
  config?: Partial<FsrsConfig>,
): ReviewOutcome {
  const f = getFsrs(config)
  const result = f.repeat(toTsCard(record), now)
  const picked = result[ratingMap[rating] as Grade]
  if (!picked) throw new Error(`无效评分: ${rating}`)
  return {
    card: fromTsCard(picked.card, record.wordId, record.deckId),
    rating,
    previousState: record.state,
  }
}

/** State 枚举 → 可读名称 */
export function stateName(state: number): string {
  return State[state] ?? 'New'
}