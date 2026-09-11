import { lazy, Suspense } from 'react'
import { createHashRouter } from 'react-router-dom'
import AppShell from '@/components/common/AppShell'
import Spinner from '@/components/common/Spinner'
import ShelfPage from '@/pages/ShelfPage'
import NovelDetailPage from '@/pages/NovelDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'

const ReaderPage = lazy(() => import('@/pages/ReaderPage'))
const ImportedBooksPage = lazy(() => import('@/pages/ImportedBooksPage'))

/** 路由级代码分割时的加载占位 */
function RouteLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-6 w-6 text-dim" />
    </div>
  )
}

/**
 * createHashRouter：GitHub Pages 无 SPA 回退，hash 路由刷新子路径不会 404。
 * 阅读页 / 导入管理页按需分包，减少首屏体积。
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ShelfPage /> },
      { path: 'novel/:novelId', element: <NovelDetailPage /> },
      {
        path: 'read/:novelId/:chapterId',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ReaderPage />
          </Suspense>
        ),
      },
      {
        path: 'imported',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ImportedBooksPage />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])