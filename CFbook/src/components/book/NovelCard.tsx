import { Link } from 'react-router-dom'
import type { Novel, ReadingProgress } from '@/types'
import Cover from '../common/Cover'
import Tag from '../common/Tag'
import { cn } from '@/utils/cn'

interface NovelCardProps {
  novel: Novel
  view: 'grid' | 'list'
  progress?: ReadingProgress
}

const STATUS_LABEL: Record<Novel['status'], string> = {
  serializing: '连载',
  completed: '完结',
}

/** 书架卡片：网格（3:4 封面）与列表（60×80 小封面）两种形态 */
export default function NovelCard({ novel, view, progress }: NovelCardProps) {
  const href = `/novel/${novel.id}`
  const percent = progress
    ? Math.min(100, Math.round((progress.chapterIndex / Math.max(1, novel.chapterCount)) * 100))
    : 0

  if (view === 'list') {
    return (
      <Link
        to={href}
        className="flex gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-line-hi"
      >
        <div className="relative w-[60px] shrink-0">
          <Cover src={novel.cover} title={novel.title} className="h-[80px] w-[60px]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-sans text-sm font-semibold text-ink">{novel.title}</span>
            <span className="shrink-0 font-mono text-[0.62rem] text-faint">{novel.author}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            {novel.source === 'preset' && <Tag variant="accent">原创</Tag>}
            {novel.source === 'imported' && <Tag variant="red">导入</Tag>}
            <Tag variant="neutral">{STATUS_LABEL[novel.status]}</Tag>
            {novel.tags.slice(0, 2).map((t) => (
              <Tag key={t} variant="neutral">{t}</Tag>
            ))}
          </div>
          <p className="mt-1.5 truncate text-xs text-dim">{novel.intro}</p>
          {progress && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-alt">
                <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
              <span className="shrink-0 font-mono text-[0.62rem] text-faint">{percent}%</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className="group flex flex-col gap-2 rounded-card border border-line bg-surface p-2.5 transition-all hover:-translate-y-0.5 hover:border-line-hi hover:shadow-card"
    >
      <div className="relative">
        <Cover src={novel.cover} title={novel.title} className="aspect-[3/4] w-full" />
        {novel.source === 'preset' && (
          <span className="absolute left-1.5 top-1.5 rounded-tag bg-accent px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold text-white">
            原创
          </span>
        )}
        {novel.source === 'imported' && (
          <span className="absolute right-1.5 top-1.5 rounded-tag bg-black/60 px-1.5 py-0.5 font-mono text-[0.58rem] text-white">
            导入
          </span>
        )}
        <span
          className={cn(
            'absolute bottom-1.5 left-1.5 rounded-tag px-1.5 py-0.5 font-mono text-[0.58rem]',
            novel.status === 'completed' ? 'bg-green-600/85 text-white' : 'bg-black/55 text-white',
          )}
        >
          {STATUS_LABEL[novel.status]}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <span className="truncate font-sans text-sm font-semibold leading-snug text-ink">
          {novel.title}
        </span>
        <span className="truncate font-mono text-[0.66rem] text-faint">{novel.author}</span>
        {novel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {novel.tags.slice(0, 2).map((t) => (
              <Tag key={t} variant="neutral">{t}</Tag>
            ))}
          </div>
        )}
        {progress ? (
          <div className="mt-0.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-alt">
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
            <span className="shrink-0 font-mono text-[0.6rem] text-faint">{percent}%</span>
          </div>
        ) : (
          <span className="truncate text-[0.66rem] text-faint">共 {novel.chapterCount} 章</span>
        )}
      </div>
    </Link>
  )
}