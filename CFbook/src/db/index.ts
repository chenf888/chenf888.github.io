import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/constants'
import type { Novel } from '@/types'

/** 导入书在 IDB 中的记录：Novel + 必填 importedAt */
export type BookRecord = Novel & { importedAt: number }

/** 章节在 IDB 中的记录 */
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

/** 惰性打开数据库（单例），失败向上抛出由调用方处理 */
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