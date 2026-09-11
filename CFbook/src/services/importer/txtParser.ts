import type { ParsedBook } from '@/types'
import { cleanText } from '@/utils/text'
import { splitChapters } from './chapterSplitter'
import { suggestTitle, suggestAuthor } from './meta'

export type ParsedText = Omit<ParsedBook, 'encoding'>

/** 对已解码文本做结构解析：书名/作者猜测 + 分章 + 字数统计 */
export function parseText(rawText: string, fileName: string): ParsedText {
  const text = cleanText(rawText)
  const { chapters, matchedHeadingCount } = splitChapters(text)
  const wordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0)
  return {
    title: suggestTitle(fileName, text),
    author: suggestAuthor(text),
    chapters,
    wordCount,
    matchedHeadingCount,
  }
}