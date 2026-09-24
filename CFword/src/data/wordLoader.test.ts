import { describe, it, expect } from 'vitest'
import { validateWords } from './wordLoader'

describe('validateWords', () => {
  it('合法数组返回空错误列表', () => {
    const errors = validateWords([
      { id: 'a1', word: 'ability', senses: [{ definition_cn: '能力' }] },
    ])
    expect(errors).toHaveLength(0)
  })

  it('空数组报错', () => {
    expect(validateWords([]).length).toBeGreaterThan(0)
  })

  it('非数组报错', () => {
    expect(validateWords({}).length).toBeGreaterThan(0)
  })

  it('缺少 senses[0].definition_cn 报错', () => {
    const errors = validateWords([{ id: 'a1', word: 'ability', senses: [{}] }])
    expect(errors.some((e) => e.includes('definition_cn'))).toBe(true)
  })

  it('id 重复报错', () => {
    const errors = validateWords([
      { id: 'a1', word: 'ability', senses: [{ definition_cn: '能力' }] },
      { id: 'a1', word: 'accept', senses: [{ definition_cn: '接受' }] },
    ])
    expect(errors.some((e) => e.includes('重复'))).toBe(true)
  })
})