import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export default function Toast() {
  const toast = useUIStore((s) => s.toast)
  const clearToast = useUIStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => clearToast(), 1500)
    return () => window.clearTimeout(id)
  }, [toast, clearToast])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-4 py-2 font-mono text-xs text-bg shadow-toolbar">
      {toast.message}
    </div>
  )
}