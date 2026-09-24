import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './schema'
import { buildBackup, validateBackup, importBackup } from './backup'
import { importWords } from './wordRepo'
import { upsertCard } from './cardRepo'
import { createCardRecord } from '../engine/srs'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('备份导出导入', () => {
  it('校验非法 schemaVersion 抛错', () => {
    expect(() => validateBackup({ schemaVersion: 999 })).toThrow('schemaVersion')
  })

  it('导出包含自定义词与复习卡', async () => {
    await importWords(
      'custom',
      [{ id: 'c1', word: 'test', senses: [{ definition_cn: '测试' }], tags: ['custom'] }],
      'v1',
    )
    await upsertCard(createCardRecord('c1', 'custom', new Date()))

    const backup = await buildBackup(true)
    expect(backup.customWords).toHaveLength(1)
    expect(backup.reviewCards).toHaveLength(1)
  })

  it('导入后数据恢复', async () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings: { newCardsPerDay: 20 },
      deckMeta: [],
      reviewCards: [],
      reviewLogs: [],
      customWords: [
        { id: 'c2', word: 'imported', senses: [{ definition_cn: '已导入' }], tags: ['custom'], deckId: 'custom' },
      ],
    }
    await importBackup(backup)
    const words = await db.words.where('deckId').equals('custom').toArray()
    expect(words).toHaveLength(1)
    expect(words[0]!.word).toBe('imported')
  })
})