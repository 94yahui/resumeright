'use client'
import { memo, useRef, useState, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { TemplateConfig } from './templates-config'
import { THUMB_DATA, CATEGORY_THUMB_DATA, ResumeData } from './types'

function pickThumbData(template: TemplateConfig, categoryHint?: string): ResumeData {
  const hint = categoryHint && categoryHint !== 'all' ? categoryHint : null
  if (hint && CATEGORY_THUMB_DATA[hint]) return CATEGORY_THUMB_DATA[hint]
  // Fall back to template's first specific category
  const specific = template.categories.find(c => c !== 'general' && CATEGORY_THUMB_DATA[c])
  return specific ? CATEGORY_THUMB_DATA[specific] : THUMB_DATA
}

interface Props {
  template: TemplateConfig
  width?: number
  fillWidth?: boolean
  categoryHint?: string
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

const FillThumbnail = memo(function FillThumbnail({ template, categoryHint }: { template: TemplateConfig; categoryHint?: string }) {
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
  const base = pickThumbData(template, categoryHint)
  const thumbData = template.layout === 'bottom-strip'
    ? { ...base, hasSummary: false, hasProject: true, hasAward: true, hasCert: true, hasLanguage: true, hasInterest: false,
        exp: base.exp.slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
        edu: base.edu.slice(0, 1),
        project: (base.project ?? []).slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
        award: (base.award ?? []).slice(0, 1),
        cert: (base.cert ?? []).slice(0, 1) }
    : base

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

const TemplateThumbnail = memo(function TemplateThumbnail({ template, width = 200, fillWidth = false, categoryHint }: Props) {
  if (fillWidth) return <FillThumbnail template={template} categoryHint={categoryHint} />

  const scale = width / PAGE_WIDTH
  const visibleHeight = PAGE_HEIGHT * scale
  const base = pickThumbData(template, categoryHint)
  const thumbData = template.layout === 'bottom-strip'
    ? { ...base, hasSummary: false, hasProject: true, hasAward: true, hasCert: true, hasLanguage: true, hasInterest: false,
        exp: base.exp.slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
        edu: base.edu.slice(0, 1),
        project: (base.project ?? []).slice(0, 2).map(e => ({ ...e, bullets: e.bullets.slice(0, 2) })),
        award: (base.award ?? []).slice(0, 1),
        cert: (base.cert ?? []).slice(0, 1) }
    : base

  return (
    <div style={{ width, height: visibleHeight, overflow: 'hidden', position: 'relative', background: '#ffffff' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
        <ResumeRenderer template={template} data={thumbData} interactive={false} />
      </div>
    </div>
  )
})

export default TemplateThumbnail
