import { useState } from 'react'
import { cn } from '@/utils/cn'
import { COVER_GRADIENTS } from '@/constants'
import { hashString } from '@/utils/text'

interface CoverProps {
  src: string
  title: string
  className?: string
}

/** 封面：图片按需懒加载，加载失败降级为渐变 + 书名首字 */
export default function Cover({ src, title, className }: CoverProps) {
  const [error, setError] = useState(false)
  const showImg = Boolean(src) && !error
  const gradient = COVER_GRADIENTS[hashString(title) % COVER_GRADIENTS.length]
  const firstChar = title.trim().charAt(0) || '书'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[6px] border border-line bg-surface',
        className,
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="font-serif text-3xl text-white/90">{firstChar}</span>
        </div>
      )}
    </div>
  )
}