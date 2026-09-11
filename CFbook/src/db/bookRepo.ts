import { getDB, type BookRecord } from './index'
import type { Novel } from '@/types'

/** 写入/更新一本书（导入书专用） */
export async function putBook(book: BookRecord): Promise<void> {
  const db = await getDB()
  await db.put('books', book)
}

/** 按 id 查询书，不存在返回 null */
export async function getBook(id: string): Promise<Novel | null> {
  const db = await getDB()
  return (await db.get('books', id)) ?? null
}

/** 查询全部导入书，按导入时间倒序 */
export async function getAllBooks(): Promise<Novel[]> {
  const db = await getDB()
  const all = await db.getAll('books')
  return all.sort((a, b) => (b.importedAt ?? 0) - (a.importedAt ?? 0))
}

/** 删除一本书（正文由 chapterRepo.deleteChaptersByNovel 单独清理） */
export async function deleteBook(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('books', id)
}