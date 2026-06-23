'use client'
import { useState, useEffect, useRef } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

/** Click-to-open select used by the landing template library and the editor template tab. */
export default function Dropdown({ value, options, onChange, minWidth = 150, size = 'md', height, renderOption, renderValue }: {
  value: string
  options: DropdownOption[]
  onChange: (v: string) => void
  minWidth?: number
  size?: 'sm' | 'md'
  /** Fixed control height in px. When set, overrides padding-driven height so the
   *  trigger can be aligned with sibling controls. Omit to keep default sizing. */
  height?: number
  /** Optional custom renderer for each menu row (e.g. a visual preview instead of text). */
  renderOption?: (option: DropdownOption, active: boolean) => React.ReactNode
  /** Optional custom renderer for the selected value shown in the trigger. */
  renderValue?: (option: DropdownOption | undefined) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const current = options.find(o => o.value === value)
  const currentLabel = current?.label ?? value
  const sm = size === 'sm'

  return (
    <div ref={ref} style={{ position: 'relative', minWidth }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
          padding: sm ? '7px 11px' : '9px 14px', borderRadius: '10px', cursor: 'pointer',
          ...(height ? { height: `${height}px`, paddingTop: 0, paddingBottom: 0, boxSizing: 'border-box' as const } : {}),
          fontFamily: 'var(--font-sans)', fontSize: sm ? '12px' : '13px', fontWeight: 600, color: '#0f172a',
          background: 'white', border: `1.5px solid ${open ? 'var(--theme-blue)' : '#e2e8f0'}`,
          transition: 'border-color 0.15s', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden' }}>{renderValue ? renderValue(current) : currentLabel}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(15,23,42,0.14)', padding: '5px', maxHeight: '320px', overflowY: 'auto',
        }}>
          {options.map(o => {
            const active = o.value === value
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: renderOption ? '5px 10px' : sm ? '7px 10px' : '8px 11px', borderRadius: '7px',
                  cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)',
                  fontSize: sm ? '12px' : '13px', fontWeight: active ? 700 : 500,
                  color: active ? 'var(--theme-blue)' : '#475569',
                  background: active ? '#eff6ff' : 'transparent', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {renderOption ? renderOption(o, active) : o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
