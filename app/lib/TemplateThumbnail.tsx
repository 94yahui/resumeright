'use client'
import { useRef, useState, useLayoutEffect } from 'react'
import ResumeRenderer from './ResumeRenderer'
import { TemplateConfig } from './templates-config'
import { THUMB_DATA } from './types'

interface Props {
  template: TemplateConfig
  width?: number
  fillWidth?: boolean
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export default function TemplateThumbnail({ template, width = 200, fillWidth = false }: Props) {
  if (fillWidth) return <FillThumbnail template={template} />

  const scale = width / PAGE_WIDTH
  const visibleHeight = PAGE_HEIGHT * scale

  return (
    <div style={{ width, height: visibleHeight, overflow: 'hidden', position: 'relative', background: '#ffffff' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
        <ResumeRenderer template={template} data={THUMB_DATA} interactive={false} />
      </div>
    </div>
  )
}

function FillThumbnail({ template }: { template: TemplateConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(0)

  // useLayoutEffect: fires before paint → no visible flash between SSR and measured size.
  // cw=0 on server (no content rendered); client measures immediately and fills correctly.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setCw(el.offsetWidth)
    const obs = new ResizeObserver(([e]) => setCw(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const scale = cw > 0 ? cw / PAGE_WIDTH : 0

  return (
    // aspect-ratio: CSS computes correct A4 height from width — no JS needed for sizing.
    // Inner div is position:absolute so its 794px layout width doesn't escape overflow:hidden
    // and doesn't push the CSS grid track wider than 1fr on mobile.
    <div ref={ref} style={{ width: '100%', aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`, overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {cw > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
          <ResumeRenderer template={template} data={THUMB_DATA} interactive={false} />
        </div>
      )}
    </div>
  )
}
