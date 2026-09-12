import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, List, Settings, Bookmark, Clock } from 'lucide-react'
import type { Chapter, ChapterMeta, Novel } from '@/types'
import { getNovelById, getChapterMetas, getChapter } from '@/data'
import { getReaderTheme } from '@/styles/themes'
import { useReaderStore } from '@/store/readerStore'
import { useBookStore } from '@/store/bookStore'
import { useUIStore } from '@/store/uiStore'
import { useKeyboardPage } from '@/hooks/useKeyboardPage'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import ReaderContent, { type ReaderContentHandle } from '@/components/reader/ReaderContent'
import SettingsPanel from '@/components/reader/SettingsPanel'
import CatalogDrawer from '@/components/reader/CatalogDrawer'
import Drawer from '@/components/common/Drawer'
import Spinner from '@/components/common/Spinner'
import { cn } from '@/utils/cn'

export default function ReaderPage() {
  const { novelId = '', chapterId: chapterIdParam = '' } = useParams()
  const navigate = useNavigate()

  const settings = useReaderStore((s) => s.settings)
  const toolbarVisible = useUIStore((s) => s.toolbarVisible)
  const drawer = useUIStore((s) => s.drawer)
  const toggleToolbar = useUIStore((s) => s.toggleToolbarVisible)
  const openDrawer = useUIStore((s) => s.openDrawer)
  const closeDrawer = useUIStore((s) => s.closeDrawer)
  const showToast = useUIStore((s) => s.showToast)
  const saveProgress = useBookStore((s) => s.saveProgress)
  const savedProgress = useBookStore((s) => s.progressMap[novelId])

  const [novel, setNovel] = useState<Novel | null>(null)
  const [metas, setMetas] = useState<ChapterMeta[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const committedRef = useRef<number | null>(null)

  const contentRef = useRef<ReaderContentHandle>(null)
  const baseRef = useRef({ novelId, chapterId: '', chapterIndex: 0 })
  const posRef = useRef({ scrollPercent: 0, pageIndex: 0 })

  const theme = getReaderTheme(settings.theme)
  const { minutes } = useReadingProgress(drawer === null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    Promise.all([getNovelById(novelId), getChapterMetas(novelId)])
      .then(([n, m]) => {
        if (!alive) return
        if (!n || m.length === 0) {
          setNotFound(true)
          setLoading(false)
          setNovel(null)
          setMetas([])
          return
        }
        setNovel(n)
        setMetas(m)
      })
      .catch(() => {
        if (alive) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [novelId])

  useEffect(() => {
    if (metas.length === 0) return
    const target = metas.find((x) => x.id === chapterIdParam) ?? metas[0]
    let alive = true
    getChapter(novelId, target.id)
      .then((c) => {
        if (!alive) return
        if (!c) {
          setNotFound(true)
          setLoading(false)
          setChapter(null)
          return
        }
        setChapter(c)
        setLoading(false)
        const sp = useBookStore.getState().progressMap[novelId]
        const match = sp && sp.chapterId === c.id ? sp : null
        posRef.current = {
          scrollPercent: match ? match.scrollPercent : 0,
          pageIndex: match ? match.pageIndex : 0,
        }
        saveProgress({
          novelId,
          chapterId: c.id,
          chapterIndex: c.index,
          scrollPercent: posRef.current.scrollPercent,
          pageIndex: posRef.current.pageIndex,
          updatedAt: Date.now(),
        })
      })
      .catch(() => {
        if (alive) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [novelId, chapterIdParam, metas, saveProgress])

  baseRef.current = { novelId, chapterId: chapter?.id ?? '', chapterIndex: chapter?.index ?? 0 }

  const persist = useCallback(() => {
    const b = baseRef.current
    if (!b.chapterId) return
    saveProgress({
      novelId: b.novelId,
      chapterId: b.chapterId,
      chapterIndex: b.chapterIndex,
      scrollPercent: posRef.current.scrollPercent,
      pageIndex: posRef.current.pageIndex,
      updatedAt: Date.now(),
    })
  }, [saveProgress])

  const persistDebounced = useDebouncedCallback(persist, 500)

  const onScrollPercent = useCallback(
    (p: number) => {
      posRef.current.scrollPercent = p
      persistDebounced()
    },
    [persistDebounced],
  )

  const onPageIndex = useCallback(
    (i: number) => {
      posRef.current.pageIndex = i
      persist()
    },
    [persist],
  )

  useEffect(() => {
    const onHide = () => persist()
    window.addEventListener('beforeunload', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      onHide()
      window.removeEventListener('beforeunload', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [persist])

  const currentIndex = chapter ? chapter.index - 1 : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < metas.length - 1

  const goToChapter = useCallback(
    (meta: ChapterMeta) => {
      navigate(`/read/${novelId}/${meta.id}`, { replace: true })
      closeDrawer()
    },
    [navigate, novelId, closeDrawer],
  )

  const goNext = useCallback(() => {
    if (hasNext) goToChapter(metas[currentIndex + 1])
    else showToast('已是最后一章')
  }, [hasNext, goToChapter, metas, currentIndex, showToast])

  const goPrev = useCallback(() => {
    if (hasPrev) goToChapter(metas[currentIndex - 1])
    else showToast('已是第一章')
  }, [hasPrev, goToChapter, metas, currentIndex, showToast])

  const beginSliderDrag = useCallback(() => {
    committedRef.current = Math.max(0, currentIndex)
  }, [currentIndex])

  const updateSliderDrag = useCallback(
    (idx: number) => {
      dragIndexRef.current = idx
      setDragIndex(idx)
      const last = committedRef.current
      if (last !== null) {
        const chapterIdx = Math.round(idx)
        if (Math.abs(chapterIdx - last) >= 2) {
          committedRef.current = chapterIdx
          const m = metas[chapterIdx]
          if (m) goToChapter(m)
        }
      }
    },
    [metas, goToChapter],
  )

  const commitSliderDrag = useCallback(() => {
    const idx = dragIndexRef.current
    if (idx === null) return
    dragIndexRef.current = null
    committedRef.current = null
    setDragIndex(null)
    const chapterIdx = Math.round(idx)
    const m = metas[chapterIdx]
    if (m && m.index !== chapter?.index) goToChapter(m)
  }, [metas, chapter, goToChapter])

  useKeyboardPage({
    onNext: () => contentRef.current?.next(),
    onPrev: () => contentRef.current?.prev(),
    onEscape: () => {
      if (drawer) closeDrawer()
      else toggleToolbar()
    },
    onScrollUp: () => contentRef.current?.scrollBy(-80),
    onScrollDown: () => contentRef.current?.scrollBy(80),
  })

  const savedScrollPercent =
    savedProgress && chapter && savedProgress.chapterId === chapter.id
      ? savedProgress.scrollPercent
      : 0
  const savedPageIndex =
    savedProgress && chapter && savedProgress.chapterId === chapter.id
      ? savedProgress.pageIndex
      : 0

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: theme.bg }}
      >
        <Spinner className="h-6 w-6 text-dim" />
      </div>
    )
  }

  if (notFound || !novel || !chapter) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: theme.bg, color: theme.text }}
      >
        <span className="font-mono text-4xl text-accent">!</span>
        <p className="font-serif text-lg">未找到这本书或章节</p>
        <button
          onClick={() => navigate(`/novel/${novelId}`)}
          className="rounded-btn bg-accent px-5 py-2.5 text-sm text-white"
        >
          返回详情
        </button>
      </div>
    )
  }

  return (
    <div
      role="main"
      className="fixed inset-0 z-50 overscroll-contain"
      style={{
        background: theme.bg,
        color: theme.text,
        transition: 'background-color 300ms ease, color 300ms ease',
      }}
    >
      {settings.brightness < 1 && (
        <div
          className="brightness-mask"
          style={{ opacity: 1 - settings.brightness }}
        />
      )}

      <ReaderContent
        ref={contentRef}
        chapter={chapter}
        settings={settings}
        savedScrollPercent={savedScrollPercent}
        savedPageIndex={savedPageIndex}
        hasPrevChapter={hasPrev}
        hasNextChapter={hasNext}
        onScrollPercent={onScrollPercent}
        onPageIndex={onPageIndex}
        onNextChapter={goNext}
        onPrevChapter={goPrev}
        onToggleToolbar={toggleToolbar}
      />

      {/* 顶部工具栏 */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 z-20 transition-all duration-200',
          toolbarVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-full opacity-0',
        )}
      >
        <div
          className="mx-auto max-w-[720px]"
          style={{ background: theme.bg, borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              aria-label="返回"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <span className="max-w-full truncate text-sm font-medium">{novel.title}</span>
              <span className="max-w-full truncate text-xs opacity-60">{chapter.title}</span>
            </div>
            <button
              aria-label="书签"
              onClick={() => showToast('已添加书签')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70"
            >
              <Bookmark size={18} />
            </button>
          </div>
          {settings.showReadingTime && (
            <div className="flex justify-center pb-2 font-mono text-xs opacity-60">
              <Clock size={12} className="mr-1 mt-0.5" />
              本次阅读 {minutes} 分钟
            </div>
          )}
        </div>
      </div>

      {/* 底部工具栏 */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 transition-all duration-200',
          toolbarVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0',
        )}
      >
        <div
          className="mx-auto max-w-[720px]"
          style={{
            background: theme.bg,
            borderTop: `1px solid ${theme.border}`,
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-1.5">
            <span className="shrink-0 font-mono text-xs opacity-60">
              {chapter.index}/{metas.length}
            </span>
            <input
              type="range"
              aria-label="章节进度"
              min={0}
              max={Math.max(0, metas.length - 1)}
              step={0.01}
              value={dragIndex ?? Math.max(0, currentIndex)}
              onChange={(e) => updateSliderDrag(Number(e.target.value))}
              onPointerDown={beginSliderDrag}
              onPointerUp={commitSliderDrag}
              onPointerCancel={commitSliderDrag}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  const delta = e.key === 'ArrowRight' ? 1 : -1
                  const next = Math.max(
                    0,
                    Math.min(metas.length - 1, Math.max(0, currentIndex) + delta),
                  )
                  const m = metas[next]
                  if (m && m.index !== chapter?.index) goToChapter(m)
                }
              }}
              className="progress-slider flex-1 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-around px-2 py-1.5">
            <button
              onClick={goPrev}
              className="flex items-center gap-1 rounded-btn px-3 py-2 text-sm opacity-80 transition-opacity hover:opacity-100"
            >
              <ChevronLeft size={16} /> 上一章
            </button>
            <button
              aria-label="目录"
              onClick={() => openDrawer('catalog')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            >
              <List size={20} />
            </button>
            <button
              aria-label="设置"
              onClick={() => openDrawer('settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-1 rounded-btn px-3 py-2 text-sm opacity-80 transition-opacity hover:opacity-100"
            >
              下一章 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 设置抽屉 */}
      <Drawer
        open={drawer === 'settings'}
        title="阅读设置"
        onClose={closeDrawer}
        full
        maxWidth="max-w-[720px]"
      >
        <SettingsPanel />
      </Drawer>

      {/* 目录抽屉 */}
      <CatalogDrawer
        open={drawer === 'catalog'}
        metas={metas}
        currentChapterId={chapter.id}
        readUpTo={chapter.index}
        onClose={closeDrawer}
        onSelect={goToChapter}
      />
    </div>
  )
}