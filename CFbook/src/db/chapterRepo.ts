import { getDB, type ChapterRecord } from './index'
import type { Chapter, ChapterMeta } from '@/types'

/** 将存储异常归一化为配额错误 */
function asQuotaError(e: unknown): Error {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    const err = new Error('存储空间不足，导入失败')
    Object.assign(err, { code: 'QUOTA_EXCEEDED' })
    return err
  }
  if (e instanceof Error && e.name === 'ConstraintError') {
    const err = new Error('数据写入冲突，导入失败')
    Object.assign(err, { code: 'CONSTRAINT' })
    return err
  }
  if (e instanceof Error) return e
  return new Error('写入数据库失败')
}

/** 批量写入章节（单事务），配额不足时抛出 code=QUOTA_EXCEEDED */
export async function bulkPutChapters(records: ChapterRecord[]): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('chapters', 'readwrite')
    await Promise.all(records.map((r) => tx.store.put(r)))
    await tx.done
  } catch (e) {
    throw asQuotaError(e)
  }
}

/** 查询单章正文 */
export async function getChapter(
  novelId: string,
  id: string,
): Promise<Chapter | null> {
  const db = await getDB()
  const rec = await db.get('chapters', id)
  if (!rec || rec.novelId !== novelId) return null
  return { id: rec.id, novelId: rec.novelId, index: rec.index, title: rec.title, content: rec.content, wordCount: rec.wordCount }
}

/** 查询某书的全部章节元信息（按 index 升序） */
export async function getChapterMetas(novelId: string): Promise<ChapterMeta[]> {
  const db = await getDB()
  const list = await db.getAllFromIndex('chapters', 'by-novel', novelId)
  return list
    .sort((a, b) => a.index - b.index)
    .map((r) => ({
      id: r.id,
      novelId: r.novelId,
      index: r.index,
      title: r.title,
      wordCount: r.wordCount,
    }))
}

/** 统计某书章节数 */
export async function countChapters(novelId: string): Promise<number> {
  const db = await getDB()
  return (await db.countFromIndex('chapters', 'by-novel', novelId)) as number
}

/** 删除某书全部章节 */
export async function deleteChaptersByNovel(novelId: string): Promise<void> {
  const db = await getDB()
  const keys = await db.getAllKeysFromIndex('chapters', 'by-novel', novelId)
  const tx = db.transaction('chapters', 'readwrite')
  for (const k of keys) await tx.store.delete(k)
  await tx.done
}