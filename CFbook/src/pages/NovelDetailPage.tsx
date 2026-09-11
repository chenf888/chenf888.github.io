import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Star, BookOpen, Trash2 } from 'lucide-react'
import type { ChapterMeta, Novel } from '@/types'
import { getNovelById, getChapterMetas, deleteImportedNovel } from '@/data'
import { useBookStore } from '@/store/bookStore'
import { useUIStore } from '@/store/uiStore'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import Cover from '@/components/common/Cover'
import Tag from '@/components/common/Tag'
import Modal from '@/components/common/Modal'
import ChapterList from '@/components/book/ChapterList'
import { formatWordCount } from '@/utils/format'
import { cn } from '@/utils/cn'

/** 书籍详情页：封面信息 + 简介 + 操作 + 章节目录 */
export default function NovelDetailPage() {
  const { novelId = '' } = useParams()
  const navigate = useNavigate()
  useScrollRestoration(true)

  const progress = useBookStore((s) => s.progressMap[novelId])
  const isInShelf = useBookStore((s) => s.isInShelf(novelId))
  const toggleShelf = useBookStore((s) => s.toggleShelf)
  const showToast = useUIStore((s) => s.showToast)

  const [novel, setNovel] = useState<Novel | null>(null)
  const [metas, setMetas] = useState<ChapterMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [introExpanded, setIntroExpanded] = useState(false)
  const [introClamped, setIntroClamped] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const introRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    Promise.all([getNovelById(novelId), getChapterMetas(novelId)])
      .then(([n, m]) => {
        if (!alive) return
        if (!n) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setNovel(n)
        setMetas(m)
        setLoading(false)
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
    const onScroll = () => setScrolled(window.scrollY > 160)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = introRef.current
    if (el) setIntroClamped(el.scrollHeight > el.clientHeight + 2)
  }, [novel?.id, novel?.intro])

  const startReading = () => {
    if (metas.length === 0) return
    const target =
      progress?.chapterId && metas.some((m) => m.id === progress.chapterId)
        ? progress.chapterId
        : metas[0].id
    navigate(`/read/${novelId}/${target}`)
  }

  const onToggleShelf = () => {
    if (!isInShelf) showToast('已加入书架')
    toggleShelf(novelId)
  }

  const onDelete = async () => {
    await deleteImportedNovel(novelId)
    navigate('/imported')
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-sm text-dim">加载中…</span>
      </div>
    )
  }

  if (notFound || !novel) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-lg text-ink">未找到这本书</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-btn bg-accent px-5 py-2.5 text-sm text-white"
        >
          返回书架
        </button>
      </div>
    )
  }

  const startLabel = progress ? `继续阅读 第 ${progress.chapterIndex} 章` : '开始阅读'

  return (
    <div className="mx-auto min-h-dvh max-w-[1200px] px-4 pb-28">
      {/* 顶部导航：滚过封面后变实色 */}
      <div
        className={cn(
          'fixed inset-x-0 top-0 z-30 transition-colors duration-200',
          scrolled
            ? 'border-b border-line bg-nav backdrop-blur-2xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3">
          <button
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:opacity-70"
          >
            <ChevronLeft size={22} />
          </button>
          <span
            className={cn(
              'truncate font-serif text-base text-ink transition-opacity',
              scrolled ? 'opacity-100' : 'opacity-0',
            )}
          >
            {novel.title}
          </span>
        </div>
      </div>

      {/* 头部 */}
      <header className="flex gap-5 pt-24">
        <Cover
          src={novel.cover}
          title={novel.title}
          className="aspect-[3/4] w-28 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-serif text-xl font-semibold text-ink">
              {novel.title}
            </h1>
            {novel.source === 'preset' && <Tag variant="accent">原创</Tag>}
            {novel.source === 'imported' && <Tag variant="red">本地导入</Tag>}
          </div>
          <p className="font-mono text-sm text-dim">{novel.author}</p>
          <div className="flex items-center gap-1 text-sm text-accent-text">
            <Star size={14} fill="currentColor" />
            <span className="font-semibold">{novel.rating.toFixed(1)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag variant="neutral">{novel.category}</Tag>
            <Tag variant={novel.status === 'completed' ? 'green' : 'blue'}>
              {novel.status === 'completed' ? '已完结' : '连载中'}
            </Tag>
          </div>
          <p className="font-mono text-xs text-faint">
            {formatWordCount(novel.wordCount)} · 共 {novel.chapterCount} 章
          </p>
          <p className="font-mono text-xs text-faint">
            更新于 {new Date(novel.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </header>

      {/* 简介 */}
      <section className="mt-6">
        <h2 className="mb-2 font-serif text-base text-ink">简介</h2>
        <p
          ref={introRef}
          className={cn(
            'text-sm leading-relaxed text-dim',
            !introExpanded && 'line-clamp-3',
          )}
        >
          {novel.intro || '暂无简介'}
        </p>
        {introClamped && (
          <button
            onClick={() => setIntroExpanded((v) => !v)}
            className="mt-1 font-mono text-xs text-accent-text"
          >
            {introExpanded ? '收起' : '展开'}
          </button>
        )}
      </section>

      {/* 操作按钮 */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={startReading}
          className="flex-1 rounded-btn bg-accent py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <BookOpen size={16} className="mr-1.5 inline-block align-[-2px]" />
          {startLabel}
        </button>
        <button
          onClick={onToggleShelf}
          className={cn(
            'rounded-btn border px-5 py-3 text-sm transition-colors',
            isInShelf
              ? 'border-accent text-accent-text'
              : 'border-line text-dim hover:border-line-hi hover:text-ink',
          )}
        >
          {isInShelf ? '移出书架' : '加书架'}
        </button>
        {novel.source === 'imported' && (
          <button
            aria-label="删除本书"
            onClick={() => setDeleteOpen(true)}
            className="rounded-btn border border-line px-4 py-3 text-sm text-dim transition-colors hover:border-[#B3261E] hover:text-[#B3261E]"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 目录 */}
      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg text-ink">目录</h2>
        <ChapterList
          metas={metas}
          currentChapterId={progress?.chapterId}
          readUpTo={progress?.chapterIndex ?? 0}
          onSelect={(m) => navigate(`/read/${novelId}/${m.id}`)}
          reverse={reverse}
          onToggleReverse={() => setReverse((v) => !v)}
          showHeader
        />
      </section>

      {/* 移动端底部悬浮：继续阅读 */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 p-3 sm:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          onClick={startReading}
          className="w-full rounded-btn bg-accent py-3 text-sm font-medium text-white shadow-toolbar"
        >
          {startLabel}
        </button>
      </div>

      <Modal
        open={deleteOpen}
        title="删除本书？"
        description="将删除这本书及其全部章节内容，且无法恢复。"
        confirmText="删除"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
      />
    </div>
  )
}