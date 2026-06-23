'use client'
import { useState, useEffect, useCallback } from 'react'
import { TEMPLATES, TemplateConfig, AccentStyle, ORDERED_TEMPLATES, ACCENT_COLOR_PRESETS, ACCENT_STYLES } from '../lib/templates-config'
import TemplateThumbnail from '../lib/TemplateThumbnail'
import AccentStylePreview from '../lib/AccentStylePreview'
import Dropdown from './Dropdown'
import { Scale, Plus } from 'lucide-react'

// Heading (section-title) styles users can preview across every template — full editor list.
const HEADING_STYLES = ACCENT_STYLES

// Accent colors — shared palette with the editor.
const COLOR_SWATCHES = ACCENT_COLOR_PRESETS

const TOTAL_COUNT = TEMPLATES.length
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

const SINGLE_LAYOUTS = new Set([
  'single-classic', 'single-centered', 'top-banner-photo', 'header-card',
  'accent-stripe', 'bottom-strip', 'namecard-header', 'linkedin-banner', 'diagonal-photo',
])
// Landing-page filters by layout shape / photo, not industry.
const FILTERS = ['All', 'With photo', 'No photo', 'One column', 'Two column']
function matchesFilter(t: TemplateConfig, filter: string): boolean {
  switch (filter) {
    case 'With photo': return t.showPhoto
    case 'No photo':   return !t.showPhoto
    case 'One column': return SINGLE_LAYOUTS.has(t.layout)
    case 'Two column': return !SINGLE_LAYOUTS.has(t.layout)
    default:           return true
  }
}

// Build the editor URL, carrying the chosen heading style / color as query params.
function buildEditorUrl(tplId: string, headingStyle: AccentStyle | null, accentColor: string | null): string {
  const params = new URLSearchParams({ template: tplId })
  if (headingStyle) params.set('accent', headingStyle)
  if (accentColor) params.set('color', accentColor)
  return `/editor?${params.toString()}`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
      {children}
    </div>
  )
}

export default function Templates() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [headingStyle, setHeadingStyle] = useState<AccentStyle | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [extraLoads, setExtraLoads] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [previewTpl, setPreviewTpl] = useState<TemplateConfig | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setExtraLoads(0) }, [isMobile])

  const step = isMobile ? 6 : 8
  const defaultCount = isMobile ? 6 : 8
  const showCount = defaultCount + extraLoads * step

  const filtered = ORDERED_TEMPLATES.filter(t => matchesFilter(t, activeFilter))
  const visible = filtered.slice(0, showCount)
  const hasMore = filtered.length > showCount
  // A color is "custom" when it's set but not one of the preset swatches.
  const customColorActive = accentColor !== null && !COLOR_SWATCHES.includes(accentColor)
  // Smaller swatches on mobile so the whole palette fits on one row.
  const dot = isMobile ? 22 : 26
  // On mobile every swatch flexes to fill the full-width palette and stays circular;
  // on desktop they keep a fixed pixel size.
  // Cap so a swatch never grows taller than the 40px-high palette bar; any extra
  // width is absorbed by the row's space-between distribution.
  const dotSizing: React.CSSProperties = isMobile
    ? { flex: '1 1 0', minWidth: 0, maxWidth: 26, aspectRatio: '1 / 1', height: 'auto' }
    : { width: dot, height: dot, flexShrink: 0 }

  function handleFilterChange(f: string) {
    setActiveFilter(f)
    setExtraLoads(0)
  }

  return (
    <section id="templates" className="templates-section" style={{
      backgroundColor: '#e8ecf0',
      backgroundImage: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      padding: '80px 32px',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto 48px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px',
      }} className="fade-in templates-header">
        <div>
          <div style={{
            fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase',
            color: '#64748b', fontWeight: 600, marginBottom: '12px',
          }}>Template Library</div>
          <h2 style={{
            fontSize: '38px', letterSpacing: '-1px', lineHeight: 1.15,
            fontWeight: 700, color: '#0f172a',
          }}>
            Find <span style={{ color: 'var(--theme-blue)' }}>your</span> style
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '10px', fontWeight: 400 }}>
            {TOTAL_COUNT} professional designs, all free
          </p>
        </div>

      </div>

      {/* Filter + heading-style + color customizers — apply to every preview */}
      <div style={{
        maxWidth: '1280px', margin: '0 auto 36px',
        display: 'flex', flexWrap: 'wrap', gap: isMobile ? '12px' : '24px',
        alignItems: 'flex-start',
        position: 'relative', zIndex: 40,
      }} className="fade-in">
        {/* Layout / photo filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', ...(isMobile ? { flex: '1 1 0', minWidth: 0 } : {}) }}>
          <FieldLabel>Show</FieldLabel>
          <Dropdown
            value={activeFilter}
            options={FILTERS.map(f => ({ value: f, label: f }))}
            onChange={handleFilterChange}
            minWidth={isMobile ? 0 : 150}
            height={40}
          />
        </div>

        {/* Heading style — dropdown with visual previews, no labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', ...(isMobile ? { flex: '1 1 0', minWidth: 0 } : {}) }}>
          <FieldLabel>Heading style</FieldLabel>
          <Dropdown
            value={headingStyle ?? ''}
            options={[{ value: '', label: 'Default' }, ...HEADING_STYLES]}
            onChange={v => setHeadingStyle(v === '' ? null : v as AccentStyle)}
            minWidth={isMobile ? 0 : 170}
            height={40}
            renderValue={o => o && o.value !== ''
              ? <AccentStylePreview style={o.value as AccentStyle} color={accentColor ?? '#0f172a'} height={30} width={130} />
              : <span style={{ color: '#0f172a' }}>Default</span>}
            renderOption={(o, active) => o.value === ''
              ? <span style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--theme-blue)' : '#475569' }}>Default</span>
              : <AccentStylePreview style={o.value as AccentStyle} color={accentColor ?? '#0f172a'} height={30} width={130} />}
          />
        </div>

        {/* Color */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
          <FieldLabel>Color</FieldLabel>
          <div style={{
            display: 'flex', gap: isMobile ? '6px' : '8px', flexWrap: 'nowrap', alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : undefined,
            height: '40px', boxSizing: 'border-box', padding: '0 7px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
            width: isMobile ? '100%' : undefined,
            maxWidth: '100%', overflowX: isMobile ? 'hidden' : 'auto',
          }}>
            <button
              onClick={() => setAccentColor(null)}
              title="Default"
              style={{
                ...dotSizing, borderRadius: '50%', cursor: 'pointer',
                background: 'conic-gradient(from 90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)',
                border: accentColor === null ? '2px solid #0f172a' : '2px solid transparent',
                boxShadow: accentColor === null ? '0 0 0 2px white inset' : 'none',
                padding: 0,
              }}
            />
            {COLOR_SWATCHES.map(c => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                title={c}
                style={{
                  ...dotSizing, borderRadius: '50%', cursor: 'pointer',
                  background: c,
                  border: accentColor === c ? '2px solid #0f172a' : '2px solid transparent',
                  boxShadow: accentColor === c ? '0 0 0 2px white inset' : 'none',
                  padding: 0,
                }}
              />
            ))}
            {/* Custom color */}
            <label
              title="Custom color"
              style={{
                ...dotSizing, position: 'relative', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: customColorActive ? accentColor! : 'white',
                border: customColorActive ? '2px solid #0f172a' : '2px dashed #cbd5e1',
                boxShadow: customColorActive ? '0 0 0 2px white inset' : 'none',
              }}
            >
              <input
                type="color"
                value={customColorActive ? accentColor! : '#0f172a'}
                onChange={e => setAccentColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
              />
              {!customColorActive && <Plus size={14} color="#94a3b8" strokeWidth={2.25} style={{ display: 'block' }} />}
            </label>
          </div>
        </div>
      </div>

      <div className="templates-grid" style={{
        maxWidth: '1280px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(270px, 1fr))',
        gap: isMobile ? '14px' : '28px',
      }}>
        {visible.map((tpl, i) => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            delay={Math.min(i, 9) * 0.04}
            onPreview={() => setPreviewTpl(tpl)}
            headingStyle={headingStyle}
            accentColor={accentColor}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={() => setExtraLoads(c => c + 1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '13px 28px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500,
              color: '#0f172a', cursor: 'pointer',
              border: '1.5px solid #cbd5e1',
              background: 'white',
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink3)'; e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white' }}
          >
            Load more
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
          No templates in this category
        </div>
      )}

      {previewTpl && (
        <TemplatePreviewModal tpl={previewTpl} headingStyle={headingStyle} accentColor={accentColor} onClose={() => setPreviewTpl(null)} />
      )}
    </section>
  )
}

function TemplateCard({ tpl, delay, onPreview, headingStyle, accentColor }: {
  tpl: TemplateConfig; delay: number; onPreview: () => void
  headingStyle: AccentStyle | null; accentColor: string | null
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fade-in" style={{ transitionDelay: `${delay}s`, minWidth: 0 }}>
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.22s',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
      }}
    >
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 16px 48px rgba(15, 23, 42, 0.30)'
          : '0 2px 12px rgba(15, 23, 42, 0.10)',
        transition: 'box-shadow 0.22s',
      }}>
        <TemplateThumbnail template={tpl} fillWidth accentStyle={headingStyle ?? undefined} color={accentColor ?? undefined} />
        {/* Hover preview button — no overlay tint */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: hovered ? 'auto' : 'none',
        }}>
          <div style={{
            background: 'var(--theme-blue)',
            color: 'white',
            padding: '7px 20px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
          }}>Preview</div>
        </div>


      </div>
    </div>
    </div>
  )
}

function TemplatePreviewModal({ tpl, headingStyle, accentColor, onClose }: {
  tpl: TemplateConfig; headingStyle: AccentStyle | null; accentColor: string | null; onClose: () => void
}) {
  const [size, setSize] = useState({ w: 340, h: 481 })

  useEffect(() => {
    const compute = () => {
      const mobile = window.innerWidth < 768
      const maxW = window.innerWidth * (mobile ? 0.92 : 0.72)
      const maxH = window.innerHeight * (mobile ? 0.86 : 0.94)
      const wFromH = maxH * PAGE_WIDTH / PAGE_HEIGHT
      const w = Math.round(Math.min(maxW, wFromH))
      const h = Math.round(w * PAGE_HEIGHT / PAGE_WIDTH)
      setSize({ w, h })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,16,30,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        {/* Resume preview */}
        <div style={{
          width: size.w, height: size.h,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          borderRadius: '2px',
        }}>
          <TemplateThumbnail template={tpl} width={size.w} accentStyle={headingStyle ?? undefined} color={accentColor ?? undefined} />
        </div>

        {/* Centered "use template" button */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <button
            onClick={() => { window.location.href = buildEditorUrl(tpl.id, headingStyle, accentColor) }}
            style={{
              pointerEvents: 'all',
              background: 'var(--theme-blue)',
              color: '#fff',
              padding: '13px 32px',
              borderRadius: '10px',
              fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            Use template
          </button>
        </div>

        {/* Close button — top-right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -14, right: -14,
            width: 32, height: 32, borderRadius: '50%',
            background: 'white', border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            fontSize: '18px', color: '#0f172a', lineHeight: 1,
            fontFamily: 'var(--font-sans)',
          }}
          aria-label="Close"
        >
          ×
        </button>

      </div>
    </div>
  )
}
