'use client'
import { memo, useRef, useState, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { TemplateConfig, AccentStyle, isSingleColumn } from './templates-config'
import { sampleResumeData, ResumeData } from './types'

interface Props {
  template: TemplateConfig
  width?: number
  fillWidth?: boolean
  /** Override the template's heading style (e.g. landing-page picker). */
  accentStyle?: AccentStyle
  /** Override the template's accent color (e.g. landing-page picker). */
  color?: string
  /** Override the resume content (e.g. Hero preview). Defaults to per-layout sample data. */
  data?: ResumeData
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const FIT_PAD = 10          // compress to fill close to the page bottom (minimal whitespace)
const MIN_FIT_SCALE = 0.55  // floor so content never becomes unreadable

// Cache the computed fit-scale per content/layout signature so repeated thumbnails
// (gallery, editor tab) don't each re-measure.
const fitScaleCache = new Map<string, number>()

function buildThumbData(template: TemplateConfig): ResumeData {
  return sampleResumeData({ single: isSingleColumn(template.layout) })
}

function applyOverrides(template: TemplateConfig, accentStyle?: AccentStyle): TemplateConfig {
  return accentStyle ? { ...template, accentStyle } : template
}

// Height depends on layout, photo, font, heading style, and the content itself (not color).
function fitKey(tpl: TemplateConfig, d: ResumeData): string {
  return [
    tpl.layout, tpl.showPhoto, tpl.fontPair, tpl.accentStyle,
    d.exp.length, d.exp[0]?.bullets.length ?? 0,
    d.project.length, d.project[0]?.bullets.length ?? 0,
    d.skillsStyle, d.languageStyle, d.hasSummary,
  ].join('|')
}

const TemplateThumbnail = memo(function TemplateThumbnail({ template, width = 200, fillWidth = false, accentStyle, color, data }: Props) {
  const tpl = applyOverrides(template, accentStyle)
  const rawData = data ?? buildThumbData(template)
  const key = fitKey(tpl, rawData)

  // ── Compress to one page: iteratively measure the (fitted) content height and shrink
  //    fontScale until it fits. Font scaling is non-linear (headers don't scale), so one
  //    pass can leave a small residual — a couple of correction passes converge. ──
  const measureRef = useRef<HTMLDivElement>(null)
  const iterRef = useRef(0)
  const [fitScale, setFitScale] = useState<number>(() => fitScaleCache.get(key) ?? 1)
  const [, force] = useState(0)
  const measured = fitScaleCache.has(key)

  useLayoutEffect(() => {
    iterRef.current = 0
    setFitScale(fitScaleCache.get(key) ?? 1)
  }, [key])

  useLayoutEffect(() => {
    if (fitScaleCache.has(key)) return
    const el = measureRef.current
    if (!el) return
    const h = el.scrollHeight  // height of the fitted render
    if (h <= PAGE_HEIGHT || fitScale <= MIN_FIT_SCALE || iterRef.current >= 4) {
      fitScaleCache.set(key, fitScale)
      force(v => v + 1)  // re-render to unmount the measurer
      return
    }
    iterRef.current += 1
    const next = Math.max(MIN_FIT_SCALE, +(fitScale * (PAGE_HEIGHT - FIT_PAD) / h).toFixed(4))
    if (next < fitScale - 0.002) setFitScale(next)
    else { fitScaleCache.set(key, fitScale); force(v => v + 1) }
  })

  const fittedData: ResumeData = fitScale < 1
    ? { ...rawData, fontScale: (rawData.fontScale ?? 1) * fitScale }
    : rawData

  // ── Scale the A4 page to the available width ──
  const wrapRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState<number>(fillWidth ? 0 : width)
  useLayoutEffect(() => {
    if (!fillWidth) { setCw(width); return }
    const el = wrapRef.current
    if (!el) return
    setCw(el.offsetWidth)
    const obs = new ResizeObserver(([e]) => setCw(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [fillWidth, width])

  const scale = cw > 0 ? cw / PAGE_WIDTH : 0
  const containerStyle: React.CSSProperties = fillWidth
    ? { width: '100%', aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`, overflow: 'hidden', position: 'relative', background: '#fff' }
    : { width, height: PAGE_HEIGHT * scale, overflow: 'hidden', position: 'relative', background: '#fff' }

  return (
    <>
      {/* Off-screen measurer at base scale — only until the fit-scale is known/cached. */}
      {!measured && (
        <div aria-hidden style={{ position: 'absolute', left: '-99999px', top: 0, width: `${PAGE_WIDTH}px`, visibility: 'hidden', pointerEvents: 'none' }}>
          <div ref={measureRef}>
            <ResumeRenderer template={tpl} data={fittedData} color={color} interactive={false} skipMinHeight />
          </div>
        </div>
      )}
      <div ref={wrapRef} style={containerStyle}>
        {scale > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
            <ResumeRenderer template={tpl} data={fittedData} color={color} interactive={false} />
          </div>
        )}
      </div>
    </>
  )
})

export default TemplateThumbnail
