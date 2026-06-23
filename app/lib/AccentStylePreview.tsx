'use client'
import { useRef, useLayoutEffect } from 'react'
import type { AccentStyle } from './templates-config'

// Squircle (continuous-corner) pill used by the 'background-pill' heading style.
function SquirclePill({ children, bg }: { children: React.ReactNode; bg: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      const w = el.offsetWidth, h = el.offsetHeight
      if (!w || !h) return
      const r = 2, l = r * 1.528, k = r * 0.569
      el.style.clipPath = `path('M ${l} 0 H ${w-l} C ${w-k} 0 ${w} ${k} ${w} ${l} V ${h-l} C ${w} ${h-k} ${w-k} ${h} ${w-l} ${h} H ${l} C ${k} ${h} 0 ${h-k} 0 ${h-l} V ${l} C 0 ${k} ${k} 0 ${l} 0 Z')`
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <span ref={ref} style={{ display: 'inline-block', background: bg, padding: '3px 7px' }}>{children}</span>
}

/** A small visual sample of how a heading (section title) is decorated for a given AccentStyle. */
export default function AccentStylePreview({ style, color, height = 30, width = '100%' }: { style: AccentStyle; color: string; height?: number; width?: number | string }) {
  const c = color || '#0f172a'
  const text = 'Experience'
  const h = `${height}px`

  const baseText: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, color: c,
    letterSpacing: '0.8px', textTransform: 'uppercase',
    lineHeight: 1, whiteSpace: 'nowrap',
  }

  const content = (() => {
    switch (style) {
    case 'underline-bar':
      return (
        <div style={{ height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ height: '2px', width: '24px', background: c }} />
        </div>
      )
    case 'left-bar':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '3px', height: '13px', background: c, flexShrink: 0 }} />
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'side-icon':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: c, flexShrink: 0 }} />
          <div style={baseText}>{text}</div>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.3 }} />
        </div>
      )
    case 'background-pill':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center' }}>
          <SquirclePill bg={c}>
            <span style={{ ...baseText, color: '#fff' }}>{text}</span>
          </SquirclePill>
        </div>
      )
    case 'thin-line':
      return (
        <div style={{ height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ height: '1px', background: c }} />
        </div>
      )
    case 'double-line':
      return (
        <div style={{ height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
          <div style={{ height: '1px', background: c }} />
          <div style={{ ...baseText, textAlign: 'center' }}>{text}</div>
          <div style={{ height: '1px', background: c }} />
        </div>
      )
    case 'triple-bar':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: '2px' }}>
            <div style={{ width: '4px', height: '10px', background: c }} />
            <div style={{ width: '3px', height: '10px', background: c, opacity: 0.6 }} />
            <div style={{ width: '2px', height: '10px', background: c, opacity: 0.3 }} />
          </div>
        </div>
      )
    case 'arrow-trio':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ display: 'flex', gap: '1px', alignItems: 'center', flexShrink: 0, lineHeight: 1 }}>
            <span style={{ fontSize: '11px', color: c, opacity: 1 }}>›</span>
            <span style={{ fontSize: '11px', color: c, opacity: 0.55 }}>›</span>
            <span style={{ fontSize: '11px', color: c, opacity: 0.22 }}>›</span>
          </div>
        </div>
      )
    case 'gradient-band':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', marginLeft: '-4px', paddingLeft: '6px', borderLeft: `2px solid ${c}`, background: `linear-gradient(to right, ${c}22, transparent)` }}>
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'flanked-line':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.6 }} />
          <div style={{ ...baseText, whiteSpace: 'nowrap' }}>{text}</div>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.6 }} />
        </div>
      )
    case 'slash-prefix':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '9px', color: c, opacity: 0.45, letterSpacing: '-1px', lineHeight: 1, flexShrink: 0 }}>{'//'}</span>
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'highlight-mark':
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ ...baseText, position: 'relative', zIndex: 1 }}>{text}</div>
            <div style={{ position: 'absolute', bottom: '-1px', left: '-2px', right: '-2px', height: '42%', background: `${c}38`, borderRadius: '1px', zIndex: 0 }} />
          </div>
        </div>
      )
    case 'plain-bold':
    default:
      return (
        <div style={{ height: h, display: 'flex', alignItems: 'center' }}>
          <div style={{ ...baseText, fontSize: '10px' }}>{text}</div>
        </div>
      )
    }
  })()

  return <div style={{ width }}>{content}</div>
}
