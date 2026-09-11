import Drawer from '@/components/common/Drawer'
import ChapterList from '@/components/book/ChapterList'
import type { ChapterMeta } from '@/types'

interface CatalogDrawerProps {
  open: boolean
  metas: ChapterMeta[]
  currentChapterId: string
  readUpTo: number
  onClose: () => void
  onSelect: (meta: ChapterMeta) => void
}

/** 阅读页章节目录抽屉：桌面右滑 / 移动底部上滑，复用 ChapterList */
export default function CatalogDrawer({
  open,
  metas,
  currentChapterId,
  readUpTo,
  onClose,
  onSelect,
}: CatalogDrawerProps) {
  return (
    <Drawer open={open} title="目录" onClose={onClose}>
      <ChapterList
        metas={metas}
        currentChapterId={currentChapterId}
        readUpTo={readUpTo}
        onSelect={onSelect}
        showHeader
      />
    </Drawer>
  )
}