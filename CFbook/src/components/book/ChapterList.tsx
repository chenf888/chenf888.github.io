import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { ChapterMeta } from '@/types'
import { cn } from '@/utils/cn'

interface ChapterListProps {
  metas: ChapterMeta[]
  currentChapterId?: string
  readUpTo?: number
  onSelect: (meta: ChapterMeta) => void
  reverse?: boolean
  onToggleReverse?: () => void
  showHeader?: boolean
}

const GROUP_SIZE = 50

/** 章节目录：每 50 章分组、可折叠、默认展开含当前章分组，自动定位当前章 */
export default function ChapterList({
  metas,
  currentChapterId,
  readUpTo = 0,
  onSelect,
  reverse = false,
  onToggleReverse,
  showHeader = true,
}: ChapterListProps) {
  const list = useMemo(() => {
    const sorted = reverse ? [...metas].reverse() : metas
    const groups: ChapterMeta[][] = []
    for (let i = 0; i < sorted.length; i += GROUP_SIZE) {
      groups.push(sorted.slice(i, i + GROUP_SIZE))
    }
    return groups
  }, [metas, reverse])

  const currentGroup = useMemo(
    () => list.findIndex((g) => g.some((m) => m.id === currentChapterId)),
    [list, currentChapterId],
  )

  const [openGroups, setOpenGroups] = useState<Set<number>>(
    () => new Set(currentGroup >= 0 ? [currentGroup] : [0]),
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (currentGroup >= 0) {
      setOpenGroups((s) => {
        if (s.has(currentGroup)) return s
        const next = new Set(s)
        next.add(currentGroup)
        return next
      })
    }
    if (!currentChapterId) return
    const el = containerRef.current?.querySelector(
      `[data-chapter-id="${currentChapterId}"]`,
    )
    el?.scrollIntoView({ block: 'center' })
  }, [currentChapterId, currentGroup])

  const toggleGroup = (i: number) => {
    setOpenGroups((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-3">
          <span className="font-mono text-xs text-dim">共 {metas.length} 章</span>
          {onToggleReverse && (
            <button
              onClick={onToggleReverse}
              className="rounded-btn px-2 py-1 font-mono text-xs text-dim transition-colors hover:text-ink"
            >
              {reverse ? '正序' : '倒序'}
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {list.map((group, gi) => {
          const open = openGroups.has(gi)
          const first = group[0].index
          const last = group[group.length - 1].index
          return (
            <div key={gi}>
              <button
                onClick={() => toggleGroup(gi)}
                className="sticky top-0 flex w-full items-center justify-between border-y border-line bg-bg-alt px-5 py-2 text-left"
              >
                <span className="font-mono text-xs text-dim">
                  第 {first}–{last} 章
                </span>
                <span className="text-xs text-faint">{open ? '收起' : '展开'}</span>
              </button>

              {open &&
                group.map((meta) => {
                  const isCurrent = meta.id === currentChapterId
                  const isRead = !isCurrent && meta.index <= readUpTo
                  return (
                    <button
                      key={meta.id}
                      data-chapter-id={meta.id}
                      onClick={() => onSelect(meta)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-line/60 px-5 py-2.5 text-left transition-colors',
                        isCurrent
                          ? 'bg-accent-soft'
                          : 'hover:bg-accent-dim',
                      )}
                    >
                      <span
                        className={cn(
                          'h-4 w-0.5 shrink-0 rounded-full',
                          isCurrent ? 'bg-accent' : 'bg-transparent',
                        )}
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-sm',
                          isCurrent
                            ? 'font-semibold text-accent-text'
                            : isRead
                              ? 'text-faint'
                              : 'text-ink',
                        )}
                      >
                        {meta.title}
                      </span>
                      {isRead && <Check size={14} className="shrink-0 text-faint" />}
                    </button>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}