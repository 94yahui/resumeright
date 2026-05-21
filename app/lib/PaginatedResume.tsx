'use client'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { ResumeData, SelectionType, SectionKey } from './types'
import { TemplateConfig } from './templates-config'

const PAGE_HEIGHT = 1123  // A4 height @ 96dpi
const PAGE_WIDTH = 794
const PAGE_GAP = 24
// Drop last page only if content is extremely thin — prevents phantom blank pages
// without aggressively swallowing pages that have meaningful content.
const MIN_LAST_PAGE_CONTENT = 20
// Pixels pulled UP from the detected entry boundary to create visual breathing room
// on the next page. Larger value gives more buffer against font-metric differences
// between the browser (where break points are measured) and headless Chromium (PDF).
const TOP_PAD = 14
// White space reserved at the top and bottom of continuation pages (page 2+).
// This ensures content has equal breathing room at the top and bottom of every page.
const CONTINUATION_PAD = 36

interface Props {
  data: ResumeData
  template: TemplateConfig
  color?: string
  interactive?: boolean
  selection?: SelectionType
  onSelect?: (s: SelectionType) => void
  onPhotoUpload?: () => void
  onPagesChange?: (pages: number) => void
  onReorderSection?: (sec: SectionKey, fromIdx: number, toIdx: number) => void
  showWatermark?: boolean
  /** When provided, skip internal DOM measurement and use these break points directly (e.g. for the print layer). */
  externalBreakPoints?: number[]
  /** Called after measurement with the freshly-computed break points (only fires when no externalBreakPoints). */
  onBreakPointsChange?: (bp: number[]) => void
  /** Called after measurement with the total content height in px (only fires when no externalBreakPoints). */
  onMeasure?: (totalHeight: number) => void
  aiSuggestionSections?: Set<string>
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

/**
 * For sidebar layouts, returns the left/right CSS pixel values for a white
 * overlay that covers only the CONTENT column from the break point to the
 * bottom of the page frame. This keeps the sidebar background visible at full
 * page height while hiding content that bleeds past the smart break.
 */
function getSidebarOverlay(layout: string): { left: number; right: number } | null {
  if (layout === 'sidebar-left-wide')   return { left: 252, right: 0 }
  if (layout === 'sidebar-left-narrow') return { left: 210, right: 0 }
  if (layout === 'sidebar-right')       return { left: 0,   right: 210 }
  return null
}

export default function PaginatedResume({
  data, template, color, interactive, selection, onSelect, onPhotoUpload, onPagesChange,
  onReorderSection, showWatermark, externalBreakPoints, onBreakPointsChange, onMeasure, aiSuggestionSections,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [internalPages, setInternalPages] = useState(1)
  // breakPoints[i] = natural Y offset where page i's content starts (exact, no overlap)
  const [internalBreakPoints, setInternalBreakPoints] = useState<number[]>([0])

  // Use external values when provided (print layer), otherwise use internal (canvas)
  const pages = externalBreakPoints ? externalBreakPoints.length : internalPages
  const breakPoints = externalBreakPoints ?? internalBreakPoints

  // Shared drag state — one ref + one state object passed to every page's ResumeRenderer
  // so that drag events initiated on page N are visible to drop targets on page M.
  const sharedDragRef = useRef<{ sec: SectionKey; idx: number } | null>(null)
  const [sharedDropTarget, setSharedDropTarget] = useState<{ sec: SectionKey; idx: number; half: 'top' | 'bottom' } | null>(null)

  // Track last notified break points so we only call the callback on actual changes
  const lastNotifiedBP = useRef('')

  useLayoutEffect(() => {
    // Print layer: skip measurement entirely — break points are provided externally
    if (externalBreakPoints) return

    const container = measureRef.current
    if (!container) return
    const h = container.scrollHeight
    onMeasure?.(h)

    // ResumeRenderer always has minHeight: PAGE_HEIGHT, so h >= PAGE_HEIGHT even for
    // sparse resumes. Use PAGE_HEIGHT (not PAGE_HEIGHT - CONTINUATION_PAD) as the
    // single-page threshold so a resume that fits in one A4 page stays as 1 page.
    // CONTINUATION_PAD only affects visible margins per page, not the measurement baseline.
    const contCap = PAGE_HEIGHT - 2 * CONTINUATION_PAD
    let totalPages: number
    if (h <= PAGE_HEIGHT) {
      totalPages = 1
    } else {
      const overflow = h - PAGE_HEIGHT  // content beyond one full page
      const remainingAfterPage1 = h - (PAGE_HEIGHT - CONTINUATION_PAD)
      const extraPages = Math.ceil(remainingAfterPage1 / contCap)
      const lastPageContent = remainingAfterPage1 - (extraPages - 1) * contCap
      // Blank-page guard: drop last page if real overflow or last-page content is too thin
      totalPages = Math.max(1,
        overflow < MIN_LAST_PAGE_CONTENT || lastPageContent < MIN_LAST_PAGE_CONTENT
          ? extraPages
          : 1 + extraPages
      )
    }

    // Use offsetTop chain-walking — unaffected by CSS transform:scale on parent
    const entryEls = Array.from(container.querySelectorAll('[data-entry]')) as HTMLElement[]
    const entries = entryEls.map(el => ({
      top: getOffsetFromContainer(el, container),
      height: el.offsetHeight,
    })).filter(e => e.top >= 0 && e.height < PAGE_HEIGHT * 0.9)

    // Section titles: protect from orphaning. If a title + MIN_SECTION_FOLLOW px
    // of breathing room would straddle the break, pull the break before the title.
    const MIN_SECTION_FOLLOW = 80
    const titleEls = Array.from(container.querySelectorAll('[data-section-start]')) as HTMLElement[]
    const sectionTitles = titleEls.map(el => ({
      top: getOffsetFromContainer(el, container),
      height: el.offsetHeight,
    })).filter(e => e.top >= 0)

    const newBreakPoints: number[] = [0]
    // First break is earlier to leave CONTINUATION_PAD space at bottom of page 1
    let breakAt = PAGE_HEIGHT - CONTINUATION_PAD
    let pagesBuilt = 1

    while (breakAt < h && pagesBuilt < totalPages) {
      let smartBreak = breakAt

      // Pass 1: find any entry straddling this break — push it to next page.
      for (const entry of entries) {
        const entryEnd = entry.top + entry.height
        if (entry.top < breakAt && entryEnd > breakAt) {
          const adjusted = Math.max(0, entry.top - TOP_PAD)
          const minBreak = newBreakPoints[newBreakPoints.length - 1] + 200
          if (adjusted > minBreak) {
            smartBreak = adjusted
          }
          break
        }
      }

      // Pass 2: find any section title that would be orphaned at the (possibly
      // already-adjusted) smartBreak. A title is orphaned if there is less than
      // MIN_SECTION_FOLLOW px of space for content below it before the break.
      for (const title of sectionTitles) {
        const virtualEnd = title.top + title.height + MIN_SECTION_FOLLOW
        if (title.top < smartBreak && virtualEnd > smartBreak) {
          const adjusted = Math.max(0, title.top - TOP_PAD)
          const minBreak = newBreakPoints[newBreakPoints.length - 1] + 200
          if (adjusted > minBreak) {
            smartBreak = adjusted
          }
          break
        }
      }

      newBreakPoints.push(smartBreak)
      // Each continuation page shows PAGE_HEIGHT - 2*CONTINUATION_PAD of content
      // (CONTINUATION_PAD at top + CONTINUATION_PAD at bottom)
      breakAt = smartBreak + PAGE_HEIGHT - 2 * CONTINUATION_PAD
      pagesBuilt++
    }

    if (totalPages !== internalPages) setInternalPages(totalPages)
    const bpStr = newBreakPoints.join(',')
    if (bpStr !== internalBreakPoints.join(',')) setInternalBreakPoints(newBreakPoints)

    // Notify parent only when break points actually changed
    if (bpStr !== lastNotifiedBP.current) {
      lastNotifiedBP.current = bpStr
      onBreakPointsChange?.(newBreakPoints)
    }
  })

  useEffect(() => {
    onPagesChange?.(pages)
  }, [pages, onPagesChange])

  const sidebarOverlay = getSidebarOverlay(template.layout)

  return (
    <div className="resume-pages-wrapper" style={{
      display: 'flex', flexDirection: 'column',
      gap: `${PAGE_GAP}px`, alignItems: 'center',
    }}>
      {/* Off-screen measurer — skipped when break points are provided externally (print layer).
          - position:relative makes it the offsetParent root for the chain walk
          - interactive matches visible pages so entry heights align exactly
          - pageCount=1 prevents sidebar minHeight inflation */}
      {!externalBreakPoints && (
        <div style={{
          position: 'absolute', left: '-99999px', top: 0,
          width: `${PAGE_WIDTH}px`,
          visibility: 'hidden', pointerEvents: 'none',
        }}>
          <div ref={measureRef} style={{ position: 'relative' }}>
            <ResumeRenderer
              data={data} template={template} color={color}
              interactive={interactive} pageCount={1}
            />
          </div>
        </div>
      )}

      {/* Visible page frames */}
      {Array.from({ length: pages }, (_, pageIdx) => {
        // Exact slice — no overlap between consecutive pages
        const translateY = breakPoints[pageIdx] ?? pageIdx * PAGE_HEIGHT
        const nextBreak = breakPoints[pageIdx + 1] ?? null

        // For non-last pages: clip content exactly at the next break point.
        // For last page: show the full remaining page height.
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
            {sidebarOverlay ? (
              // Sidebar layout: render the full page height so the sidebar background
              // extends to the bottom of the page frame. White overlays on the content
              // column hide bleed-through at top (continuation pages) and bottom (non-last pages).
              <>
                {/* For continuation pages, shift content DOWN by CONTINUATION_PAD so it starts
                    CONTINUATION_PAD from the top of the page frame (equal top + bottom margin).
                    The top overlay hides the "tail" of previous page content that appears at y=0. */}
                <div style={{ transform: `translateY(-${translateY - (pageIdx > 0 ? CONTINUATION_PAD : 0)}px)`, width: `${PAGE_WIDTH}px` }}>
                  <ResumeRenderer
                    data={data}
                    template={template}
                    color={color}
                    interactive={interactive}
                    selection={selection}
                    onSelect={onSelect}
                    onPhotoUpload={onPhotoUpload}
                    pageCount={pages}
                    onReorderSection={onReorderSection}
                    sharedDragRef={sharedDragRef}
                    sharedDropTarget={sharedDropTarget}
                    onSharedDropTargetChange={setSharedDropTarget}
                    aiSuggestionSections={aiSuggestionSections}
                  />
                </div>
                {/* Top overlay for continuation pages: hides page-1 tail that bleeds into y=0 */}
                {pageIdx > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: `${sidebarOverlay.left}px`,
                    right: `${sidebarOverlay.right}px`,
                    top: 0,
                    height: `${CONTINUATION_PAD}px`,
                    background: '#ffffff',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />
                )}
                {/* Bottom overlay: hide content past the break point + leave equal bottom margin */}
                {contentClipHeight < PAGE_HEIGHT && (
                  <div style={{
                    position: 'absolute',
                    left: `${sidebarOverlay.left}px`,
                    right: `${sidebarOverlay.right}px`,
                    top: `${contentClipHeight + (pageIdx > 0 ? CONTINUATION_PAD : 0)}px`,
                    bottom: 0,
                    background: '#ffffff',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />
                )}
              </>
            ) : (
              // Non-sidebar layout: clip the content at the break point.
              // For continuation pages (pageIdx > 0), the transform is shifted by CONTINUATION_PAD
              // so content starts CONTINUATION_PAD px from the top. A white positioned overlay
              // covers y=0..CONTINUATION_PAD to hide the tail of page N-1 that would otherwise
              // bleed through (CSS transform does not affect stacking — a plain spacer div would
              // render behind the transformed content and not block it).
              <>
                <div style={{ height: `${contentClipHeight + (pageIdx > 0 ? CONTINUATION_PAD : 0)}px`, overflow: 'hidden' }}>
                  <div style={{ transform: `translateY(-${translateY - (pageIdx > 0 ? CONTINUATION_PAD : 0)}px)`, width: `${PAGE_WIDTH}px` }}>
                    <ResumeRenderer
                      data={data}
                      template={template}
                      color={color}
                      interactive={interactive}
                      selection={selection}
                      onSelect={onSelect}
                      onPhotoUpload={onPhotoUpload}
                      pageCount={pages}
                      onReorderSection={onReorderSection}
                      sharedDragRef={sharedDragRef}
                      sharedDropTarget={sharedDropTarget}
                      onSharedDropTargetChange={setSharedDropTarget}
                      aiSuggestionSections={aiSuggestionSections}
                    />
                  </div>
                </div>
                {pageIdx > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: 0,
                    height: `${CONTINUATION_PAD}px`,
                    background: '#ffffff',
                    pointerEvents: 'none', zIndex: 1,
                  }} />
                )}
              </>
            )}

            {showWatermark && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', zIndex: 3,
              }}>
                <div style={{
                  transform: 'rotate(-35deg)',
                  fontSize: '64px', fontWeight: 500,
                  color: 'rgba(0,0,0,0.055)',
                  letterSpacing: '6px',
                  userSelect: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}>简力全开</div>
              </div>
            )}

            {interactive && pages > 1 && (
              <div className="resume-page-num" style={{
                position: 'absolute',
                bottom: '10px', right: '14px',
                fontSize: '10px', color: '#94a3b8', fontWeight: 500,
                pointerEvents: 'none',
                background: 'rgba(255,255,255,0.9)',
                padding: '2px 6px', borderRadius: '4px',
                zIndex: 2,
              }}>第 {pageIdx + 1} / {pages} 页</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
