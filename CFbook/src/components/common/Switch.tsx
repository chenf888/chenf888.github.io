import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
}

/** 圆形滑块开关（单一风格，符合主页视觉） */
export default function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-line-hi',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}