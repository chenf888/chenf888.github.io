import type { ParsedChapter } from '@/types'
import { cleanText, countWords } from '@/utils/text'

/**
 * 章节识别：预置书与导入书共用。
 * 参考 koodo-reader（MIT）/ calibre 的中文章节识别思路，仅自实现正则。
 */

const HEADING_RE = /^\s*(?:#{1,6}\s*)?(?:第\s*[零一二三四五六七八九十百千万两\d]+\s*[章卷节回部篇])\s*[^\n]{0,50}$/
// 数字 + 点/顿号 + 标题；`(?!\d)` 排除日期/百分比等（如 `1997.04.13`、`99.7%`）
const ALT_HEADING_RE = /^\s*(?:#{1,6}\s*)?(?:Chapter\s+\d+|\d+\s*[.、]\s*(?!\d)\S{1,50})$/i

function isHeading(line: string): boolean {
  return HEADING_RE.test(line) || ALT_HEADING_RE.test(line)
}

/** 去除章节标题行可能带有的 markdown # 前缀（如 `# 第1章：锈迹`） */
function stripMarkdownHeading(line: string): string {
  return line.trim().replace(/^#{1,6}\s*/, '')
}

/** 兜底：每 size 字切一章，尽量在换行处断开 */
function splitBySize(text: string, size: number): string[] {
  const paragraphs = text.split('\n')
  const chunks: string[] = []
  let buf: string[] = []
  let len = 0
  for (const p of paragraphs) {
    if (len + p.length > size && buf.length > 0) {
      chunks.push(buf.join('\n'))
      buf = []
      len = 0
    }
    buf.push(p)
    len += p.length
  }
  if (buf.length > 0) chunks.push(buf.join('\n'))
  return chunks
}

function reindex(chapters: ParsedChapter[]): ParsedChapter[] {
  return chapters.map((c, i) => ({ ...c, index: i + 1 }))
}

export interface SplitResult {
  chapters: ParsedChapter[]
  matchedHeadingCount: number
}

/**
 * 分章主流程：
 * - 命中 ≥2 个章节标题 → 按标题行分界；
 * - 否则按每 3000 字兜底分章，matchedHeadingCount = 0。
 */
export function splitChapters(raw: string): SplitResult {
  const text = cleanText(raw)
  const lines = text.split('\n')

  const headingIndices: number[] = []
  lines.forEach((line, i) => {
    if (isHeading(line)) headingIndices.push(i)
  })

  if (headingIndices.length >= 2) {
    const chapters: ParsedChapter[] = []
    for (let k = 0; k < headingIndices.length; k++) {
      const start = headingIndices[k]
      const end = k + 1 < headingIndices.length ? headingIndices[k + 1] : lines.length
      const content = lines.slice(start + 1, end).join('\n').trim()
      chapters.push({
        index: k + 1,
        title: stripMarkdownHeading(lines[start]),
        content,
        wordCount: countWords(content),
      })
    }
    const filtered = chapters.filter((c) => c.wordCount > 0)
    return { chapters: reindex(filtered), matchedHeadingCount: headingIndices.length }
  }

  const chunks = splitBySize(text, 3000)
  const chapters: ParsedChapter[] = chunks.map((content, i) => ({
    index: i + 1,
    title: `第 ${i + 1} 章`,
    content,
    wordCount: countWords(content),
  }))
  return { chapters, matchedHeadingCount: 0 }
}