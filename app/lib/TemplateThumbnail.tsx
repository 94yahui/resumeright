'use client'
import ResumeRenderer from './ResumeRenderer'
import { TemplateConfig } from './templates-config'
import { THUMB_DATA } from './types'

interface Props {
  template: TemplateConfig
  width?: number
}

const PAGE_WIDTH = 794

export default function TemplateThumbnail({ template, width = 200 }: Props) {
  const scale = width / PAGE_WIDTH
  const realHeight = 1123
  const visibleHeight = realHeight * scale

  return (
    <div style={{
      width,
      height: visibleHeight,
      overflow: 'hidden',
      position: 'relative',
      borderRadius: '4px',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${PAGE_WIDTH}px`,
        pointerEvents: 'none',
      }}>
        <ResumeRenderer template={template} data={THUMB_DATA} interactive={false} />
      </div>
    </div>
  )
}
