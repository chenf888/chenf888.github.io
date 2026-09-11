import type { Chapter, ChapterMeta } from '@/types'
import { chapterId } from '@/utils/id'
import { hashString, countWords } from '@/utils/text'
import {
  NAMES,
  PLACES,
  ITEMS,
  EMOTIONS,
  ACTIONS,
  TIMES,
  CHAPTER_TITLES,
  TEMPLATES,
} from './wordbank'

/** mulberry32 确定性伪随机数生成器 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

/** 填充一句模板 */
function fillSentence(rnd: () => number): string {
  const tpl = pick(rnd, TEMPLATES)
  const map: Record<string, string> = {
    '{p}': pick(rnd, NAMES),
    '{q}': pick(rnd, NAMES),
    '{place}': pick(rnd, PLACES),
    '{item}': pick(rnd, ITEMS),
    '{emo}': pick(rnd, EMOTIONS),
    '{act}': pick(rnd, ACTIONS),
    '{time}': pick(rnd, TIMES),
  }
  return tpl.replace(/\{(p|q|place|item|emo|act|time)\}/g, (m) => map[m])
}

/** 生成一个段落：1~3 句 */
function generateParagraph(rnd: () => number): string {
  const n = 1 + Math.floor(rnd() * 3)
  const sents: string[] = []
  for (let i = 0; i < n; i++) sents.push(fillSentence(rnd))
  return sents.join('')
}

const metaCache = new Map<string, ChapterMeta[]>()
const contentCache = new Map<string, string>()

/** 确定性生成某章正文，同一 novelId+index 每次一致 */
function generateContent(novelId: string, index: number): string {
  const rnd = mulberry32(hashString(`${novelId}::${index}`))
  const paraCount = 20 + Math.floor(rnd() * 10)
  const paras: string[] = []
  for (let i = 0; i < paraCount; i++) paras.push(generateParagraph(rnd))
  return paras.join('\n\n')
}

/** 确定性生成章节标题 */
function generateTitle(novelId: string, index: number): string {
  const rnd = mulberry32(hashString(`${novelId}::title::${index}`))
  return pick(rnd, CHAPTER_TITLES)
}

/** 章节元信息（惰性·内存缓存） */
export function getDemoChapterMetas(novelId: string, chapterCount: number): ChapterMeta[] {
  const cached = metaCache.get(novelId)
  if (cached) return cached
  const metas: ChapterMeta[] = []
  for (let i = 1; i <= chapterCount; i++) {
    metas.push({
      id: chapterId(novelId, i),
      novelId,
      index: i,
      title: generateTitle(novelId, i),
      wordCount: 1000 + (hashString(`${novelId}::${i}`) % 500),
    })
  }
  metaCache.set(novelId, metas)
  return metas
}

/** 章节正文（惰性·内存缓存） */
export function getDemoChapterContent(novelId: string, index: number): string {
  const key = `${novelId}::${index}`
  const cached = contentCache.get(key)
  if (cached) return cached
  const content = generateContent(novelId, index)
  contentCache.set(key, content)
  return content
}

/** 完整章节对象 */
export function getDemoChapter(novelId: string, index: number): Chapter {
  const content = getDemoChapterContent(novelId, index)
  return {
    id: chapterId(novelId, index),
    novelId,
    index,
    title: generateTitle(novelId, index),
    content,
    wordCount: countWords(content),
  }
}