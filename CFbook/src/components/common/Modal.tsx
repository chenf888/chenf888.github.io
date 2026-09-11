import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** 二次确认弹窗：Esc 关闭，确认按钮危险态 */
export default function Modal({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onClose,
}: ModalProps) {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm border border-line bg-surface p-6 shadow-drawer outline-none"
      >
        <h3 className="mb-2 font-serif text-lg text-ink">{title}</h3>
        {description && <p className="mb-5 text-sm leading-relaxed text-dim">{description}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-btn border border-line px-4 py-2 text-sm text-dim transition-colors hover:border-line-hi hover:text-ink"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-btn px-4 py-2 text-sm transition-colors',
              danger
                ? 'bg-[#B3261E] text-white hover:opacity-90'
                : 'bg-accent text-white hover:opacity-90',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}