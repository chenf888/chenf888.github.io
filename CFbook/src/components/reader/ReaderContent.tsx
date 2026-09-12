import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { Chapter, ReaderSettings } from '@/types'
import { READER_FONTS } from '@/constants'
import { splitParagraphs, paginateContent } from '@/utils/pagination'
import { useSwipe } from '@/hooks/useSwipe'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/utils/cn'

export interface ReaderContentHandle {
  next: () => void
  prev: () => void
  scrollBy: (delta: number) => void
}

interface ReaderContentProps {
  chapter: Chapter
  settings: ReaderSettings
  savedScrollPercent: number
  savedPageIndex: number
  hasPrevChapter: boolean
  hasNextChapter: boolean
  onScrollPercent: (p: number) => void
  onPageIndex: (i: number, total: number) => void
  onNextChapter: () => void
  onPrevChapter: () => void
  onToggleToolbar: () => void
}

const TOP_PAD = 72
const BOTTOM_PAD = 88

const ReaderContent = forwardRef<ReaderContentHandle, ReaderContentProps>(
  function ReaderContent(props, ref) {
    const {
      chapter,
      settings,
      savedScrollPercent,
      savedPageIndex,
      hasPrevChapter,
      hasNextChapter,
      onScrollPercent,
      onPageIndex,
      onNextChapter,
      onPrevChapter,
      onToggleToolbar,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const measurerRef = useRef<HTMLDivElement>(null)

    const size = useElementSize(rootRef)
    const [fontsReady, setFontsReady] = useState(false)
    const [pages, setPages] = useState<string[][]>([])
    const [pageIndex, setPageIndex] = useState(0)
    const chapterRef = useRef(chapter.id)
    const autoNextRef = useRef(false)

    const mode = settings.pageMode
    const fontFamily = READER_FONTS[settings.fontFamily]
    const paraGap = Math.floor(settings.fontSize * settings.lineHeight * 0.5)
    const pageWidth = Math.max(
      200,
      Math.min(720, size.width - settings.pageMargin * 2),
    )
    const pageHeight = Math.max(200, size.height - TOP_PAD - BOTTOM_PAD)
    const paragraphs = splitParagraphs(chapter.content)

    useEffect(() => {
      let alive = true
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (alive) setFontsReady(true)
        })
      } else {
        setFontsReady(true)
      }
      return () => {
        alive = false
      }
    }, [])

    useLayoutEffect(() => {
      if (mode === 'scroll' || !fontsReady || size.width <= 0 || size.height <= 0) return
      const measurer = measurerRef.current
      const measure = (text: string): number => {
        if (!measurer) return settings.fontSize * settings.lineHeight + paraGap
        measurer.textContent = text
        return measurer.offsetHeight
      }
      const result = paginateContent(paragraphs, measure, paraGap, pageHeight)
      setPages(result)
      const isNewChapter = chapterRef.current !== chapter.id
      chapterRef.current = chapter.id
      setPageIndex((i) => {
        const base = isNewChapter ? savedPageIndex : i
        return Math.max(0, Math.min(base, Math.max(0, result.length - 1)))
      })
    }, [
      mode,
      fontsReady,
      size.width,
      size.height,
      settings.fontSize,
      settings.lineHeight,
      settings.letterSpacing,
      settings.fontFamily,
      settings.pageMargin,
      chapter.content,
    ])

    useEffect(() => {
      if (mode === 'scroll') return
      onPageIndex(pageIndex, pages.length)
    }, [pageIndex, pages.length, mode, onPageIndex])

    useEffect(() => {
      if (mode !== 'scroll') return
      const el = scrollRef.current
      if (!el) return
      const apply = () => {
        const max = el.scrollHeight - el.clientHeight
        el.scrollTop = Math.max(0, savedScrollPercent * max)
      }
      const raf = requestAnimationFrame(apply)
      return () => cancelAnimationFrame(raf)
    }, [mode, chapter.id, savedScrollPercent])

    const next = () => {
      if (mode === 'scroll') {
        onNextChapter()
        return
      }
      if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1)
      else onNextChapter()
    }

    const prev = () => {
      if (mode === 'scroll') {
        onPrevChapter()
        return
      }
      if (pageIndex > 0) setPageIndex(pageIndex - 1)
      else onPrevChapter()
    }

    useImperativeHandle(ref, () => ({
      next,
      prev,
      scrollBy: (delta) => {
        const el = scrollRef.current
        if (el) el.scrollTop += delta
      },
    }))

    useSwipe(rootRef, { onPrev: prev, onNext: next })

    const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
      const x = e.clientX
      const third = window.innerWidth / 3
      if (x < third) prev()
      else if (x > third * 2) next()
      else onToggleToolbar()
    }

    const onScroll = () => {
      const el = scrollRef.current
      if (!el) return
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? el.scrollTop / max : 0
      onScrollPercent(p)
      if (settings.autoLoadNext && p >= 0.995 && !autoNextRef.current && hasNextChapter) {
        autoNextRef.current = true
        onNextChapter()
      }
    }

    const textStyle: React.CSSProperties = {
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      letterSpacing: `${settings.letterSpacing}px`,
      fontFamily,
      textAlign: settings.textAlign,
    }

    const renderParagraph = (para: string, key: number) => (
      <p
        key={key}
        style={{
          ...textStyle,
          marginBottom: paraGap,
          textIndent: settings.paragraphIndent ? '2em' : '0',
        }}
      >
        {para}
      </p>
    )

    const renderTitle = () => (
      <h2
        className="mb-6 text-center font-serif font-semibold"
        style={{ fontSize: settings.fontSize * 1.3, fontFamily }}
      >
        {chapter.title}
      </h2>
    )

    const chapterNav = (top: boolean) => {
      const isPrev = top
      const enabled = isPrev ? hasPrevChapter : hasNextChapter
      const label = isPrev
        ? enabled
          ? '上一章'
          : '已是第一章'
        : enabled
          ? '下一章'
          : '全书完'
      return (
        <div className="my-8 flex justify-center">
          <button
            disabled={!enabled}
            onClick={isPrev ? onPrevChapter : onNextChapter}
            className="rounded-btn border border-line px-5 py-2 text-sm text-dim transition-colors hover:border-accent hover:text-accent-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            {label}
          </button>
        </div>
      )
    }

    const renderPage = (page: string[], index: number) => (
      <div className="flex h-full flex-col px-[--page-margin] pt-[--top-pad] pb-[--bottom-pad]">
        <div className="mx-auto flex w-full max-w-[720px] flex-col">
          {index === 0 && renderTitle()}
          {page.map(renderParagraph)}
        </div>
      </div>
    )

    const contentStyle = {
      '--page-margin': `${settings.pageMargin}px`,
      '--top-pad': `${TOP_PAD}px`,
      '--bottom-pad': `${BOTTOM_PAD}px`,
    } as React.CSSProperties

    return (
      <div
        ref={rootRef}
        onClick={onTap}
        className="absolute inset-0 touch-manipulation select-none"
        style={{ ...contentStyle, fontFamily }}
      >
        <div
          ref={measurerRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: -9999,
            top: 0,
            width: pageWidth,
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}px`,
            fontFamily,
            visibility: 'hidden',
          }}
        />
        <div key={chapter.id} className="chapter-in absolute inset-0">
          {mode === 'scroll' ? (
            <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar absolute inset-0 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-[--page-margin] pt-[--top-pad] pb-[--bottom-pad]">
                {renderTitle()}
                {chapterNav(true)}
                {paragraphs.map(renderParagraph)}
                {chapterNav(false)}
              </div>
            </div>
          ) : mode === 'slide' ? (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateX(-${pageIndex * 100}%)`,
                  transition: 'transform 250ms ease-out',
                }}
              >
                {pages.map((page, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-full"
                    style={{ left: `${i * 100}%` }}
                  >
                    {renderPage(page, i)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <div
                key={mode === 'flip' ? pageIndex : 'none'}
                className={cn('h-full w-full', mode === 'flip' && 'reader-flip')}
              >
                {pages[pageIndex] ? renderPage(pages[pageIndex], pageIndex) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

export default ReaderContent