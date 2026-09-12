import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface DrawerProps {
  open: boolean
  side?: 'bottom' | 'right'
  title?: string
  onClose: () => void
  children: ReactNode
  full?: boolean
}

export default function Drawer({ open, side = 'bottom', title, onClose, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[40] flex transition-opacity',
        side === 'bottom' ? 'items-end' : 'items-stretch justify-end',
        open ? 'pointer-events-auto bg-black/40 opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? '面板'}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex flex-col bg-surface outline-none transition-transform duration-300',
          side === 'bottom'
            ? 'max-h-[85%] w-full rounded-t-card border-t border-line'
            : 'h-full w-[360px] max-w-[90vw] border-l border-line',
          open ? 'translate-y-0 translate-x-0' : side === 'bottom' ? 'translate-y-full' : 'translate-x-full',
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-serif text-base text-ink">{title}</span>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="text-dim transition-colors hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}