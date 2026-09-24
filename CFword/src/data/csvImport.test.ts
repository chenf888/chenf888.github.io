import { describe, it, expect } from 'vitest'
import { parseCsv } from './csvImport'

describe('parseCsv', () => {
  it('解析 word,definition_cn 两列', () => {
    const words = parseCsv('ability,能力\naccept,接受\n')
    expect(words).toHaveLength(2)
    expect(words[0]!.word).toBe('ability')
    expect(words[0]!.senses[0]!.definition_cn).toBe('能力')
  })

  it('跳过表头与空行', () => {
    const words = parseCsv('word,definition_cn\nability,能力\n\n')
    expect(words).toHaveLength(1)
  })

  it('支持双引号字段', () => {
    const words = parseCsv('"hello, world",你好\n')
    expect(words[0]!.word).toBe('hello, world')
  })

  it('按单词去重', () => {
    const words = parseCsv('ability,能力\nABILITY,能力\n')
    expect(words).toHaveLength(1)
  })
})