import { NavLink } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-1.5 text-[0.72rem] font-medium transition-colors',
    isActive ? 'bg-accent-dim text-ink' : 'text-dim hover:text-ink',
  )

export default function NavBar() {
  const theme = useUIStore((s) => s.globalTheme)
  const toggleTheme = useUIStore((s) => s.toggleGlobalTheme)

  return (
    <nav className="fixed left-1/2 top-5 z-[30] flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-nav py-1 pl-3 pr-1 backdrop-blur-2xl">
      <NavLink to="/" className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-widest">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="mr-1 text-ink">CFBOOK</span>
      </NavLink>

      <div className="flex items-center gap-0.5">
        <NavLink to="/" end className={linkClass}>
          书架
        </NavLink>
        <NavLink to="/imported" className={linkClass}>
          我的导入
        </NavLink>
      </div>

      <a
        href="../"
        className="mr-1 rounded-full px-3 py-1.5 text-[0.72rem] text-dim transition-colors hover:text-accent-text"
      >
        ← 主页
      </a>

      <button
        onClick={toggleTheme}
        aria-label="切换主题"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-dim transition-colors hover:border-line-hi hover:text-accent-text"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </nav>
  )
}