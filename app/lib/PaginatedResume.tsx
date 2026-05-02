'use client'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { ResumeData, SelectionType } from './types'
import { TemplateConfig } from './templates-config'

const PAGE_HEIGHT = 1123  // A4 height @ 96dpi
const PAGE_WIDTH = 794
const PAGE_GAP = 24
// Drop last page if it has less than this many px of content (avoids phantom blank page)
const MIN_LAST_PAGE_CONTENT = 60
// Pages 2+ start this many px before the pushed entry for visual breathing room
const PAGE_TOP_MARGIN = 32

interface Props {
  data: ResumeData
  template: TemplateConfig
  color?: string
  interactive?: boolean
  selection?: SelectionType
  onSelect?: (s: SelectionType) => void
  onPhotoUpload?: () => void
  onPagesChange?: (pages: number) => void
}

/**
 * Uses offsetTop chain-walking (not getBoundingClientRect) to measure entry
 * positions. getBoundingClientRect is affected by the CSS transform:scale on
 * the parent canvas wrapper, giving wrong values at non-100% zoom.
 */
function getOffsetFromContainer(el: HTMLElement, container: HTMLElement): number {
  let top = 0
  let cur: HTMLElement | null = el
  while (cur && cur !== container) {
    top += cur.offsetTop
    cur = cur.offsetParent as HTMLElement | null
  }
  return top
}

export default function PaginatedResume({
  data, template, color, interactive, selection, onSelect, onPhotoUpload, onPagesChange,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)
  // breakPoints[i] = natural Y offset where page i's content starts
  const [breakPoints, setBreakPoints] = useState<number[]>([0])

  useLayoutEffect(() => {
    const container = measureRef.current
    if (!container) return
    const h = container.scrollHeight

    // Blank-page guard: drop last page if it has < threshold px of content
    const remainder = h % PAGE_HEIGHT
    const totalPages = Math.max(1,
      remainder > 0 && remainder < MIN_LAST_PAGE_CONTENT
        ? Math.floor(h / PAGE_HEIGHT)
        : Math.ceil(h / PAGE_HEIGHT)
    )

    // Use offsetTop chain-walking — unaffected by CSS transform:scale on parent
    const entryEls = Array.from(container.querySelectorAll('[data-entry]')) as HTMLElement[]
    const entries = entryEls.map(el => ({
      top: getOffsetFromContainer(el, container),
      height: el.offsetHeight,
    })).filter(e => e.top >= 0 && e.height < PAGE_HEIGHT * 0.9)

    const newBreakPoints: number[] = [0]
    let breakAt = PAGE_HEIGHT
    let pagesBuilt = 1

    while (breakAt < h && pagesBuilt < totalPages) {
      let smartBreak = breakAt

      // Find any entry straddling this break — push it to next page
      for (const entry of entries) {
        const entryEnd = entry.top + entry.height
        if (entry.top < breakAt && entryEnd > breakAt) {
          const minBreak = newBreakPoints[newBreakPoints.length - 1] + 200
          if (entry.top > minBreak) {
            smartBreak = entry.top
          }
          break
        }
      }

      newBreakPoints.push(smartBreak)
      breakAt = smartBreak + PAGE_HEIGHT
      pagesBuilt++
    }

    if (totalPages !== pages) setPages(totalPages)
    const bpStr = newBreakPoints.join(',')
    if (bpStr !== breakPoints.join(',')) setBreakPoints(newBreakPoints)
  })

  useEffect(() => {
    onPagesChange?.(pages)
  }, [pages, onPagesChange])

  return (
    <div className="resume-pages-wrapper" style={{
      display: 'flex', flexDirection: 'column',
      gap: `${PAGE_GAP}px`, alignItems: 'center',
    }}>
      {/* Off-screen measurer
          - position:relative makes it the offsetParent root for the chain walk
          - pageCount=1 prevents sidebar minHeight inflation */}
      <div style={{
        position: 'absolute', left: '-99999px', top: 0,
        width: `${PAGE_WIDTH}px`,
        visibility: 'hidden', pointerEvents: 'none',
      }}>
        <div ref={measureRef} style={{ position: 'relative' }}>
          <ResumeRenderer
            data={data} template={template} color={color}
            interactive={false} pageCount={1}
          />
        </div>
      </div>

      {/* Visible page frames */}
      {Array.from({ length: pages }, (_, pageIdx) => {
        const rawBreak = breakPoints[pageIdx] ?? pageIdx * PAGE_HEIGHT

        // Pages 2+ pull back by PAGE_TOP_MARGIN so the pushed entry has breathing room
        // at the top of the page instead of appearing flush against the edge.
        const translateY = pageIdx === 0
          ? 0
          : Math.max(0, rawBreak - PAGE_TOP_MARGIN)

        // Inner clip: for non-last pages, cut exactly at the next break point.
        // This prevents the entry-that-was-about-to-be-cut from bleeding through
        // at the bottom of the previous page.
        const nextBreak = breakPoints[pageIdx + 1] ?? null
        const contentClipHeight = pageIdx < pages - 1 && nextBreak !== null
          ? Math.min(PAGE_HEIGHT, nextBreak - translateY)
          : PAGE_HEIGHT

        return (
          <div key={pageIdx} className="resume-page" style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
            background: '#ffffff',
            boxShadow: interactive
              ? '0 4px 24px rgba(15, 23, 42, 0.12)'
              : '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Inner content clip — stops at smartBreak, leaving white space below */}
            <div style={{ height: `${contentClipHeight}px`, overflow: 'hidden' }}>
              <div style={{ transform: `translateY(-${translateY}px)`, width: `${PAGE_WIDTH}px` }}>
                <ResumeRenderer
                  data={data}
                  template={template}
                  color={color}
                  interactive={interactive}
                  selection={selection}
                  onSelect={onSelect}
                  onPhotoUpload={onPhotoUpload}
                  pageCount={pages}
                />
              </div>
            </div>

            {interactive && pages > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '10px', right: '14px',
                fontSize: '10px', color: '#94a3b8', fontWeight: 500,
                pointerEvents: 'none',
                background: 'rgba(255,255,255,0.9)',
                padding: '2px 6px', borderRadius: '4px',
              }}>第 {pageIdx + 1} / {pages} 页</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
