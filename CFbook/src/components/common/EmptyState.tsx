import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {icon && <div className="text-4xl text-faint">{icon}</div>}
      <p className="font-serif text-lg text-dim">{title}</p>
      {description && <p className="max-w-sm text-sm text-faint">{description}</p>}
      {action}
    </div>
  )
}