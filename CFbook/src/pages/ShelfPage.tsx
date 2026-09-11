import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload, LayoutGrid, List, BookOpen } from 'lucide-react'
import type { CategoryKey, Novel, ReadingProgress } from '@/types'
import { getNovels, getNovelById } from '@/data'
import { CATEGORY_TABS } from '@/constants'
import { useBookStore } from '@/store/bookStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import NovelCard from '@/components/book/NovelCard'
import EmptyState from '@/components/common/EmptyState'
import ImportFlow from '@/components/import/ImportFlow'
import { cn } from '@/utils/cn'

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  recommend: '推荐',
  玄幻: '玄幻',
  都市: '都市',
  言情: '言情',
  悬疑: '悬疑',
  科幻: '科幻',
  completed: '已完结',
}

interface RecentItem {
  novel: Novel
  progress: ReadingProgress
}

/** 书架页：分类筛选 + 搜索 + 继续阅读 + 作品列表 */
export default function ShelfPage() {
  useScrollRestoration(true)

  const [category, setCategory] = useState<CategoryKey>('recommend')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [novels, setNovels] = useState<Novel[]>([])
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [pull, setPull] = useState(0)

  const progressMap = useBookStore((s) => s.progressMap)
  const recentIds = useBookStore((s) => s.recentIds)

  const touchStartY = useRef(0)
  const setKeywordDebounced = useDebouncedCallback(setKeyword, 300)

  const load = useCallback(async () => {
    setLoading(true)
    const list = await getNovels({ category, keyword })
    setNovels(list)
    setLoading(false)
  }, [category, keyword])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let alive = true
    const ids = recentIds.slice(0, 3)
    Promise.all(
      ids.map(async (id) => {
        const n = await getNovelById(id)
        const p = progressMap[id]
        return n && p ? { novel: n, progress: p } : null
      }),
    ).then((items) => {
      if (alive) setRecent(items.filter((x): x is RecentItem => x !== null))
    })
    return () => {
      alive = false
    }
  }, [recentIds, progressMap])

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) touchStartY.current = e.touches[0].clientY
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0) setPull(Math.min(dy * 0.4, 72))
  }
  const onTouchEnd = () => {
    if (pull > 60) void load()
    setPull(0)
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="mx-auto min-h-dvh max-w-[1200px] px-4 pb-24 pt-24"
    >
      {pull > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden text-xs text-dim"
          style={{ height: pull }}
        >
          {pull > 60 ? '松手刷新' : '下拉刷新'}
        </div>
      )}

      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">陈风的书架</h1>
        <p className="mt-1 font-mono text-xs text-dim">个人原创小说 · 打开即读</p>
      </header>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
          <Search size={16} className="shrink-0 text-faint" />
          <input
            value={keywordInput}
            onChange={(e) => {
              setKeywordInput(e.target.value)
              setKeywordDebounced(e.target.value)
            }}
            placeholder="搜索书名 / 作者 / 标签"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <button
          aria-label="导入"
          onClick={() => setImportOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-dim transition-colors hover:border-line-hi hover:text-accent-text"
        >
          <Upload size={18} />
        </button>
        <button
          aria-label="切换视图"
          onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-dim transition-colors hover:border-line-hi hover:text-accent-text"
        >
          {view === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
        </button>
      </div>

      <div className="no-scrollbar mt-6 flex gap-5 overflow-x-auto border-b border-line">
        {CATEGORY_TABS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'shrink-0 whitespace-nowrap px-1 pb-2.5 text-sm transition-colors',
              category === c
                ? 'font-semibold text-accent-text'
                : 'text-dim hover:text-ink',
            )}
          >
            {CATEGORY_LABELS[c]}
            {category === c && (
              <span className="mt-1 block h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg text-ink">继续阅读</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {recent.map(({ novel, progress }) => {
              const percent = Math.min(
                100,
                Math.round((progress.chapterIndex / Math.max(1, novel.chapterCount)) * 100),
              )
              return (
                <Link
                  key={novel.id}
                  to={`/read/${novel.id}/${progress.chapterId}`}
                  className="w-56 shrink-0 rounded-card border border-line bg-surface p-3 transition-colors hover:border-line-hi"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-ink">{novel.title}</span>
                    <span className="ml-2 shrink-0 font-mono text-[0.62rem] text-faint">
                      {percent}%
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-dim">
                    已读 {progress.chapterIndex}/{novel.chapterCount} 章
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-alt">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">全部作品</h2>
          <span className="font-mono text-xs text-faint">{novels.length} 本</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="text-sm text-dim">加载中…</span>
          </div>
        ) : novels.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="没有找到相关作品"
            description="换个关键词或分类试试。"
            action={
              (keyword || category !== 'recommend') && (
                <button
                  onClick={() => {
                    setKeyword('')
                    setKeywordInput('')
                    setCategory('recommend')
                  }}
                  className="rounded-btn border border-line px-4 py-2 text-sm text-dim hover:text-ink"
                >
                  清空筛选
                </button>
              )
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {novels.map((n) => (
              <NovelCard key={n.id} novel={n} view="grid" progress={progressMap[n.id]} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {novels.map((n) => (
              <NovelCard key={n.id} novel={n} view="list" progress={progressMap[n.id]} />
            ))}
          </div>
        )}
      </section>

      <ImportFlow open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}