import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useTheme } from '@/hooks/useTheme'

/** 应用根：应用全局主题并挂载路由 */
export default function App() {
  useTheme()
  return <RouterProvider router={router} />
}