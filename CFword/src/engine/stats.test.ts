import { describe, it, expect } from 'vitest'
import { computeStats } from './stats'
import type { ReviewCard, ReviewLog, WordRecord } from '../types'

const word: WordRecord = {
  id: 'w1',
  word: 'ability',
  deckId: 'd1',
  senses: [{ definition_cn: '能力' }],
}

const card: ReviewCard = {
  wordId: 'w1',
  deckId: 'd1',
  due: Date.now() + 86400000,
  stability: 5,
  difficulty: 5,
  reps: 3,
  lapses: 2,
  state: 2,
  lastReview: Date.now(),
  elapsedDays: 0,
  scheduledDays: 10,
}

const logs: ReviewLog[] = [
  {
    id: 1,
    wordId: 'w1',
    deckId: 'd1',
    rating: 3,
    responseTimeMs: 5000,
    questionType: 'cn2en',
    reviewedAt: Date.now(),
    previousState: 0,
    nextState: 1,
  },
  {
    id: 2,
    wordId: 'w1',
    deckId: 'd1',
    rating: 1,
    responseTimeMs: 3000,
    questionType: 'spelling',
    reviewedAt: Date.now(),
    previousState: 1,
    nextState: 1,
  },
]

describe('computeStats', () => {
  it('计算记忆保持率与学习时长', () => {
    const s = computeStats([card], logs, [word], Date.now())
    expect(s.totalReviews).toBe(2)
    expect(s.retention).toBe(0.5) // 一次 >= 3，一次 < 3
    expect(s.totalStudyMs).toBe(8000)
  })

  it('lapses > 0 的词进入薄弱词', () => {
    const s = computeStats([card], logs, [word], Date.now())
    expect(s.weakWords).toHaveLength(1)
    expect(s.weakWords[0]!.word).toBe('ability')
  })

  it('热力图覆盖 84 天', () => {
    const s = computeStats([card], logs, [word], Date.now())
    expect(s.heatmap).toHaveLength(84)
  })
})