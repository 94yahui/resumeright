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

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setCw(el.offsetWidth)
    const obs = new ResizeObserver(([e]) => setCw(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Render the resume at 86% of the card width so it appears as a
  // "sheet of paper" floating in the card — fonts look proportionally
  // smaller relative to the card, matching expectations of a miniature document.
  const PAD_RATIO = 0.07
  const scale = cw > 0 ? (cw * (1 - PAD_RATIO * 2)) / PAGE_WIDTH : 0
  const pad = cw * PAD_RATIO

  return (
    <div ref={ref} style={{ width: '100%', aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`, overflow: 'hidden', position: 'relative', background: '#dde3ea' }}>
      {cw > 0 && (
        <div style={{ position: 'absolute', top: pad, left: pad, transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
          <ResumeRenderer template={template} data={THUMB_DATA} interactive={false} />
        </div>
      )}
    </div>
  )
}
