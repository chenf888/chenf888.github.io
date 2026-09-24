import type { ReviewCard, ReviewLog, WordRecord } from '../types'

export interface DailyCount {
  /** YYYY-MM-DD */
  date: string
  count: number
}

export interface WeakWord {
  wordId: string
  word: string
  lapses: number
}

export interface StatsSnapshot {
  heatmap: DailyCount[]
  retention: number
  future: DailyCount[]
  weakWords: WeakWord[]
  totalStudyMs: number
  totalReviews: number
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function range(startKey: string, days: number): string[] {
  const out: string[] = []
  const [y, m, d] = startKey.split('-').map(Number) as [number, number, number]
  const base = new Date(y, m - 1, d)
  for (let i = 0; i < days; i++) {
    const cur = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    out.push(dayKey(cur.getTime()))
  }
  return out
}

/**
 * 计算统计快照（纯函数，可在 Web Worker 中调用）。
 * @param days 热力图跨度天数（12 周 = 84）
 */
export function computeStats(
  cards: ReviewCard[],
  logs: ReviewLog[],
  words: WordRecord[],
  now: number,
  days = 84,
): StatsSnapshot {
  // 12 周热力图（倒推 days 天）
  const start = dayKey(now - (days - 1) * 86400000)
  const heatKeys = range(start, days)
  const heatMap = new Map(heatKeys.map((k) => [k, 0]))
  for (const log of logs) {
    const k = dayKey(log.reviewedAt)
    const cur = heatMap.get(k)
    if (cur != null) heatMap.set(k, cur + 1)
  }
  const heatmap: DailyCount[] = heatKeys.map((date) => ({
    date,
    count: heatMap.get(date) ?? 0,
  }))

  // 记忆保持率：rating >= 3 比例
  const retention =
    logs.length === 0
      ? 0
      : logs.filter((l) => l.rating >= 3).length / logs.length

  // 未来复习量预测：按 due 聚合（未来 30 天）
  const futureMap = new Map<string, number>()
  const futureStart = dayKey(now)
  const futureKeys = range(futureStart, 30)
  futureKeys.forEach((k) => futureMap.set(k, 0))
  for (const card of cards) {
    if (card.state === 0) continue // 新卡不计入预测
    if (card.due < now) continue
    const k = dayKey(card.due)
    const cur = futureMap.get(k)
    if (cur != null) futureMap.set(k, cur + 1)
  }
  const future: DailyCount[] = futureKeys.map((date) => ({
    date,
    count: futureMap.get(date) ?? 0,
  }))

  // 薄弱词：按 lapses 降序
  const wordMap = new Map(words.map((w) => [w.id, w.word]))
  const weakWords: WeakWord[] = cards
    .filter((c) => c.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 20)
    .map((c) => ({
      wordId: c.wordId,
      word: wordMap.get(c.wordId) ?? c.wordId,
      lapses: c.lapses,
    }))

  // 学习时长
  const totalStudyMs = logs.reduce((sum, l) => sum + l.responseTimeMs, 0)

  return {
    heatmap,
    retention,
    future,
    weakWords,
    totalStudyMs,
    totalReviews: logs.length,
  }
}