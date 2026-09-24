import { describe, it, expect } from 'vitest'
import { createCardRecord, reviewCardRecord, stateName } from './srs'

describe('srs 封装', () => {
  it('新卡 state 为 New(0)', () => {
    const c = createCardRecord('w1', 'd1', new Date(2026, 0, 1))
    expect(c.wordId).toBe('w1')
    expect(c.state).toBe(0)
    expect(c.reps).toBe(0)
    expect(stateName(c.state)).toBe('New')
  })

  it('评分 Good(3) 后离开 New 并后移到期时间', () => {
    const c = createCardRecord('w1', 'd1', new Date(2026, 0, 1))
    const r = reviewCardRecord(c, 3, new Date(2026, 0, 2))
    expect(r.card.state).not.toBe(0)
    expect(r.card.reps).toBeGreaterThan(0)
    expect(r.card.due).toBeGreaterThan(c.due)
  })

  it('评分 Again(1) 后到期时间不会大幅后移', () => {
    const c = createCardRecord('w1', 'd1', new Date(2026, 0, 1))
    const r = reviewCardRecord(c, 1, new Date(2026, 0, 2))
    expect(r.card.due).toBeLessThanOrEqual(new Date(2026, 0, 3).getTime())
  })
})