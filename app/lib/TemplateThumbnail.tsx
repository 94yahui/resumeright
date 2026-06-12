'use client'
import { memo, useRef, useState, useLayoutEffect } from 'react'
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

  return (
    <div ref={ref} style={{ width: '100%', aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`, overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {cw > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', width: `${PAGE_WIDTH}px`, pointerEvents: 'none' }}>
          <ResumeRenderer template={template} data={THUMB_DATA} interactive={false} />
        </div>
      )}
    </div>
  )
})

const TemplateThumbnail = memo(function TemplateThumbnail({ template, width = 200, fillWidth = false }: Props) {
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
})

export default TemplateThumbnail
