import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar'
import Toast from './Toast'

/** 应用外壳：全局背景 + 导航 + Toast + 路由出口 */
export default function AppShell() {
  const { pathname } = useLocation()
  // 详情页 / 阅读页自带独立导航（阅读页全屏），此处隐藏全局 pill 导航
  const hideNav = pathname.startsWith('/read') || pathname.startsWith('/novel')

  return (
    <div className="relative min-h-dvh">
      <div className="app-grid" aria-hidden="true" />
      <div className="relative z-[1]">
        {!hideNav && <NavBar />}
        <Outlet />
      </div>
      <Toast />
    </div>
  )
}