import type { ImportPreview, ImportStage } from '@/types'
import type { BookRecord, ChapterRecord } from '@/db'
import { uid, chapterId } from '@/utils/id'
import { putBook, deleteBook } from '@/db/bookRepo'
import { bulkPutChapters, deleteChaptersByNovel } from '@/db/chapterRepo'
import { useBookStore } from '@/store/bookStore'
import { detectEncoding, decodeBytes } from './encoding'
import { parseText } from './txtParser'
import { yieldToMain } from './progress'

export interface ImportOverrides {
  title: string
  author: string
  category: string
  tags: string[]
  encoding: string
}

export type ProgressFn = (stage: ImportStage, progress: number) => void

/** 读取文件为字节数组 */
export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}

/** 构建导入预览（按 detect 或指定编码解码 + 分章） */
export function buildPreview(
  fileName: string,
  fileSize: number,
  bytes: Uint8Array,
  encoding?: string,
): ImportPreview {
  const detection = detectEncoding(bytes)
  const enc = encoding ?? detection.encoding
  const rawText = decodeBytes(bytes, enc)
  const parsed = parseText(rawText, fileName)
  return {
    fileName,
    fileSize,
    detectedEncoding: enc,
    encodingConfidence: detection.confidence,
    suggestedTitle: parsed.title,
    suggestedAuthor: parsed.author,
    chapterCount: parsed.chapters.length,
    wordCount: parsed.wordCount,
    firstChapterTitles: parsed.chapters.slice(0, 3).map((c) => c.title),
    matchedHeadingCount: parsed.matchedHeadingCount,
    rawText,
  }
}

/** 提交导入：写库（每批 20 章）→ 加入书架 → 返回 novelId */
export async function commitImport(
  bytes: Uint8Array,
  fileName: string,
  overrides: ImportOverrides,
  onProgress: ProgressFn,
): Promise<string> {
  const novelId = `imported-${uid()}`

  onProgress('decoding', 30)
  const rawText = decodeBytes(bytes, overrides.encoding)
  const parsed = parseText(rawText, fileName)

  onProgress('decoding', 45)
  await yieldToMain()

  const now = Date.now()
  const book: BookRecord = {
    id: novelId,
    title: overrides.title.trim() || fileName,
    author: overrides.author.trim() || '佚名',
    cover: '',
    intro: '',
    tags: overrides.tags,
    category: overrides.category,
    status: 'completed',
    wordCount: parsed.wordCount,
    chapterCount: parsed.chapters.length,
    updatedAt: new Date().toISOString(),
    rating: 0,
    source: 'imported',
    encoding: overrides.encoding,
    importedAt: now,
    originalFileName: fileName,
  }

  onProgress('splitting', 55)
  await yieldToMain()

  try {
    await putBook(book)

    onProgress('saving', 60)
    const records: ChapterRecord[] = parsed.chapters.map((c) => ({
      id: chapterId(novelId, c.index),
      novelId,
      index: c.index,
      title: c.title,
      content: c.content,
      wordCount: c.wordCount,
    }))

    const batchSize = 20
    for (let i = 0; i < records.length; i += batchSize) {
      await bulkPutChapters(records.slice(i, i + batchSize))
      onProgress('saving', 60 + ((i + batchSize) / records.length) * 35)
      await yieldToMain()
    }
  } catch (e) {
    // 回滚：清理已写入的书与章节
    try {
      await deleteBook(novelId)
      await deleteChaptersByNovel(novelId)
    } catch {
      /* ignore rollback failure */
    }
    throw e
  }

  useBookStore.getState().addToShelf(novelId)
  onProgress('done', 100)
  return novelId
}