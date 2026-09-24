import { describe, it, expect } from 'vitest'
import {
  pickQuestionType,
  generateQuestion,
  isSpellingCorrect,
  pickDistractors,
} from './questionGenerator'
import type { WordRecord } from '../types'

function makeWord(
  id: string,
  word: string,
  cn: string,
  pos = 'v.',
  extra: Partial<WordRecord> = {},
): WordRecord {
  return { id, word, pos, deckId: 'd1', senses: [{ definition_cn: cn }], tags: ['t'], ...extra }
}

const pool = [
  makeWord('w1', 'ability', '能力', 'n.'),
  makeWord('w2', 'accept', '接受'),
  makeWord('w3', 'achieve', '实现'),
  makeWord('w4', 'advice', '建议', 'n.'),
]

describe('questionGenerator', () => {
  it('首次题型为 cn2en', () => {
    expect(pickQuestionType(0, pool[0]!)).toBe('cn2en')
  })

  it('第 4 次以后题型为拼写/填空/搭配之一', () => {
    const t = pickQuestionType(5, pool[0]!)
    expect(['spelling', 'cloze', 'collocation']).toContain(t)
  })

  it('cn2en 生成 4 个选项且包含正确答案', () => {
    const q = generateQuestion('cn2en', pool[0]!, pool)
    expect(q.choices).toHaveLength(4)
    expect(q.choices).toContain('ability')
    expect(q.answer).toBe('ability')
  })

  it('干扰项不包含目标词', () => {
    const distractors = pickDistractors(pool[0]!, pool)
    expect(distractors.map((w) => w.id)).not.toContain('w1')
  })

  it('拼写判定忽略大小写与首尾空格', () => {
    expect(isSpellingCorrect(' Ability ', 'ability')).toBe(true)
    expect(isSpellingCorrect('able', 'ability')).toBe(false)
  })
})