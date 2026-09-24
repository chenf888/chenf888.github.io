import { computeStats } from '../engine/stats'
import type { ReviewCard, ReviewLog, WordRecord } from '../types'

interface StatsMessage {
  cards: ReviewCard[]
  logs: ReviewLog[]
  words: WordRecord[]
  now: number
  days: number
}

self.onmessage = (e: MessageEvent<StatsMessage>) => {
  const { cards, logs, words, now, days } = e.data
  const result = computeStats(cards, logs, words, now, days)
  self.postMessage(result)
}