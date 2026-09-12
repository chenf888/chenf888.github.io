import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar'
import Toast from './Toast'

export default function AppShell() {
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/read') || pathname.startsWith('/novel')
  const isReader = pathname.startsWith('/read')
  const pageKey = isReader ? '/read' : pathname

  return (
    <div className="relative min-h-dvh">
      <div className="app-grid" aria-hidden="true" />
      <div className="relative z-[1]">
        {!hideNav && <NavBar />}
        <div key={pageKey} className={isReader ? 'page-enter-fade' : 'page-enter'}>
          <Outlet />
        </div>
      </div>
      <Toast />
    </div>
  )
}