'use client'
import React from 'react'
import { ResumeData, SelectionType, SectionKey, Entry } from './types'
import { TemplateConfig } from './templates-config'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

// ============================================================
// Unified Resume Renderer
// All paper is white. Layout/typography differ by template.
// Used for editor, thumbnail, preview, and print.
// ============================================================

type DragState = { sec: SectionKey; idx: number }
type DropState = { sec: SectionKey; idx: number; half: 'top' | 'bottom' }

interface Props {
  data: ResumeData
  template: TemplateConfig
  color?: string
  interactive?: boolean
  selection?: SelectionType
  onSelect?: (s: SelectionType) => void
  onPhotoUpload?: () => void
  onReorderSection?: (sec: SectionKey, fromIdx: number, toIdx: number) => void
  /** Total page count — sidebar layouts extend background to fill all pages */
  pageCount?: number
  /** Shared across all page instances in PaginatedResume to enable cross-page DnD */
  sharedDragRef?: React.MutableRefObject<DragState | null>
  sharedDropTarget?: DropState | null
  onSharedDropTargetChange?: (dt: DropState | null) => void
  /** Keys like 'summary', 'skills', 'exp:0', 'exp:1', 'project:0' that have AI suggestions */
  aiSuggestionSections?: Set<string>
}

const PAGE_WIDTH = 794   // A4 width @ 96dpi
const PAGE_HEIGHT = 1123 // A4 height @ 96dpi

export default function ResumeRenderer({
  data, template, color, interactive = false, selection, onSelect, onPhotoUpload, onReorderSection, pageCount = 1,
  sharedDragRef, sharedDropTarget, onSharedDropTargetChange, aiSuggestionSections,
}: Props) {

  // Internal fallbacks used when not in a paginated context (thumbnails, print layer, etc.)
  const _internalDragRef = React.useRef<DragState | null>(null)
  const [_internalDropTarget, _setInternalDropTarget] = React.useState<DropState | null>(null)

  // Prefer shared state (provided by PaginatedResume) so drag events cross page boundaries
  const dragRef = sharedDragRef ?? _internalDragRef
  const dropTarget = onSharedDropTargetChange !== undefined ? (sharedDropTarget ?? null) : _internalDropTarget
  const setDropTarget = onSharedDropTargetChange ?? _setInternalDropTarget

  const accent = color || template.accentColor
  const aiSectionSet = aiSuggestionSections ?? new Set<string>()

  const AIChip = () => (
    <div className="no-print" style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 7px',
      background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
      borderRadius: '10px',
      fontSize: '10px', color: 'white', fontWeight: 700,
      flexShrink: 0, whiteSpace: 'nowrap', cursor: 'default',
      lineHeight: 1.4,
    }}>✦ AI建议</div>
  )

  const fontMap = {
    'modern-sans': "Inter, 'Noto Sans SC', sans-serif",
    'serif-heading': "Inter, 'Noto Sans SC', sans-serif",
    'mono-accent': "Inter, 'Noto Sans SC', sans-serif",
  }
  const headingFontMap = {
    'modern-sans': "Inter, 'Noto Sans SC', sans-serif",
    'serif-heading': "'Noto Serif SC', Georgia, serif",
    'mono-accent': "'JetBrains Mono', 'SF Mono', monospace",
  }

  const baseFont = fontMap[template.fontPair]
  const headingFont = headingFontMap[template.fontPair]

  const isSelected = (s: SelectionType) =>
    interactive && selection && JSON.stringify(s) === JSON.stringify(selection)

  const click = (sel: SelectionType) => interactive && onSelect ? (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(sel)
  } : undefined

  const editStyle = (sel: SelectionType): React.CSSProperties => {
    if (!interactive) return {}
    const sel_ = isSelected(sel)
    return {
      cursor: 'pointer',
      // inset box-shadow stays strictly inside the element — no extension outside the border box,
      // so it cannot bleed past page-break clip boundaries (unlike outline + outlineOffset).
      boxShadow: sel_ ? `inset 0 0 0 2px ${accent}` : 'none',
      borderRadius: '3px',
      transition: 'box-shadow 0.1s, background 0.1s',
      background: sel_ ? `${accent}10` : 'transparent',
    }
  }

  // ============ ACCENT TITLE STYLES ============
  const SectionTitle = ({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) => {
    const titleColor = onDark ? '#ffffff' : accent
    const baseProps: React.CSSProperties = {
      fontFamily: headingFont,
      fontSize: '13px',
      fontWeight: 700,
      letterSpacing: template.fontPair === 'serif-heading' ? '0.5px' : '1.5px',
      textTransform: template.fontPair === 'serif-heading' ? 'none' : 'uppercase',
      color: titleColor,
      marginBottom: '5px',
    }

    switch (template.accentStyle) {
      case 'underline-bar':
        return (
          <div style={{ marginBottom: '5px' }}>
            <div style={baseProps}>{children}</div>
            <div style={{ height: '2px', background: titleColor, width: '36px' }} />
          </div>
        )
      case 'left-bar':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '4px', height: '16px', background: titleColor }} />
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
          </div>
        )
      case 'side-icon':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '8px', height: '8px', background: titleColor, borderRadius: '50%' }} />
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
            <div style={{ flex: 1, height: '1px', background: titleColor, opacity: 0.3 }} />
          </div>
        )
      case 'background-pill':
        return (
          <div style={{ textAlign: 'left' }}>
            <div style={{
              display: 'inline-block',
              background: onDark ? 'rgba(255,255,255,0.22)' : titleColor,
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '4px',
              fontFamily: headingFont,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '7px',
            }}>{children}</div>
          </div>
        )
      case 'thin-line':
        return (
          <div style={{ marginBottom: '5px', borderBottom: `1px solid ${titleColor}`, paddingBottom: '4px' }}>
            <div style={{ ...baseProps, marginBottom: 0, fontWeight: 500 }}>{children}</div>
          </div>
        )
      case 'double-line':
        return (
          <div style={{ marginBottom: '5px' }}>
            <div style={{ height: '1px', background: titleColor, marginBottom: '3px' }} />
            <div style={{ ...baseProps, textAlign: 'center', marginBottom: '3px' }}>{children}</div>
            <div style={{ height: '1px', background: titleColor }} />
          </div>
        )
      case 'plain-bold':
      default:
        return <div style={{ ...baseProps, fontSize: '14px' }}>{children}</div>
    }
  }

  // ============ ENTRY ITEM (with bullets) ============
  const EntryItem = ({ entry, sec, idx, onDark = false, isLast = false }: {
    entry: Entry; sec: SectionKey; idx: number; onDark?: boolean; isLast?: boolean
  }) => {
    const titleC = onDark ? '#fff' : '#0f172a'
    const subC = onDark ? 'rgba(255,255,255,0.7)' : '#475569'
    const dateC = onDark ? 'rgba(255,255,255,0.6)' : '#64748b'
    const bodyC = onDark ? 'rgba(255,255,255,0.85)' : '#334155'

    const isDropTop = interactive && dropTarget?.sec === sec && dropTarget.idx === idx && dropTarget.half === 'top'
    const isDropBottom = interactive && dropTarget?.sec === sec && dropTarget.idx === idx && dropTarget.half === 'bottom'

    return (
      <div
        data-entry="1"
        draggable={interactive}
        onClick={click({ kind: 'entry', sec, idx })}
        onDragStart={interactive ? (e) => {
          dragRef.current = { sec, idx }
          e.dataTransfer.effectAllowed = 'move'
          e.stopPropagation()
          const el = e.currentTarget as HTMLElement
          const bcr = el.getBoundingClientRect()
          const visualScale = el.offsetWidth > 0 ? bcr.width / el.offsetWidth : 1
          // Build ghost at canvas zoom level so it matches the visual entry size
          const ghost = document.createElement('div')
          ghost.style.cssText = `position:fixed;top:-9999px;left:0;width:${bcr.width}px;height:${bcr.height}px;overflow:hidden;pointer-events:none;background:white;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.15);`
          const inner = document.createElement('div')
          inner.style.cssText = `transform:scale(${visualScale});transform-origin:top left;width:${el.offsetWidth}px;`
          const clone = el.cloneNode(true) as HTMLElement
          clone.style.marginLeft = '0'  // cancel negative margin so ghost isn't left-clipped
          inner.appendChild(clone)
          ghost.appendChild(inner)
          document.body.appendChild(ghost)
          e.dataTransfer.setDragImage(ghost, e.clientX - bcr.left, e.clientY - bcr.top)
          setTimeout(() => ghost.parentNode?.removeChild(ghost), 0)
          requestAnimationFrame(() => {
            el.style.opacity = '0.4'
            el.style.transition = 'opacity 0.1s'
          })
        } : undefined}
        onDragOver={interactive ? (e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (!dragRef.current || dragRef.current.sec !== sec) return
          const srcIdx = dragRef.current.idx
          if (srcIdx === idx) return  // hovering over self — no indicator
          // Direction-based: dragging up → show target's top indicator; down → bottom
          const half: 'top' | 'bottom' = srcIdx > idx ? 'top' : 'bottom'
          if (dropTarget?.sec !== sec || dropTarget.idx !== idx || dropTarget.half !== half) {
            setDropTarget({ sec, idx, half })
          }
        } : undefined}
        onDragLeave={interactive ? (e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            if (dropTarget?.sec === sec && dropTarget.idx === idx) setDropTarget(null)
          }
        } : undefined}
        onDrop={interactive ? (e) => {
          e.preventDefault()
          const from = dragRef.current
          dragRef.current = null
          setDropTarget(null)
          if (!from || from.sec !== sec) return
          const fromIdx = from.idx
          if (fromIdx === idx) return
          // Direction-based: dragging up inserts before target; down inserts after
          const isDraggingUp = fromIdx > idx
          let toIdx = isDraggingUp ? idx : idx + 1
          if (fromIdx < toIdx) toIdx -= 1
          if (fromIdx !== toIdx) onReorderSection?.(sec, fromIdx, toIdx)
        } : undefined}
        onDragEnd={interactive ? (e) => {
          const el = e.currentTarget as HTMLElement
          el.style.opacity = ''
          el.style.transition = ''
          dragRef.current = null
          setDropTarget(null)
        } : undefined}
        style={{
          ...editStyle({ kind: 'entry', sec, idx }),
          position: 'relative',
          marginBottom: isLast ? 0 : '6px',
          padding: interactive ? '0 6px' : '0',
          marginLeft: interactive ? '-6px' : 0,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}>
        {/* Drop indicator: top edge */}
        {isDropTop && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px', background: accent, borderRadius: '1px', zIndex: 10,
          }} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '2px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: headingFont, fontSize: '14px', fontWeight: 600, color: titleC, lineHeight: 1.3 }}>
              {entry.title}
            </div>
            {entry.sub && (
              <div style={{ fontSize: '12.5px', color: subC, marginTop: '1px' }}>
                {entry.sub}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {interactive && aiSectionSet.has(`${sec}:${idx}`) && <AIChip />}
            {entry.date && (
              <div style={{ fontSize: '11.5px', color: dateC, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {entry.date}
              </div>
            )}
          </div>
        </div>
        {/* Bullets */}
        {entry.bullets && entry.bullets.length > 0 && (
          <ul style={{
            listStyle: 'none',
            margin: '3px 0 0',
            padding: 0,
          }}>
            {entry.bullets.filter(b => b.trim()).map((b, i) => (
              <li key={i} style={{
                fontSize: '12px',
                color: bodyC,
                lineHeight: 1.55,
                paddingLeft: '14px',
                position: 'relative',
                marginBottom: '1px',
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0, top: '8px',
                  width: '4px', height: '4px',
                  borderRadius: '50%',
                  background: onDark ? 'rgba(255,255,255,0.6)' : accent,
                }} />
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Drop indicator: bottom edge */}
        {isDropBottom && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '2px', background: accent, borderRadius: '1px', zIndex: 10,
          }} />
        )}
      </div>
    )
  }

  // ============ SECTION ============
  // ============ LANGUAGE — horizontal wrapping pills ============
  const LanguageSection = ({ onDark = false }: { onDark?: boolean }) => {
    if (!data.hasLanguage || data.language.length === 0) return null
    const textC = onDark ? 'rgba(255,255,255,0.85)' : '#334155'
    const pillBg = onDark ? 'rgba(255,255,255,0.12)' : `${accent}12`
    const pillBorder = onDark ? 'rgba(255,255,255,0.22)' : `${accent}35`
    return (
      <div data-section-start="1" style={{ marginBottom: '10px' }}>
        <SectionTitle onDark={onDark}>语言能力</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {data.language.map((entry, idx) => {
            const sel = isSelected({ kind: 'entry', sec: 'language', idx })
            return (
              <div
                key={entry.id}
                data-entry="1"
                onClick={click({ kind: 'entry', sec: 'language', idx })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px',
                  background: sel ? `${accent}20` : pillBg,
                  border: `1.5px solid ${sel ? accent : pillBorder}`,
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: textC,
                  cursor: interactive ? 'pointer' : 'default',
                  transition: 'border-color 0.1s, background 0.1s, box-shadow 0.1s',
                  boxShadow: sel ? `inset 0 0 0 1.5px ${accent}` : 'none',
                }}
              >
                <span style={{ fontWeight: 600 }}>{entry.title || '语言'}</span>
                {entry.sub && (
                  <>
                    <span style={{ opacity: 0.35 }}>·</span>
                    <span style={{ opacity: 0.75 }}>{entry.sub}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const Section = ({ sec, label, items, onDark = false }: {
    sec: SectionKey; label: string; items: Entry[]; onDark?: boolean
  }) => {
    if (!items || items.length === 0) return null
    const hasSectionAI = interactive && items.some((_, idx) => aiSectionSet.has(`${sec}:${idx}`))
    return (
      <div style={{ marginBottom: '10px' }}>
        <div data-section-start="1" style={hasSectionAI ? { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' } : undefined}>
          <div style={hasSectionAI ? { flex: 1 } : undefined}>
            <SectionTitle onDark={onDark}>{label}</SectionTitle>
          </div>
        </div>
        {items.map((entry, idx) => (
          <EntryItem key={entry.id} entry={entry} sec={sec} idx={idx} onDark={onDark} isLast={idx === items.length - 1} />
        ))}
      </div>
    )
  }

  // ============ SUMMARY ============
  const SummaryBlock = ({ onDark = false }: { onDark?: boolean }) => {
    if (!data.hasSummary) return null
    const c = onDark ? 'rgba(255,255,255,0.85)' : '#334155'
    return (
      <div data-section-start="1" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}><SectionTitle onDark={onDark}>个人简介</SectionTitle></div>
          {interactive && aiSectionSet.has('summary') && <AIChip />}
        </div>
        <p onClick={click({ kind: 'field', field: 'summary' })}
          style={{
            ...editStyle({ kind: 'field', field: 'summary' }),
            fontSize: '12.5px',
            color: c,
            lineHeight: 1.7,
            padding: interactive ? '6px' : 0,
            margin: interactive ? '-6px' : 0,
          }}>{data.summary}</p>
      </div>
    )
  }

  // ============ SKILLS ============
  const SkillsBlock = ({ onDark = false, asPills = true }: { onDark?: boolean; asPills?: boolean }) => {
    if (!data.hasSkills || data.skills.length === 0) return null

    if (asPills) {
      return (
        <div data-section-start="1" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1 }}><SectionTitle onDark={onDark}>专业技能</SectionTitle></div>
            {interactive && aiSectionSet.has('skills') && <AIChip />}
          </div>
          <div onClick={click({ kind: 'skills' })}
            style={{
              ...editStyle({ kind: 'skills' }),
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              padding: interactive ? '4px' : 0,
            }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11.5px', lineHeight: 1,
                fontWeight: 500,
                background: onDark ? 'rgba(255,255,255,0.15)' : `${accent}12`,
                color: onDark ? '#fff' : accent,
                border: onDark ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${accent}30`,
              }}>{s}</span>
            ))}
          </div>
        </div>
      )
    }

    return (
      // Outer wrapper has no interactive padding so SectionTitle stays flush with ContactInline above it
      <div data-section-start="1" style={{ marginBottom: '10px' }}>
        <SectionTitle onDark>专业技能</SectionTitle>
        <div onClick={click({ kind: 'skills' })}
          style={{ ...editStyle({ kind: 'skills' }), padding: interactive ? '4px' : 0, margin: interactive ? '-4px' : 0 }}>
          {data.skills.map((s, i) => (
            <div key={i} style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '4px', height: '4px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                flexShrink: 0,
              }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ============ CONTACT BAR ============
  const ContactInline = ({ onDark = false, vertical = false }: { onDark?: boolean; vertical?: boolean }) => {
    const c = onDark ? 'rgba(255,255,255,0.85)' : '#475569'
    const toWebHref = (url: string) =>
      /^https?:\/\//i.test(url) ? url : `https://${url}`
    const items = [
      (!data.hideEmail && data.email) && { icon: <Mail size={10} color={c} strokeWidth={2} />, text: data.email, href: `mailto:${data.email}` },
      (!data.hidePhone && data.phone) && { icon: <Phone size={10} color={c} strokeWidth={2} />, text: data.phone, href: `tel:${data.phone.replace(/[\s()\-]/g, '')}` },
      (!data.hideCity && data.city) && { icon: <MapPin size={10} color={c} strokeWidth={2} />, text: data.city },
      (!data.hideWebsite && data.website) && { icon: <ExternalLink size={10} color={c} strokeWidth={2} />, text: data.website, href: toWebHref(data.website) },
      ...(data.extraWebsites || []).filter(Boolean).map(w => ({ icon: <ExternalLink size={10} color={c} strokeWidth={2} />, text: w, href: toWebHref(w) })),
    ].filter(Boolean) as { icon: React.ReactNode; text: string; href?: string }[]

    return (
      <div onClick={click({ kind: 'contact' })}
        style={{
          ...editStyle({ kind: 'contact' }),
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          flexWrap: vertical ? 'nowrap' : 'wrap',
          gap: vertical ? '6px' : '6px 18px',
          fontSize: '11.5px',
          color: c,
          padding: interactive ? '4px' : 0,
          margin: interactive ? '-4px' : 0,
        }}>
        {items.map((it, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
            <span style={{ opacity: 0.85 }}>{it.icon}</span>
            {it.href ? (
              <a
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                // In the editor, prevent navigation — let the click bubble to the contact selector
                onClick={interactive ? (e) => e.preventDefault() : undefined}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {it.text}
              </a>
            ) : it.text}
          </span>
        ))}
      </div>
    )
  }

  // ============ PHOTO ============
  const PhotoBlock = ({ size = 90, onDark = false }: { size?: number; onDark?: boolean }) => {
    const meta = data.photoMeta

    // Compute rendered image dimensions preserving natural aspect ratio.
    // Without natW/natH (legacy photos), fall back to object-fit: cover on a square.
    let imgW = size, imgH = size, imgLeft = 0, imgTop = 0, hasMeta = false
    if (meta && meta.natW && meta.natH) {
      hasMeta = true
      const coverScale = Math.max(size / meta.natW, size / meta.natH)
      imgW = meta.natW * coverScale * meta.scale
      imgH = meta.natH * coverScale * meta.scale
      imgLeft = (size - imgW) / 2 + meta.x * size
      imgTop  = (size - imgH) / 2 + meta.y * size
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (interactive && onPhotoUpload) onPhotoUpload()
    }
    return (
      <div onClick={interactive ? handleClick : undefined}
        className={interactive ? 'resume-photo-circle' : undefined}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          background: data.photo ? 'transparent' : (onDark ? 'rgba(255,255,255,0.15)' : `${accent}15`),
          border: `2px solid ${onDark ? 'rgba(255,255,255,0.3)' : accent + '30'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, color: onDark ? 'rgba(255,255,255,0.7)' : accent,
          flexShrink: 0,
          overflow: 'hidden',
          cursor: interactive ? 'pointer' : 'default',
          position: 'relative',
        }}>
        {data.photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt=""
              style={hasMeta ? {
                position: 'absolute',
                width: `${imgW}px`, height: `${imgH}px`,
                left: `${imgLeft}px`, top: `${imgTop}px`,
                pointerEvents: 'none', userSelect: 'none',
              } : {
                width: '100%', height: '100%', objectFit: 'cover',
              }}
            />
          </>
        ) : '👤'}
        {interactive && !data.photo && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: '9px', textAlign: 'center', padding: '2px',
          }}>上传</div>
        )}
      </div>
    )
  }

  // ============ NAME / JOB TITLE ============
  const NameBlock = ({ onDark = false, centered = false, big = true }: { onDark?: boolean; centered?: boolean; big?: boolean }) => (
    <div onClick={click({ kind: 'field', field: 'name' })}
      style={{
        ...editStyle({ kind: 'field', field: 'name' }),
        padding: interactive ? '4px' : 0,
        margin: interactive ? '-4px' : 0,
        textAlign: centered ? 'center' : 'left',
        display: centered ? 'block' : 'inline-block',
      }}>
      <div style={{
        fontFamily: headingFont,
        fontSize: big ? '32px' : '22px',
        fontWeight: 700,
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
        color: onDark ? '#fff' : '#0f172a',
      }}>{data.name}</div>
      {data.jobtitle && (
        <div style={{
          fontFamily: baseFont,
          fontSize: big ? '14px' : '12px',
          fontWeight: 400,
          color: onDark ? 'rgba(255,255,255,0.75)' : '#475569',
          marginTop: '4px',
        }}>{data.jobtitle}</div>
      )}
    </div>
  )

  // ============ MAIN BODY (sections in order) ============
  const MainBody = ({ onDark = false }: { onDark?: boolean }) => (
    <>
      <SummaryBlock onDark={onDark} />
      <Section sec="exp" label="工作经历" items={data.exp} onDark={onDark} />
      {data.hasProject && <Section sec="project" label="项目经历" items={data.project} onDark={onDark} />}
      <Section sec="edu" label="教育背景" items={data.edu} onDark={onDark} />
      {data.hasLanguage && <LanguageSection onDark={onDark} />}
      {data.hasAward && <Section sec="award" label="荣誉奖项" items={data.award} onDark={onDark} />}
      {data.hasCert && <Section sec="cert" label="资质证书" items={data.cert} onDark={onDark} />}
      {data.hasVolunteer && <Section sec="volunteer" label="志愿服务" items={data.volunteer} onDark={onDark} />}
      {data.hasInterest && <Section sec="interest" label="兴趣爱好" items={data.interest} onDark={onDark} />}
    </>
  )

  // ============ ROOT ============
  // All papers white
  const rootStyle: React.CSSProperties = {
    width: `${PAGE_WIDTH}px`,
    minHeight: `${PAGE_HEIGHT}px`,
    background: '#ffffff',
    fontFamily: baseFont,
    color: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  }

  // ============ LAYOUT: SIDEBAR LEFT WIDE (深色侧栏) ============
  if (template.layout === 'sidebar-left-wide') {
    return (
      <div style={rootStyle}>
        <div style={{ display: 'flex', minHeight: `${pageCount * PAGE_HEIGHT}px` }}>
          {/* Dark sidebar */}
          <div style={{
            width: '252px',
            background: accent,
            padding: '36px 24px',
            flexShrink: 0,
            color: '#fff',
          }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <PhotoBlock size={100} onDark />
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <NameBlock onDark centered big={false} />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <SectionTitle onDark>联系方式</SectionTitle>
              <ContactInline onDark vertical />
            </div>

            <SkillsBlock onDark asPills={false} />
          </div>

          {/* Main */}
          <div style={{ flex: 1, padding: '40px 36px' }}>
            <MainBody />
          </div>
        </div>
      </div>
    )
  }

  // ============ LAYOUT: SIDEBAR LEFT NARROW (淡色侧栏) ============
  if (template.layout === 'sidebar-left-narrow') {
    return (
      <div style={rootStyle}>
        <div style={{ display: 'flex', minHeight: `${pageCount * PAGE_HEIGHT}px` }}>
          {/* Light sidebar with thin border */}
          <div style={{
            width: '210px',
            background: `${accent}08`,
            borderRight: `2px solid ${accent}`,
            padding: '36px 22px',
            flexShrink: 0,
          }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <PhotoBlock size={88} />
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <NameBlock centered big={false} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <SectionTitle>联系方式</SectionTitle>
              <ContactInline vertical />
            </div>
            <SkillsBlock />
          </div>
          <div style={{ flex: 1, padding: '40px 36px' }}>
            <MainBody />
          </div>
        </div>
      </div>
    )
  }

  // ============ LAYOUT: SIDEBAR RIGHT ============
  if (template.layout === 'sidebar-right') {
    return (
      <div style={rootStyle}>
        <div style={{ display: 'flex', minHeight: `${pageCount * PAGE_HEIGHT}px` }}>
          <div style={{ flex: 1, padding: '40px 36px' }}>
            <NameBlock big />
            <div style={{ height: '12px' }} />
            <ContactInline />
            <div style={{ height: '24px' }} />
            <MainBody />
          </div>
          <div style={{
            width: '210px',
            background: `${accent}08`,
            borderLeft: `2px solid ${accent}`,
            padding: '40px 22px',
            flexShrink: 0,
          }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <PhotoBlock size={88} />
              </div>
            )}
            <SkillsBlock />
          </div>
        </div>
      </div>
    )
  }

  // ============ LAYOUT: TOP BANNER WITH PHOTO ============
  if (template.layout === 'top-banner-photo') {
    return (
      <div style={rootStyle}>
        <div style={{
          background: accent,
          padding: '36px 48px',
          display: 'flex', alignItems: 'center', gap: '24px',
        }}>
          {template.showPhoto && <PhotoBlock size={96} onDark />}
          <div style={{ flex: 1 }}>
            <NameBlock onDark big />
            <div style={{ height: '10px' }} />
            <ContactInline onDark />
          </div>
        </div>
        <div style={{ padding: '32px 48px' }}>
          <MainBody />
          <SkillsBlock />
        </div>
      </div>
    )
  }

  // ============ LAYOUT: HEADER CARD ============
  if (template.layout === 'header-card') {
    return (
      <div style={rootStyle}>
        <div style={{ padding: '36px 48px 0' }}>
          <div style={{
            background: '#f8fafc',
            border: `2px solid ${accent}`,
            borderRadius: '8px',
            padding: '24px',
            display: 'flex', alignItems: 'center', gap: '20px',
          }}>
            {template.showPhoto && <PhotoBlock size={84} />}
            <div style={{ flex: 1 }}>
              <NameBlock big />
              <div style={{ height: '8px' }} />
              <ContactInline />
            </div>
          </div>
        </div>
        <div style={{ padding: '28px 48px 40px' }}>
          <MainBody />
          <SkillsBlock />
        </div>
      </div>
    )
  }

  // ============ LAYOUT: TWO COLUMN BALANCE ============
  if (template.layout === 'two-column-balance') {
    return (
      <div style={rootStyle}>
        {/* Header full-width */}
        <div style={{ padding: '36px 48px 24px', borderBottom: `1px solid ${accent}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {template.showPhoto && <PhotoBlock size={80} />}
            <div style={{ flex: 1 }}>
              <NameBlock big />
              <div style={{ height: '8px' }} />
              <ContactInline />
            </div>
          </div>
        </div>
        {/* Two columns */}
        <div style={{ display: 'flex', padding: '28px 48px 40px', gap: '32px' }}>
          <div style={{ flex: 2 }}>
            <SummaryBlock />
            <Section sec="exp" label="工作经历" items={data.exp} />
            {data.hasProject && <Section sec="project" label="项目经历" items={data.project} />}
            {data.hasVolunteer && <Section sec="volunteer" label="志愿服务" items={data.volunteer} />}
            {data.hasInterest && <Section sec="interest" label="兴趣爱好" items={data.interest} />}
          </div>
          <div style={{ flex: 1 }}>
            <Section sec="edu" label="教育背景" items={data.edu} />
            <SkillsBlock />
            {data.hasLanguage && <LanguageSection />}
            {data.hasAward && <Section sec="award" label="荣誉奖项" items={data.award} />}
            {data.hasCert && <Section sec="cert" label="资质证书" items={data.cert} />}
          </div>
        </div>
      </div>
    )
  }

  // ============ LAYOUT: SINGLE CENTERED ============
  if (template.layout === 'single-centered') {
    return (
      <div style={rootStyle}>
        <div style={{ padding: '40px 48px 28px', textAlign: 'center' }}>
          {template.showPhoto && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <PhotoBlock size={90} />
            </div>
          )}
          <NameBlock centered big />
          <div style={{ height: '10px' }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ContactInline />
          </div>
        </div>
        <div style={{ padding: '4px 48px 40px' }}>
          <MainBody />
          <SkillsBlock />
        </div>
      </div>
    )
  }

  // ============ LAYOUT: SINGLE CLASSIC (default) ============
  return (
    <div style={rootStyle}>
      <div style={{ padding: '40px 48px 24px' }}>
        {template.showPhoto ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <PhotoBlock size={88} />
            <div style={{ flex: 1 }}>
              <NameBlock big />
              <div style={{ height: '10px' }} />
              <ContactInline />
            </div>
          </div>
        ) : (
          <>
            <NameBlock big />
            <div style={{ height: '10px' }} />
            <ContactInline />
          </>
        )}
        <div style={{ height: '2px', background: accent, marginTop: '20px' }} />
      </div>
      <div style={{ padding: '8px 48px 40px' }}>
        <MainBody />
        <SkillsBlock />
      </div>
    </div>
  )
}
