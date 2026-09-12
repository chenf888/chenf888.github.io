import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, AlertTriangle } from 'lucide-react'
import Drawer from '@/components/common/Drawer'
import Spinner from '@/components/common/Spinner'
import { useImportTask } from '@/hooks/useImportTask'
import { SUPPORTED_ENCODINGS } from '@/services/importer/encoding'
import { CATEGORY_TABS } from '@/constants'
import { formatFileSize } from '@/utils/format'

const NOVEL_CATEGORIES = CATEGORY_TABS.filter(
  (c) => c !== 'recommend' && c !== 'completed',
)

const STAGE_LABEL: Record<string, string> = {
  reading: '读取文件中…',
  detecting: '检测编码…',
  decoding: '解析文本…',
  splitting: '拆分章节…',
  saving: '写入书架…',
}

interface ImportFlowProps {
  open: boolean
  onClose: () => void
}

export default function ImportFlow({ open, onClose }: ImportFlowProps) {
  const navigate = useNavigate()
  const { task, preview, startFile, reDecode, commit, reset } = useImportTask()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState<string>(NOVEL_CATEGORIES[0])
  const [tags, setTags] = useState('')
  const [encoding, setEncoding] = useState('UTF-8')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preview) {
      setTitle(preview.suggestedTitle)
      setAuthor(preview.suggestedAuthor || '佚名')
      setCategory(NOVEL_CATEGORIES[0])
      setTags('')
      setEncoding(preview.detectedEncoding)
    }
  }, [preview])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const onPickFile = (file: File | null) => {
    if (!file) return
    if (!/\.txt$/i.test(file.name)) return
    void startFile(file)
  }

  const onEncodingChange = (next: string) => {
    setEncoding(next)
    reDecode(next)
  }

  const onConfirm = async () => {
    setSaving(true)
    const id = await commit({
      title,
      author,
      category,
      tags: tags.split(/[,，、\s]+/).filter(Boolean).slice(0, 5),
      encoding,
    })
    setSaving(false)
    if (id) {
      onClose()
      navigate(`/novel/${id}`)
    }
  }

  const busy =
    task !== null &&
    task.stage !== 'error' &&
    task.stage !== 'done' &&
    preview === null

  const progress = task?.progress ?? 0

  return (
    <Drawer open={open} side="bottom" title="导入 TXT" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            onPickFile(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
        />

        {!task && (
          <button
            onClick={() => inputRef.current?.click()}
            className="my-6 flex w-full flex-col items-center gap-3 rounded-card border border-dashed border-line-hi bg-bg-alt px-6 py-10 transition-colors hover:border-accent"
          >
            <FileText size={28} className="text-accent" />
            <span className="text-sm text-ink">选择 TXT 文件</span>
            <span className="font-mono text-[0.7rem] text-faint">
              支持 UTF-8 / GBK / GB18030 / UTF-16，最大 50MB
            </span>
          </button>
        )}

        {busy && (
          <div className="my-10 flex flex-col items-center gap-3">
            <Spinner className="h-6 w-6 text-accent" />
            <span className="font-mono text-xs text-dim">
              {STAGE_LABEL[task.stage] ?? '处理中…'} {progress}%
            </span>
          </div>
        )}

        {task?.stage === 'error' && !preview && (
          <div className="my-10 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={24} className="text-[#B3261E]" />
            <p className="text-sm text-dim">{task.error ?? '导入失败'}</p>
            <button
              onClick={reset}
              className="rounded-btn border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-line-hi"
            >
              重新选择
            </button>
          </div>
        )}

        {preview && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between text-xs text-dim">
              <span className="truncate font-mono">{preview.fileName}</span>
              <span className="shrink-0 font-mono text-faint">
                {formatFileSize(preview.fileSize)}
              </span>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs text-dim">书名</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-dim">作者</span>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-dim">分类</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  {NOVEL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs text-dim">标签（逗号分隔）</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="如：热血、成长"
                className="rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs text-dim">编码</span>
              <select
                value={encoding}
                onChange={(e) => onEncodingChange(e.target.value)}
                className="rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {SUPPORTED_ENCODINGS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-card border border-line bg-bg-alt px-4 py-3 text-xs text-dim">
              识别到 {preview.chapterCount} 章 · 约 {formatFileSize(preview.wordCount * 3)}
              {preview.firstChapterTitles.length > 0 && (
                <div className="mt-2 flex flex-col gap-0.5">
                  {preview.firstChapterTitles.map((t, i) => (
                    <span key={i} className="truncate text-faint">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {preview.matchedHeadingCount === 0 && (
              <div className="flex items-start gap-2 rounded-card border border-[#F5D9A8] bg-[#FBF3DB] px-3 py-2 text-xs text-[#956400]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                未识别到章节标题，已按每 3000 字兜底分章。
              </div>
            )}

            <div className="flex gap-3 pb-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-btn border border-line px-4 py-2.5 text-sm text-dim transition-colors hover:text-ink"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-accent px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Spinner className="h-4 w-4" />}
                确认导入
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}