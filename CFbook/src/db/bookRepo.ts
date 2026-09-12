import { getDB, type BookRecord } from './index'
import type { Novel } from '@/types'
export async function putBook(book: BookRecord): Promise<void> {
  const db = await getDB()
  await db.put('books', book)
}

export async function getBook(id: string): Promise<Novel | null> {
  const db = await getDB()
  return (await db.get('books', id)) ?? null
}

export async function getAllBooks(): Promise<Novel[]> {
  const db = await getDB()
  const all = await db.getAll('books')
  return all.sort((a, b) => (b.importedAt ?? 0) - (a.importedAt ?? 0))
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('books', id)
}