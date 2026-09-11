import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Upload, Trash2, Download, UploadCloud, BookOpen } from 'lucide-react'
import type { Novel, ShelfBackup } from '@/types'
import { getNovels, deleteImportedNovel } from '@/data'
import { getStorageEstimate, type StorageEstimate } from '@/db/estimate'
import { useBookStore } from '@/store/bookStore'
import { useUIStore } from '@/store/uiStore'
import Cover from '@/components/common/Cover'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import { formatWordCount, formatFileSize, formatRelativeTime } from '@/utils/format'

/** 导入书单行：封面 + 元信息 + 删除 */
function ImportedRow({ novel, onDelete }: { novel: Novel; onDelete: () => void }) {
  // 正文存于 IndexedDB，占用按字数近似估算（每个字约 3 字节）
  const size = formatFileSize(novel.wordCount * 3)
  return (
    <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
      <Link to={`/novel/${novel.id}`} className="shrink-0">
        <Cover src={novel.cover} title={novel.title} className="h-[80px] w-[60px]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link to={`/novel/${novel.id}`} className="truncate text-sm font-semibold text-ink hover:text-accent-text">
          {novel.title}
        </Link>
        <span className="mt-0.5 truncate font-mono text-xs text-dim">{novel.author}</span>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[0.66rem] text-faint">
          <span>{novel.chapterCount} 章</span>
          <span>{formatWordCount(novel.wordCount)}</span>
          <span>≈{size}</span>
        </div>
        <span className="mt-1 font-mono text-[0.66rem] text-faint">
          {novel.importedAt ? formatRelativeTime(novel.importedAt) : ''}
        </span>
      </div>
      <button
        aria-label="删除本书"
        onClick={onDelete}
        className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-dim transition-colors hover:bg-bg-alt hover:text-[#B3261E]"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

/** 我的导入页：导入书管理 + 存储占用 + 备份导出/恢复/清空 */
export default function ImportedBooksPage() {
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)
  const exportBackup = useBookStore((s) => s.exportBackup)
  const importBackup = useBookStore((s) => s.importBackup)

  const [books, setBooks] = useState<Novel[]>([])
  const [estimate, setEstimate] = useState<StorageEstimate>({ usage: 0, quota: 0 })
  const [deleteTarget, setDeleteTarget] = useState<Novel | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const restoreRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [list, est] = await Promise.all([
      getNovels({ source: 'imported' }),
      getStorageEstimate(),
    ])
    setBooks(list)
    setEstimate(est)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onDelete = async () => {
    if (!deleteTarget) return
    await deleteImportedNovel(deleteTarget.id)
    setDeleteTarget(null)
    await load()
    showToast('已删除')
  }

  const onClearAll = async () => {
    await Promise.all(books.map((b) => deleteImportedNovel(b.id)))
    setClearOpen(false)
    await load()
    showToast('已清空全部导入书')
  }

  const onExport = async () => {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cfbook-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('备份已导出')
  }

  const onRestoreFile = async (file: File | null) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as ShelfBackup
      if (!data || !Array.isArray(data.shelf) || !data.progressMap) throw new Error('invalid')
      importBackup(data)
      const local = await getNovels({ source: 'imported' })
      const localIds = new Set(local.map((n) => n.id))
      const missingTitles = (data.importedBooks ?? [])
        .filter((b) => !localIds.has(b.id))
        .map((b) => b.title)
      setMissing(missingTitles)
      showToast('备份已恢复')
    } catch {
      showToast('备份文件无效')
    }
  }

  const usagePercent = estimate.quota > 0 ? Math.min(100, (estimate.usage / estimate.quota) * 100) : 0

  return (
    <div className="mx-auto min-h-dvh max-w-[1200px] px-4 pb-24 pt-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:opacity-70"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-serif text-2xl font-semibold text-ink">我的导入</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Upload size={15} />
          导入新书
        </button>
      </header>

      {/* 存储占用 */}
      <div className="mt-6 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-dim">本地存储占用</span>
          <span className="font-mono text-faint">
            {formatFileSize(estimate.usage)}
            {estimate.quota > 0 ? ` / ${formatFileSize(estimate.quota)}` : ''}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-alt">
          <div className="h-full rounded-full bg-accent" style={{ width: `${usagePercent}%` }} />
        </div>
      </div>

      {/* 恢复后缺失正文提示 */}
      {missing.length > 0 && (
        <div className="mt-4 rounded-card border border-[#F5D9A8] bg-[#FBF3DB] px-4 py-3 text-xs text-[#956400]">
          以下导入书缺失正文，请重新导入：{missing.join('、')}
        </div>
      )}

      {/* 列表 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">已导入 {books.length} 本</h2>
        </div>
        {books.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="还没有导入的书"
            description="导入你合法拥有的 TXT 小说，数据仅保存在本地浏览器。"
            action={
              <button
                onClick={() => navigate('/')}
                className="rounded-btn bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
              >
                去导入
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {books.map((b) => (
              <ImportedRow key={b.id} novel={b} onDelete={() => setDeleteTarget(b)} />
            ))}
          </div>
        )}
      </section>

      {/* 备份管理 */}
      <section className="mt-8 flex flex-col gap-2">
        <h2 className="mb-1 font-serif text-lg text-ink">备份与恢复</h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-line-hi"
          >
            <Download size={15} />
            导出备份
          </button>
          <button
            onClick={() => restoreRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-line-hi"
          >
            <UploadCloud size={15} />
            从备份恢复
          </button>
        </div>
        <input
          ref={restoreRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            void onRestoreFile(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
        />
        {books.length > 0 && (
          <button
            onClick={() => setClearOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-btn border border-line px-4 py-2.5 text-sm text-[#B3261E] transition-colors hover:border-[#B3261E]/40"
          >
            <Trash2 size={15} />
            清空所有导入书
          </button>
        )}
        <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-faint">
          备份仅含书目与阅读进度，不含正文；换设备或清缓存后，导入书正文会丢失，需重新导入。
        </p>
      </section>

      <Modal
        open={deleteTarget !== null}
        title="删除本书？"
        description={`将删除《${deleteTarget?.title ?? ''}》及其全部章节内容，且无法恢复。`}
        confirmText="删除"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
      />
      <Modal
        open={clearOpen}
        title="清空所有导入书？"
        description="将删除全部导入书及其章节内容，且无法恢复。"
        confirmText="清空"
        danger
        onClose={() => setClearOpen(false)}
        onConfirm={onClearAll}
      />
    </div>
  )
}