import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  FONT_OPTIONS,
  LINE_HEIGHT_PRESETS,
  PAGE_MODES,
  FONT_SIZE,
  LETTER_SPACING,
  PAGE_MARGIN,
  BRIGHTNESS,
} from '@/constants'
import { READER_THEMES } from '@/styles/themes'
import { useReaderStore } from '@/store/readerStore'
import { useUIStore } from '@/store/uiStore'
import Switch from '@/components/common/Switch'
import Modal from '@/components/common/Modal'
import { cn } from '@/utils/cn'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="shrink-0 font-mono text-xs text-dim">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  className,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('h-1 w-32 cursor-pointer appearance-none rounded-full bg-line accent-accent', className)}
    />
  )
}

export default function SettingsPanel() {
  const settings = useReaderStore((s) => s.settings)
  const update = useReaderStore((s) => s.updateSettings)
  const reset = useReaderStore((s) => s.resetSettings)
  const showToast = useUIStore((s) => s.showToast)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
      <Row label="亮度">
        <Slider
          value={settings.brightness}
          min={BRIGHTNESS.min}
          max={BRIGHTNESS.max}
          step={0.05}
          onChange={(v) => update({ brightness: v })}
        />
        <span className="w-9 text-right font-mono text-xs text-faint">
          {Math.round(settings.brightness * 100)}%
        </span>
      </Row>

      <Row label="字号">
        <button
          aria-label="减小字号"
          onClick={() => update({ fontSize: Math.max(FONT_SIZE.min, settings.fontSize - 1) })}
          className="rounded-btn border border-line px-3 py-1 text-sm text-ink transition-colors hover:border-line-hi"
        >
          A-
        </button>
        <span className="w-8 text-center font-mono text-xs text-dim">{settings.fontSize}</span>
        <button
          aria-label="增大字号"
          onClick={() => update({ fontSize: Math.min(FONT_SIZE.max, settings.fontSize + 1) })}
          className="rounded-btn border border-line px-3 py-1 text-sm text-ink transition-colors hover:border-line-hi"
        >
          A+
        </button>
      </Row>

      <Row label="行距">
        <div className="flex items-center gap-1.5">
          {LINE_HEIGHT_PRESETS.map((lh) => (
            <button
              key={lh}
              onClick={() => update({ lineHeight: lh })}
              className={cn(
                'rounded-btn px-2 py-1 font-mono text-xs transition-colors',
                settings.lineHeight === lh
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-dim hover:text-ink',
              )}
            >
              {lh}
            </button>
          ))}
        </div>
      </Row>

      <Row label="字距">
        <Slider
          value={settings.letterSpacing}
          min={LETTER_SPACING.min}
          max={LETTER_SPACING.max}
          step={1}
          onChange={(v) => update({ letterSpacing: v })}
        />
        <span className="w-8 text-right font-mono text-xs text-faint">
          {settings.letterSpacing}px
        </span>
      </Row>

      <Row label="页边距">
        <Slider
          value={settings.pageMargin}
          min={PAGE_MARGIN.min}
          max={PAGE_MARGIN.max}
          step={2}
          onChange={(v) => update({ pageMargin: v })}
        />
        <span className="w-9 text-right font-mono text-xs text-faint">
          {settings.pageMargin}px
        </span>
      </Row>

      <Row label="字体">
        <div className="flex items-center gap-1.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => update({ fontFamily: f.key })}
              className={cn(
                'rounded-btn px-2.5 py-1 text-xs transition-colors',
                settings.fontFamily === f.key
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-dim hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Row>

      <Row label="主题">
        <div className="flex items-center gap-1.5">
          {READER_THEMES.map((t) => (
            <button
              key={t.key}
              aria-label={t.label}
              onClick={() => update({ theme: t.key as typeof settings.theme })}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-btn border text-sm font-semibold',
                settings.theme === t.key ? 'border-accent' : 'border-line',
              )}
              style={{ background: t.bg, color: t.text }}
            >
              A
            </button>
          ))}
        </div>
      </Row>

      <Row label="翻页">
        <div className="flex items-center gap-1.5">
          {PAGE_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => update({ pageMode: m.key })}
              className={cn(
                'rounded-btn px-2.5 py-1 text-xs transition-colors',
                settings.pageMode === m.key
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-dim hover:text-ink',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Row>

      <Row label="首行缩进">
        <Switch
          checked={settings.paragraphIndent}
          onChange={(v) => update({ paragraphIndent: v })}
          label="首行缩进"
        />
      </Row>

      <Row label="自动下一章">
        <Switch
          checked={settings.autoLoadNext}
          onChange={(v) => update({ autoLoadNext: v })}
          label="自动加载下一章"
        />
      </Row>

      <Row label="显示阅读时长">
        <Switch
          checked={settings.showReadingTime}
          onChange={(v) => update({ showReadingTime: v })}
          label="显示阅读时长"
        />
      </Row>

      <button
        onClick={() => setConfirmReset(true)}
        className="mt-4 w-full rounded-btn border border-line py-2.5 text-sm text-dim transition-colors hover:border-line-hi hover:text-ink"
      >
        恢复默认设置
      </button>

      <Modal
        open={confirmReset}
        title="恢复默认设置？"
        description="字号、主题、翻页方式等将全部恢复为默认值。"
        confirmText="恢复"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset()
          setConfirmReset(false)
          showToast('已恢复默认设置')
        }}
      />
    </div>
  )
}