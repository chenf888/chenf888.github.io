import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type TagVariant = 'accent' | 'blue' | 'green' | 'red' | 'yellow' | 'neutral'

const VARIANTS: Record<TagVariant, string> = {
  accent: 'bg-accent-soft text-accent-text',
  blue: 'bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[#1F6C9F]/20 dark:text-[#6ab0d6]',
  green: 'bg-[#EDF3EC] text-[#346538] dark:bg-[#346538]/20 dark:text-[#6fb074]',
  red: 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#9F2F2D]/20 dark:text-[#e07070]',
  yellow: 'bg-[#FBF3DB] text-[#956400] dark:bg-[#956400]/20 dark:text-[#d4a840]',
  neutral: 'bg-bg-alt text-dim',
}

interface TagProps {
  children: ReactNode
  variant?: TagVariant
}

export default function Tag({ children, variant = 'neutral' }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.62rem] font-medium leading-none',
        VARIANTS[variant],
      )}
    >
      {children}
    </span>
  )
}