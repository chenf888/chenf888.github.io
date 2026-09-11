import manifest from '@/novels/manifest.json'
import type {
  Chapter,
  ChapterMeta,
  Novel,
  PresetNovelManifest,
  PresetNovelManifestEntry,
} from '@/types'
import { chapterId } from '@/utils/id'
import { splitChapters } from '@/services/importer/chapterSplitter'

// manifest.json 为作者维护的静态数据，只校正 status 的字符串字面量类型
const MANIFEST: PresetNovelManifest = manifest.map((e) => ({
  ...e,
  status: e.status === 'completed' ? 'completed' : 'serializing',
}))

/** 资源 URL：必须用 BASE_URL 拼接，禁止硬编码 /novels/... */
function assetUrl(relative: string): string {
  return `${import.meta.env.BASE_URL}${relative}`
}

function buildNovel(entry: PresetNovelManifestEntry): Novel {
  return {
    id: entry.id,
    title: entry.title,
    author: entry.author,
    cover: entry.coverFile ? assetUrl(`novels/covers/${entry.coverFile}`) : '',
    intro: entry.intro,
    tags: entry.tags,
    category: entry.category,
    status: entry.status,
    wordCount: 0,
    chapterCount: 0,
    updatedAt: entry.updatedAt,
    rating: entry.rating,
    source: 'preset',
  }
}

export interface PresetCache {
  novel: Novel
  metas: ChapterMeta[]
  content: Map<string, string>
}

const cache = new Map<string, PresetCache>()
let manifestNovels: Novel[] | null = null

/** 在内存中缓存一份已加载的预置书；wordCount/chapterCount 在首次加载时补全 */
async function ensureLoaded(id: string): Promise<PresetCache> {
  const hit = cache.get(id)
  if (hit) return hit
  const entry = MANIFEST.find((e) => e.id === id)
  if (!entry) throw new Error('BOOK_NOT_FOUND')

  const url = assetUrl(`novels/texts/${entry.textFile}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error('TEXT_LOAD_FAILED')
  const text = await res.text()

  const { chapters } = splitChapters(text)
  const novel = buildNovel(entry)
  novel.chapterCount = chapters.length
  novel.wordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0)

  const metas: ChapterMeta[] = chapters.map((c) => ({
    id: chapterId(id, c.index),
    novelId: id,
    index: c.index,
    title: c.title,
    wordCount: c.wordCount,
  }))
  const content = new Map<string, string>(
    chapters.map((c) => [chapterId(id, c.index), c.content]),
  )

  const record: PresetCache = { novel, metas, content }
  cache.set(id, record)
  return record
}

export async function getPresetNovels(): Promise<Novel[]> {
  if (manifestNovels) return manifestNovels
  const novels = await Promise.all(
    MANIFEST.map(async (entry) => (await ensureLoaded(entry.id)).novel),
  )
  manifestNovels = novels
  return novels
}

export async function getPresetNovel(id: string): Promise<Novel | null> {
  const entry = MANIFEST.find((e) => e.id === id)
  if (!entry) return null
  return (await ensureLoaded(id)).novel
}

export async function getPresetChapterMetas(id: string): Promise<ChapterMeta[]> {
  return (await ensureLoaded(id)).metas
}

export async function getPresetChapter(
  id: string,
  chapterIdValue: string,
): Promise<Chapter | null> {
  const record = await ensureLoaded(id)
  const meta = record.metas.find((m) => m.id === chapterIdValue)
  if (!meta) return null
  const content = record.content.get(chapterIdValue) ?? ''
  return { ...meta, content }
}