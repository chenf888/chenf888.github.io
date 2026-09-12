import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/constants'
import type { Novel } from '@/types'

export type BookRecord = Novel & { importedAt: number }

export interface ChapterRecord {
  id: string
  novelId: string
  index: number
  title: string
  content: string
  wordCount: number
}

export interface CFBookDB extends DBSchema {
  books: {
    key: string
    value: BookRecord
    indexes: { 'by-importedAt': number }
  }
  chapters: {
    key: string
    value: ChapterRecord
    indexes: { 'by-novel': string; 'by-novel-index': [string, number] }
  }
}

let dbPromise: Promise<IDBPDatabase<CFBookDB>> | null = null

export function getDB(): Promise<IDBPDatabase<CFBookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CFBookDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const books = db.createObjectStore('books', { keyPath: 'id' })
        books.createIndex('by-importedAt', 'importedAt')
        const chapters = db.createObjectStore('chapters', { keyPath: 'id' })
        chapters.createIndex('by-novel', 'novelId')
        chapters.createIndex('by-novel-index', ['novelId', 'index'])
      },
    })
  }
  return dbPromise
}