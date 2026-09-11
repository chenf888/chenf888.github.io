import type { CategoryKey, Chapter, ChapterMeta, Novel, NovelSource } from '@/types'
import { getPresetNovels, getPresetNovel, getPresetChapterMetas, getPresetChapter } from '@/services/preset/loader'
import { getBook, getAllBooks, deleteBook } from '@/db/bookRepo'
import { getChapter as getImportedChapter, getChapterMetas as getImportedChapterMetas, deleteChaptersByNovel } from '@/db/chapterRepo'
import { useBookStore } from '@/store/bookStore'

export interface GetNovelsParams {
  category?: CategoryKey
  keyword?: string
  source?: NovelSource
}

const SOURCE_RANK: Record<NovelSource, number> = { preset: 0, imported: 1 }

function byDateDesc(a: Novel, b: Novel): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

/** 统一数据出口：页面/组件不感知来源（preset / imported） */
export async function getNovels(p?: GetNovelsParams): Promise<Novel[]> {
  const [preset, imported] = await Promise.all([getPresetNovels(), getAllBooks()])
  let list = [...preset, ...imported]

  if (p?.source) list = list.filter((n) => n.source === p.source)

  if (p?.category) {
    if (p.category === 'recommend') {
      list.sort((a, b) => b.rating - a.rating || byDateDesc(a, b))
    } else if (p.category === 'completed') {
      list = list.filter((n) => n.status === 'completed')
    } else {
      list = list.filter((n) => n.category === p.category)
    }
  }

  if (p?.keyword) {
    const kw = p.keyword.trim().toLowerCase()
    if (kw) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          n.author.toLowerCase().includes(kw) ||
          n.tags.some((t) => t.toLowerCase().includes(kw)),
      )
    }
  }

  if (p?.category !== 'recommend') {
    list = [...list].sort((a, b) => {
      const rs = SOURCE_RANK[a.source] - SOURCE_RANK[b.source]
      if (rs !== 0) return rs
      const rr = b.rating - a.rating
      return rr !== 0 ? rr : byDateDesc(a, b)
    })
  }

  return list
}

export async function getNovelById(id: string): Promise<Novel | null> {
  if (id.startsWith('preset-')) return getPresetNovel(id)
  return getBook(id)
}

export async function getChapterMetas(novelId: string): Promise<ChapterMeta[]> {
  if (novelId.startsWith('preset-')) return getPresetChapterMetas(novelId)
  return getImportedChapterMetas(novelId)
}

export async function getChapter(
  novelId: string,
  chapterIdValue: string,
): Promise<Chapter | null> {
  if (novelId.startsWith('preset-')) return getPresetChapter(novelId, chapterIdValue)
  return getImportedChapter(novelId, chapterIdValue)
}

export async function getAdjacentChapters(
  novelId: string,
  chapterIndex: number,
): Promise<{ prev: ChapterMeta | null; next: ChapterMeta | null }> {
  const metas = await getChapterMetas(novelId)
  const idx = metas.findIndex((m) => m.index === chapterIndex)
  if (idx < 0) return { prev: null, next: null }
  return {
    prev: idx > 0 ? metas[idx - 1] : null,
    next: idx < metas.length - 1 ? metas[idx + 1] : null,
  }
}

/** 删除导入书并清理书店状态（书架/进度/最近阅读） */
export async function deleteImportedNovel(novelId: string): Promise<void> {
  await deleteBook(novelId)
  await deleteChaptersByNovel(novelId)
  const bs = useBookStore.getState()
  bs.removeFromShelf(novelId)
  bs.clearProgress(novelId)
  bs.removeFromRecent(novelId)
}