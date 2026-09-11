import { Link } from 'react-router-dom'

/** 404 兜底页 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-mono text-5xl font-semibold text-accent">404</span>
      <p className="font-serif text-xl text-ink">页面不存在</p>
      <p className="text-sm text-dim">你访问的页面可能已被移动或删除。</p>
      <Link
        to="/"
        className="rounded-btn bg-accent px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
      >
        回到书架
      </Link>
    </div>
  )
}