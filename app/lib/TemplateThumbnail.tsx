'use client'
import { memo, useRef, useState, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { TemplateConfig } from './templates-config'
import { THUMB_DATA } from './types'

// Trimmed data for bottom-strip layout — the strip must be visible at the bottom
// of the thumbnail, so we reduce content to ensure no overflow past PAGE_HEIGHT.
const THUMB_DATA_BOTTOM = {
  ...THUMB_DATA,
  hasSummary: false,
  hasProject: true,
  hasAward: true,
  hasCert: true,
  hasLanguage: true,
  hasInterest: false,
  exp: THUMB_DATA.exp.slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
  edu: THUMB_DATA.edu.slice(0, 1),
  project: THUMB_DATA.project.slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
  award: THUMB_DATA.award.slice(0, 1),
  cert: THUMB_DATA.cert.slice(0, 1),
}

interface Props {
  template: TemplateConfig
  width?: number
  fillWidth?: boolean
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

const FillThumbnail = memo(function FillThumbnail({ template }: { template: TemplateConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setCw(el.offsetWidth)
    const obs = new ResizeObserver(([e]) => setCw(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const scale = cw > 0 ? cw / PAGE_WIDTH : 0
  const thumbData = template.layout === 'bottom-strip' ? THUMB_DATA_BOTTOM : THUMB_DATA

  return (
    <div ref={ref} style={{ width: '100%', aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`, overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {cw > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
          <ResumeRenderer template={template} data={thumbData} interactive={false} />
        </div>
      )}
    </div>
  )
})

const TemplateThumbnail = memo(function TemplateThumbnail({ template, width = 200, fillWidth = false }: Props) {
  if (fillWidth) return <FillThumbnail template={template} />

  const scale = width / PAGE_WIDTH
  const visibleHeight = PAGE_HEIGHT * scale
  const thumbData = template.layout === 'bottom-strip' ? THUMB_DATA_BOTTOM : THUMB_DATA

  return (
    <div style={{ width, height: visibleHeight, overflow: 'hidden', position: 'relative', background: '#ffffff' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
        <ResumeRenderer template={template} data={thumbData} interactive={false} />
      </div>
    </div>
  )
})

export default TemplateThumbnail
