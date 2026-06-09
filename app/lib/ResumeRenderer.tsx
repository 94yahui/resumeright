'use client'
import React from 'react'
import { ResumeData, SelectionType, SectionKey, Entry, hasDiffMarkup, parseDiffBullet } from './types'
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
  /** Diff-markup bullets keyed by "sectionKey:entryIndex" — replaces entry bullets with inline diff view before user applies */
  bulletDiffs?: Record<string, string[]>
  /** Skills checked in the AI panel but not yet applied — shown in --highlight color in real-time */
  pendingSkills?: string[]
  /** Override language for section titles — takes precedence over data.resumeLang */
  isEnglish?: boolean
}

const PAGE_WIDTH = 794   // A4 width @ 96dpi
const PAGE_HEIGHT = 1123 // A4 height @ 96dpi

export default function ResumeRenderer({
  data, template, color, interactive = false, selection, onSelect, onPhotoUpload, onReorderSection, pageCount = 1,
  sharedDragRef, sharedDropTarget, onSharedDropTargetChange, aiSuggestionSections, bulletDiffs, pendingSkills, isEnglish,
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

  const EN: Record<string, string> = {
    exp: 'Work Experience', edu: 'Education', project: 'Projects',
    award: 'Awards & Honors', cert: 'Certifications', volunteer: 'Volunteering',
    interest: 'Interests', language: 'Languages',
    summary: 'Professional Summary', skills: 'Skills', contact: 'Contact',
  }
  const ZH: Record<string, string> = {
    exp: '工作经历', edu: '教育背景', project: '项目经历',
    award: '荣誉奖项', cert: '资质证书', volunteer: '志愿服务',
    interest: '兴趣爱好', language: '语言能力',
    summary: '个人简介', skills: '专业技能', contact: '联系方式',
  }
  const T = (k: string): string => data.sectionLabels?.[k] ?? ((isEnglish ?? data.resumeLang === 'en') ? EN : ZH)[k] ?? k

  // Scale font sizes and vertical spacings only — structural dimensions (widths, sidebar fills) are untouched
  const sc = data.fontScale ?? 1
  const s = (x: number): string => sc === 1 ? `${x}px` : `${+(x * sc).toFixed(1)}px`

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
      fontSize: s(13),
      fontWeight: 700,
      letterSpacing: template.fontPair === 'serif-heading' ? '0.5px' : '1.5px',
      textTransform: template.fontPair === 'serif-heading' ? 'none' : 'uppercase',
      color: titleColor,
      marginBottom: s(5),
    }

    switch (template.accentStyle) {
      case 'underline-bar':
        return (
          <div style={{ marginBottom: s(5) }}>
            <div style={baseProps}>{children}</div>
            <div style={{ height: '2px', background: titleColor, width: '36px' }} />
          </div>
        )
      case 'left-bar':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: s(5) }}>
            <div style={{ width: '4px', height: '16px', background: titleColor }} />
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
          </div>
        )
      case 'side-icon':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: s(5) }}>
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
              fontSize: s(12),
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: s(7),
            }}>{children}</div>
          </div>
        )
      case 'thin-line':
        return (
          <div style={{ marginBottom: s(5), borderBottom: `1px solid ${titleColor}`, paddingBottom: '4px' }}>
            <div style={{ ...baseProps, marginBottom: 0, fontWeight: 500 }}>{children}</div>
          </div>
        )
      case 'double-line':
        return (
          <div style={{ marginBottom: s(5) }}>
            <div style={{ height: '1px', background: titleColor, marginBottom: '3px' }} />
            <div style={{ ...baseProps, textAlign: 'center', marginBottom: '3px' }}>{children}</div>
            <div style={{ height: '1px', background: titleColor }} />
          </div>
        )
      case 'triple-bar':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: s(5) }}>
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
              <div style={{ width: '6px', height: '13px', background: titleColor, opacity: 1 }} />
              <div style={{ width: '4px', height: '13px', background: titleColor, opacity: 0.6 }} />
              <div style={{ width: '2px', height: '13px', background: titleColor, opacity: 0.35 }} />
            </div>
          </div>
        )
      case 'gradient-band':
        return (
          <div style={{
            marginBottom: s(7),
            marginLeft: '-8px',
            marginRight: '-8px',
            padding: '5px 8px',
            background: onDark
              ? 'linear-gradient(to right, rgba(255,255,255,0.22), rgba(255,255,255,0))'
              : `linear-gradient(to right, ${titleColor}22, transparent)`,
            borderLeft: `3px solid ${titleColor}`,
          }}>
            <div style={{ ...baseProps, marginBottom: 0, color: onDark ? '#fff' : titleColor }}>{children}</div>
          </div>
        )
      case 'flanked-line':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: s(6), marginBottom: s(5) }}>
            <div style={{ flex: 1, height: '1px', background: titleColor, opacity: 0.6 }} />
            <div style={{ ...baseProps, marginBottom: 0, whiteSpace: 'nowrap' }}>{children}</div>
            <div style={{ flex: 1, height: '1px', background: titleColor, opacity: 0.6 }} />
          </div>
        )
      case 'slash-prefix':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: s(5), marginBottom: s(5) }}>
            <span style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: s(13),
              color: titleColor,
              opacity: 0.45,
              flexShrink: 0,
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}>//</span>
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
          </div>
        )
      case 'highlight-mark':
        return (
          <div style={{ marginBottom: s(5) }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <div style={{ ...baseProps, marginBottom: 0, position: 'relative', zIndex: 1 }}>{children}</div>
              <div style={{
                position: 'absolute',
                bottom: '-1px', left: '-3px', right: '-3px',
                height: '42%',
                background: onDark ? 'rgba(255,255,255,0.28)' : `${titleColor}38`,
                zIndex: 0,
                borderRadius: '1px',
              }} />
            </div>
          </div>
        )
      case 'plain-bold':
      default:
        return <div style={{ ...baseProps, fontSize: s(14) }}>{children}</div>
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
          marginBottom: isLast ? 0 : s(6),
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
            <div style={{ fontFamily: headingFont, fontSize: s(14), fontWeight: 600, color: titleC, lineHeight: 1.3 }}>
              {entry.title}
            </div>
            {entry.sub && (
              <div style={{ fontSize: s(12.5), color: subC, marginTop: '1px' }}>
                {entry.sub}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {interactive && aiSectionSet.has(`${sec}:${idx}`) && <AIChip />}
            {entry.date && (
              <div style={{ fontSize: s(11.5), color: dateC, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {entry.date}
              </div>
            )}
          </div>
        </div>
        {/* Bullets */}
        {(() => {
          // Use diff bullets (from pending AI suggestion) when available, otherwise entry.bullets
          const diffBullets = bulletDiffs?.[`${sec}:${idx}`]
          const bulletsToRender = (diffBullets ?? entry.bullets ?? []).filter(b => {
            // In diff mode: exclude bullets that are pure deletion (whole bullet is [[~...~]])
            // so they don't take up space — they're shown via strikethrough inline
            // But we still need to render them so the strikethrough is visible
            return b.trim().length > 0
          })
          if (bulletsToRender.length === 0) return null
          return (
            <ul style={{ listStyle: 'none', margin: '3px 0 0', padding: 0 }}>
              {bulletsToRender.map((b, i) => {
                const hasDiff = hasDiffMarkup(b)
                // Pure-deletion bullet: [[~entire text~]] — render faded with strikethrough, no bullet dot
                const isPureDeletion = hasDiff && /^\[\[~.*~\]\]$/.test(b.trim())
                const segments = hasDiff ? parseDiffBullet(b) : null
                return (
                  <li key={i} style={{ fontSize: s(12), lineHeight: 1.55, paddingLeft: s(14), position: 'relative', marginBottom: '1px', color: bodyC }}>
                    {!isPureDeletion && (
                      <span style={{ position: 'absolute', left: 0, top: s(8), width: s(4), height: s(4), borderRadius: '50%', background: onDark ? 'rgba(255,255,255,0.6)' : (hasDiff ? 'var(--ai-highlight)' : '#9ca3af') }} />
                    )}
                    {segments ? (
                      segments.map((seg, si) => (
                        <span key={si} style={{
                          color: seg.type === 'add' ? 'var(--ai-highlight)' : seg.type === 'del' ? (onDark ? 'rgba(255,255,255,0.35)' : '#94a3b8') : bodyC,
                          textDecoration: seg.type === 'del' ? 'line-through' : 'none',
                        }}>{seg.text}</span>
                      ))
                    ) : b}
                  </li>
                )
              })}
            </ul>
          )
        })()}

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
    const langStyle = data.languageStyle ?? 'pills'
    const textC = onDark ? 'rgba(255,255,255,0.85)' : '#334155'
    const pillBg = onDark ? 'rgba(255,255,255,0.12)' : `${accent}12`
    const pillBorder = onDark ? 'rgba(255,255,255,0.22)' : `${accent}35`

    const renderPills = () => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {data.language.map((entry, idx) => {
          const sel = isSelected({ kind: 'entry', sec: 'language', idx })
          return (
            <div key={entry.id} data-entry="1"
              onClick={click({ kind: 'entry', sec: 'language', idx })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 12px',
                background: sel ? `${accent}20` : pillBg,
                border: `1.5px solid ${sel ? accent : pillBorder}`,
                borderRadius: '20px', fontSize: s(12), color: textC,
                cursor: interactive ? 'pointer' : 'default',
                transition: 'border-color 0.1s, background 0.1s, box-shadow 0.1s',
                boxShadow: sel ? `inset 0 0 0 1.5px ${accent}` : 'none',
              }}>
              <span style={{ fontWeight: 600 }}>{entry.title || '语言'}</span>
              {entry.sub && (
                <><span style={{ opacity: 0.35 }}>·</span><span style={{ opacity: 0.75 }}>{entry.sub}</span></>
              )}
            </div>
          )
        })}
      </div>
    )

    const renderPlain = () => (
      <p style={{ fontSize: s(12), color: textC, lineHeight: 1.7, margin: 0 }}>
        {data.language.map((entry, idx) => {
          const sel = isSelected({ kind: 'entry', sec: 'language', idx })
          return (
            <span key={entry.id} data-entry="1"
              onClick={click({ kind: 'entry', sec: 'language', idx })}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                background: sel ? `${accent}18` : 'transparent',
                borderRadius: '3px', padding: sel ? '0 2px' : 0,
              }}>
              {idx > 0 && <span style={{ color: textC, opacity: 0.35, margin: '0 6px' }}>·</span>}
              <span style={{ fontWeight: 600 }}>{entry.title || '语言'}</span>
              {entry.sub && <span style={{ opacity: 0.65 }}> {entry.sub}</span>}
            </span>
          )
        })}
      </p>
    )

    const renderList = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: s(4) }}>
        {data.language.map((entry, idx) => {
          const sel = isSelected({ kind: 'entry', sec: 'language', idx })
          return (
            <div key={entry.id} data-entry="1"
              onClick={click({ kind: 'entry', sec: 'language', idx })}
              style={{
                display: 'flex', alignItems: 'baseline', gap: s(8),
                cursor: interactive ? 'pointer' : 'default',
                background: sel ? `${accent}10` : 'transparent',
                borderRadius: '4px', padding: sel ? '2px 4px' : '0',
                margin: sel ? '-2px -4px' : '0',
              }}>
              <span style={{ fontSize: s(12.5), fontWeight: 600, color: onDark ? 'rgba(255,255,255,0.9)' : '#0f172a', minWidth: s(48) }}>{entry.title || '语言'}</span>
              {entry.sub && <span style={{ fontSize: s(11.5), color: textC, opacity: 0.75 }}>{entry.sub}</span>}
            </div>
          )
        })}
      </div>
    )

    return (
      <div data-section-start="1" style={{ marginBottom: s(10) }}>
        <SectionTitle onDark={onDark}>{T('language')}</SectionTitle>
        {langStyle === 'pills' && renderPills()}
        {langStyle === 'plain' && renderPlain()}
        {langStyle === 'list' && renderList()}
      </div>
    )
  }

  const Section = ({ sec, label, items, onDark = false }: {
    sec: SectionKey; label: string; items: Entry[]; onDark?: boolean
  }) => {
    if (!items || items.length === 0) return null
    const hasSectionAI = interactive && items.some((_, idx) => aiSectionSet.has(`${sec}:${idx}`))
    return (
      <div style={{ marginBottom: s(10) }}>
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
      <div data-section-start="1" style={{ marginBottom: s(10) }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}><SectionTitle onDark={onDark}>{T('summary')}</SectionTitle></div>
          {interactive && aiSectionSet.has('summary') && <AIChip />}
        </div>
        <p onClick={click({ kind: 'field', field: 'summary' })}
          style={{
            ...editStyle({ kind: 'field', field: 'summary' }),
            fontSize: s(12.5),
            color: c,
            lineHeight: 1.7,
            padding: interactive ? '6px' : 0,
            margin: interactive ? '-6px' : 0,
          }}>{data.summary}</p>
      </div>
    )
  }

  // ============ SKILLS ============
  const SkillsBlock = ({ onDark = false }: { onDark?: boolean }) => {
    const hasPending = !!pendingSkills && pendingSkills.length > 0
    const hasCategories = (data.skillCategories?.length ?? 0) > 0
    const hasItems = hasCategories
      ? data.skillCategories!.some(c => c.items.length > 0)
      : data.skills.length > 0
    if (!data.hasSkills && !hasPending) return null
    if (!hasItems && !hasPending) return null

    const skillStyle = data.skillsStyle ?? 'tags'
    const textColor = onDark ? 'rgba(255,255,255,0.9)' : '#374151'
    const sepColor = onDark ? 'rgba(255,255,255,0.35)' : '#9ca3af'

    const renderTag = (sk: string, i: number, isPending = false) => (
      <span key={i} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px 12px', borderRadius: '4px',
        fontSize: s(11.5), lineHeight: 1, fontWeight: 500,
        background: isPending ? 'var(--ai-highlight)' : onDark ? 'rgba(255,255,255,0.15)' : `${accent}12`,
        color: isPending ? '#fff' : onDark ? '#fff' : accent,
        border: isPending ? '1px solid var(--ai-highlight)' : onDark ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${accent}30`,
      }}>{sk}</span>
    )

    const renderDot = (sk: string, i: number, isPending = false) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: s(11.5), color: textColor }}>
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: isPending ? 'var(--ai-highlight)' : onDark ? 'rgba(255,255,255,0.6)' : accent, flexShrink: 0 }} />
        {isPending
          ? <span style={{ background: 'var(--ai-highlight)', color: '#fff', fontWeight: 600, borderRadius: '3px', padding: '1px 6px' }}>{sk}</span>
          : sk}
      </span>
    )

    // plain: merge normal items into one text node to allow natural line-wrap
    const renderPlainText = (items: string[], pending: string[] = []) => {
      const normalText = items.join(', ')
      return (
        <span style={{ fontSize: s(11.5), color: textColor, lineHeight: 1.6 }}>
          {normalText}
          {pending.map((sk, i) => (
            <span key={i}>
              {(normalText.length > 0 || i > 0) && ', '}
              <span style={{ background: 'var(--ai-highlight)', color: '#fff', fontWeight: 600, borderRadius: '3px', padding: '1px 6px' }}>{sk}</span>
            </span>
          ))}
        </span>
      )
    }

    const renderItems = (items: string[], extraPending: string[] = []) => {
      if (skillStyle === 'plain') return renderPlainText(items, extraPending)
      const all = [
        ...items.map(sk => ({ sk, isPending: false })),
        ...extraPending.map(sk => ({ sk, isPending: true })),
      ]
      return all.map(({ sk, isPending }, i) =>
        skillStyle === 'tags' ? renderTag(sk, i, isPending) : renderDot(sk, i, isPending)
      )
    }

    const containerStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
      ...editStyle({ kind: 'skills' }),
      padding: interactive ? '4px' : 0,
      margin: interactive ? '-4px' : 0,
      ...(skillStyle === 'plain'
        ? { display: 'block', overflowWrap: 'break-word' as const }
        : { display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }),
      ...extra,
    })

    const header = (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1 }}><SectionTitle onDark={onDark}>{T('skills')}</SectionTitle></div>
        {interactive && aiSectionSet.has('skills') && <AIChip />}
      </div>
    )

    if (hasCategories) {
      return (
        <div data-section-start="1" style={{ marginBottom: s(10) }}>
          {header}
          <div onClick={click({ kind: 'skills' })} style={{ ...editStyle({ kind: 'skills' }), padding: interactive ? '4px' : 0, margin: interactive ? '-4px' : 0 }}>
            {data.skillCategories!.map(cat => cat.items.length === 0 ? null : (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'flex-start', gap: s(1), marginBottom: skillStyle === 'plain' ? s(2) : s(4) }}>
                <span style={{
                  fontSize: s(11.5), fontWeight: 600, flexShrink: 0,
                  color: onDark ? 'rgba(255,255,255,0.85)' : '#0f172a',
                  lineHeight: skillStyle === 'tags' ? '23px' : 1.6,
                }}>{cat.name}：</span>
                {skillStyle === 'plain' ? (
                  // plain: block so wrapped lines stay under the items, not the label
                  <div style={{ flex: 1, overflowWrap: 'break-word', fontSize: s(11.5), lineHeight: 1.6, color: textColor }}>
                    {cat.items.join(', ')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                    {renderItems(cat.items)}
                  </div>
                )}
              </div>
            ))}
            {hasPending && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(1), marginBottom: skillStyle === 'plain' ? s(2) : s(4) }}>
                <span style={{
                  fontSize: s(11.5), fontWeight: 600, flexShrink: 0,
                  color: onDark ? 'rgba(255,255,255,0.85)' : '#0f172a',
                  lineHeight: skillStyle === 'tags' ? '23px' : 1.6,
                }}>新增技能：</span>
                {skillStyle === 'plain' ? (
                  <div style={{ flex: 1, overflowWrap: 'break-word', fontSize: s(11.5), lineHeight: 1.6 }}>
                    {renderPlainText([], pendingSkills!)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                    {pendingSkills!.map((sk, i) =>
                      skillStyle === 'tags' ? renderTag(sk, i, true) : renderDot(sk, i, true)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div data-section-start="1" style={{ marginBottom: s(10) }}>
        {header}
        <div onClick={click({ kind: 'skills' })} style={containerStyle()}>
          {renderItems(data.skills, pendingSkills ?? [])}
        </div>
      </div>
    )
  }

  // ============ CONTACT BAR ============
  const ContactInline = ({ onDark = false, vertical = false }: { onDark?: boolean; vertical?: boolean }) => {
    const c = onDark ? 'rgba(255,255,255,0.85)' : '#475569'
    const toWebHref = (url: string) =>
      /^https?:\/\//i.test(url) ? url : `https://${url}`
    const makeCustomItem = (ci: { label: string; value: string }) => {
      const isUrl = /^https?:\/\//i.test(ci.value)
      return {
        icon: <span style={{ display: 'inline-block', width: '3px', height: '10px', borderRadius: '1.5px', background: c, flexShrink: 0, opacity: 0.85 }} />,
        text: isUrl ? ci.label : `${ci.label}: ${ci.value}`,
        href: isUrl ? ci.value : undefined,
      }
    }
    const contactItems = [
      (!data.hideEmail && data.email) && { icon: <Mail size={10} color={c} strokeWidth={2} />, text: data.email, href: `mailto:${data.email}` },
      (!data.hidePhone && data.phone) && { icon: <Phone size={10} color={c} strokeWidth={2} />, text: data.phone, href: `tel:${data.phone.replace(/[\s()\-]/g, '')}` },
      (!data.hideCity && data.city) && { icon: <MapPin size={10} color={c} strokeWidth={2} />, text: data.city },
      (!data.hideWebsite && data.website) && { icon: <ExternalLink size={10} color={c} strokeWidth={2} />, text: data.website, href: toWebHref(data.website) },
      ...(data.extraWebsites || []).filter(Boolean).map(w => ({ icon: <ExternalLink size={10} color={c} strokeWidth={2} />, text: w, href: toWebHref(w) })),
      ...(data.customContacts || [])
        .filter(ci => !ci.hidden && ci.label && ci.value && ci.isInfo !== true)
        .map(makeCustomItem),
    ].filter(Boolean) as { icon: React.ReactNode; text: string; href?: string }[]
    const infoItems = (data.customContacts || [])
      .filter(ci => !ci.hidden && ci.label && ci.value && ci.isInfo === true)
      .map(makeCustomItem)

    const renderItem = (it: { icon: React.ReactNode; text: string; href?: string }, key: string | number) => (
      <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
        <span style={{ opacity: 0.85, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{it.icon}</span>
        {it.href ? (
          <a
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={interactive ? (e) => e.preventDefault() : undefined}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {it.text}
          </a>
        ) : it.text}
      </span>
    )

    return (
      <div onClick={click({ kind: 'contact' })}
        style={{
          ...editStyle({ kind: 'contact' }),
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          flexWrap: vertical ? 'nowrap' : 'wrap',
          gap: vertical ? '6px' : '6px 18px',
          fontSize: s(11.5),
          color: c,
          padding: interactive ? '4px' : 0,
          margin: interactive ? '-4px' : 0,
        }}>
        {contactItems.map((it, i) => renderItem(it, i))}
        {infoItems.length > 0 && <>
          {contactItems.length > 0 && (vertical
            ? <div style={{ height: '1px', background: onDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0', margin: '2px 0' }} />
            : <span style={{ color: onDark ? 'rgba(255,255,255,0.3)' : '#cbd5e1', alignSelf: 'center', lineHeight: 1, fontSize: s(11) }}>|</span>
          )}
          {vertical && (
            <span style={{ fontSize: s(9), fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: onDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>基本信息</span>
          )}
          {infoItems.map((it, i) => renderItem(it, `info_${i}`))}
        </>}
      </div>
    )
  }

  // ============ PHOTO ============
  const PhotoBlock = ({ size = 100, onDark = false }: { size?: number; onDark?: boolean }) => {
    const meta = data.photoMeta
    const photoShape = meta?.shape ?? 'rounded'
    const PORTRAIT_RATIO = 4 / 3
    const containerW = size
    const containerH = photoShape === 'rounded' ? Math.round(size * PORTRAIT_RATIO) : size
    const borderRadius = photoShape === 'rounded' ? '0' : '50%'

    // Compute rendered image dimensions preserving natural aspect ratio.
    // Without natW/natH (legacy photos), fall back to object-fit: cover on the container.
    // globals.css applies box-sizing:border-box globally, so the 2px border is included in
    // containerW/H. The absolutely-positioned image is relative to the content box (border
    // excluded), which is containerW - 2*2 = containerW - 4 pixels wide/tall.
    const BORDER = 2
    const contentW = containerW - 2 * BORDER
    const contentH = containerH - 2 * BORDER
    let imgW = contentW, imgH = contentH, imgLeft = 0, imgTop = 0, hasMeta = false
    if (meta && meta.natW && meta.natH) {
      hasMeta = true
      const coverScale = Math.max(contentW / meta.natW, contentH / meta.natH)
      imgW = Math.ceil(meta.natW * coverScale * meta.scale)
      imgH = Math.ceil(meta.natH * coverScale * meta.scale)
      imgLeft = Math.round((contentW - imgW) / 2 + meta.x * contentW)
      imgTop  = Math.round((contentH - imgH) / 2 + meta.y * contentH)
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (interactive && onPhotoUpload) onPhotoUpload()
    }
    return (
      <div onClick={interactive ? handleClick : undefined}
        className={interactive ? 'resume-photo-circle' : undefined}
        style={{
          width: containerW, height: containerH,
          borderRadius,
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
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%',
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
        fontSize: big ? s(32) : s(22),
        fontWeight: 700,
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
        color: onDark ? '#fff' : '#0f172a',
      }}>{data.name}</div>
      {data.jobtitle && (
        <div style={{
          fontFamily: baseFont,
          fontSize: big ? s(14) : s(12),
          fontWeight: 400,
          color: onDark ? 'rgba(255,255,255,0.75)' : '#475569',
          marginTop: s(4),
        }}>{data.jobtitle}</div>
      )}
    </div>
  )

  // ============ MAIN BODY (sections in order) ============
  const DEFAULT_SECTION_ORDER: SectionKey[] = ['exp', 'project', 'edu', 'language', 'award', 'cert', 'volunteer', 'interest']
  const effectiveSectionOrder = (() => {
    const stored = data.sectionOrder ?? []
    const storedSet = new Set(stored)
    return [...stored, ...DEFAULT_SECTION_ORDER.filter(k => !storedSet.has(k))]
  })()

  const renderSection = (key: SectionKey, onDark = false): React.ReactNode => {
    switch (key) {
      case 'exp':       return data.hasExp !== false ? <Section key="exp" sec="exp" label={T('exp')} items={data.exp} onDark={onDark} /> : null
      case 'edu':       return data.hasEdu !== false ? <Section key="edu" sec="edu" label={T('edu')} items={data.edu} onDark={onDark} /> : null
      case 'project':   return data.hasProject ? <Section key="project" sec="project" label={T('project')} items={data.project} onDark={onDark} /> : null
      case 'language':  return data.hasLanguage ? <LanguageSection key="language" onDark={onDark} /> : null
      case 'award':     return data.hasAward ? <Section key="award" sec="award" label={T('award')} items={data.award} onDark={onDark} /> : null
      case 'cert':      return data.hasCert ? <Section key="cert" sec="cert" label={T('cert')} items={data.cert} onDark={onDark} /> : null
      case 'volunteer': return data.hasVolunteer ? <Section key="volunteer" sec="volunteer" label={T('volunteer')} items={data.volunteer} onDark={onDark} /> : null
      case 'interest':  return data.hasInterest ? <Section key="interest" sec="interest" label={T('interest')} items={data.interest} onDark={onDark} /> : null
      default:          return null
    }
  }

  const MainBody = ({ onDark = false }: { onDark?: boolean }) => (
    <>
      <SummaryBlock onDark={onDark} />
      {effectiveSectionOrder.map(key => renderSection(key, onDark))}
    </>
  )

  // ============ ROOT ============
  // All papers white; structural dimensions are fixed — only typography scales via s()
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
            backgroundColor: accent,
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
              <SectionTitle onDark>{T('contact')}</SectionTitle>
              <ContactInline onDark vertical />
            </div>

            <SkillsBlock onDark />
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
            backgroundColor: `${accent}08`,
            borderRight: `2px solid ${accent}`,
            padding: '36px 22px',
            flexShrink: 0,
          }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <PhotoBlock size={100} />
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <NameBlock centered big={false} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <SectionTitle>{T('contact')}</SectionTitle>
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
            backgroundColor: `${accent}08`,
            borderLeft: `2px solid ${accent}`,
            padding: '40px 22px',
            flexShrink: 0,
          }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <PhotoBlock size={100} />
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
          backgroundColor: accent,
          padding: '36px 48px',
          display: 'flex', alignItems: 'center', gap: '24px',
        }}>
          {template.showPhoto && <PhotoBlock size={100} onDark />}
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
            backgroundColor: '#f8fafc',
            border: `2px solid ${accent}`,
            borderRadius: '8px',
            padding: '24px',
            display: 'flex', alignItems: 'center', gap: '20px',
          }}>
            {template.showPhoto && <PhotoBlock size={100} />}
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
            {template.showPhoto && <PhotoBlock size={100} />}
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
            {effectiveSectionOrder
              .filter(k => (['exp', 'project', 'volunteer', 'interest'] as SectionKey[]).includes(k))
              .map(key => renderSection(key))}
          </div>
          <div style={{ flex: 1 }}>
            <Section sec="edu" label={T('edu')} items={data.edu} />
            <SkillsBlock />
            {data.hasLanguage && <LanguageSection />}
            {data.hasAward && <Section sec="award" label={T('award')} items={data.award} />}
            {data.hasCert && <Section sec="cert" label={T('cert')} items={data.cert} />}
          </div>
        </div>
      </div>
    )
  }

  // ============ LAYOUT: SINGLE CENTERED ============
  if (template.layout === 'single-centered') {
    // ── photo-right: name left-aligned, photo floated to right ──
    if (template.photoPlacement === 'right') {
      return (
        <div style={rootStyle}>
          <div style={{ padding: '40px 48px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <div style={{ flex: 1 }}>
                <NameBlock big />
                <div style={{ height: '10px' }} />
                <ContactInline />
              </div>
              <PhotoBlock size={100} />
            </div>
            <div style={{ marginTop: '18px', borderTop: `2.5px solid ${accent}`, paddingTop: '5px', borderBottom: `1px solid ${accent}40` }} />
          </div>
          <div style={{ padding: '4px 48px 40px' }}>
            <MainBody />
            <SkillsBlock />
          </div>
        </div>
      )
    }

    // ── left-beside: photo + name centered as a unit on the page ──
    if (template.photoPlacement === 'left-beside') {
      return (
        <div style={rootStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 48px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <PhotoBlock size={100} />
              <div>
                <NameBlock big />
                <div style={{ height: '8px' }} />
                <ContactInline />
              </div>
            </div>
          </div>
          <div style={{ height: '2px', background: accent, margin: '0 48px 0' }} />
          <div style={{ padding: '4px 48px 40px' }}>
            <MainBody />
            <SkillsBlock />
          </div>
        </div>
      )
    }

    // ── band-right: tinted band, name centered, photo on right ──
    if (template.photoPlacement === 'band-right') {
      return (
        <div style={rootStyle}>
          <div style={{
            padding: '28px 48px',
            backgroundColor: `${accent}08`,
            borderBottom: `1.5px solid ${accent}25`,
            display: 'flex', alignItems: 'center', gap: '24px',
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <NameBlock centered big />
              <div style={{ height: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ContactInline />
              </div>
            </div>
            <PhotoBlock size={100} />
          </div>
          <div style={{ padding: '24px 48px 40px' }}>
            <MainBody />
            <SkillsBlock />
          </div>
        </div>
      )
    }

    // ── large-center: oversized photo centered, generous spacing ──
    if (template.photoPlacement === 'large-center') {
      return (
        <div style={rootStyle}>
          <div style={{ padding: '52px 48px 32px', textAlign: 'center' }}>
            {template.showPhoto && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <PhotoBlock size={120} />
              </div>
            )}
            <NameBlock centered big />
            <div style={{ height: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ContactInline />
            </div>
            <div style={{ width: '40px', height: '3px', background: accent, margin: '24px auto 0', borderRadius: '2px' }} />
          </div>
          <div style={{ padding: '4px 48px 40px' }}>
            <MainBody />
            <SkillsBlock />
          </div>
        </div>
      )
    }

    // ── default: photo centered above name ──
    return (
      <div style={rootStyle}>
        <div style={{ padding: '40px 48px 28px', textAlign: 'center' }}>
          {template.showPhoto && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <PhotoBlock size={100} />
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

  // ============ LAYOUT: LINKEDIN BANNER ============
  if (template.layout === 'linkedin-banner') {
    return (
      <div style={rootStyle}>
        {/* Colored band — overflow visible so photo hangs below */}
        <div style={{ backgroundColor: accent, height: '110px', position: 'relative', overflow: 'visible', zIndex: 1 }}>
          {template.showPhoto && (
            <div style={{ position: 'absolute', bottom: '-50px', left: '48px', zIndex: 2, filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.14))' }}>
              <PhotoBlock size={100} />
            </div>
          )}
        </div>

        {/* Header: spacer for hanging photo + name side-by-side */}
        <div style={{ padding: '12px 48px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            {template.showPhoto && <div style={{ width: '100px', height: '50px', flexShrink: 0 }} />}
            <div style={{ flex: 1, paddingBottom: '6px' }}>
              <NameBlock big />
            </div>
          </div>
          <div style={{ height: '10px' }} />
          <ContactInline />
          <div style={{ height: '1.5px', background: `${accent}30`, marginTop: '18px' }} />
        </div>

        <div style={{ padding: '14px 48px 40px' }}>
          <MainBody />
          <SkillsBlock />
        </div>
      </div>
    )
  }

  // ============ LAYOUT: NAMECARD HEADER ============
  if (template.layout === 'namecard-header') {
    return (
      <div style={rootStyle}>
        {/* Three-segment namecard: photo | name+title | contact */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '28px 40px',
          background: `${accent}07`,
          borderBottom: `1.5px solid ${accent}30`,
        }}>
          {template.showPhoto && (
            <div style={{ flexShrink: 0 }}>
              <PhotoBlock size={100} />
            </div>
          )}
          <div style={{ flex: 1.2 }}>
            <NameBlock big />
          </div>
          <div style={{ width: '1px', height: '60px', background: `${accent}25`, flexShrink: 0 }} />
          <div style={{ flexShrink: 0, maxWidth: '210px' }}>
            <ContactInline vertical />
          </div>
        </div>
        <div style={{ padding: '28px 48px 40px' }}>
          <MainBody />
          <SkillsBlock />
        </div>
      </div>
    )
  }

  // ============ LAYOUT: DIAGONAL PHOTO ============
  if (template.layout === 'diagonal-photo') {
    return (
      <div style={rootStyle}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Diagonal accent shape in top-right */}
          {template.showPhoto && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '260px', height: '220px',
              background: `linear-gradient(135deg, ${accent}00 30%, ${accent}18 100%)`,
              clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0 100%)',
              pointerEvents: 'none',
            }} />
          )}
          {/* Header: name+contact left, photo right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', padding: '40px 48px 24px', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <NameBlock big />
              <div style={{ height: '12px' }} />
              <ContactInline />
            </div>
            {template.showPhoto && (
              <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <PhotoBlock size={100} />
              </div>
            )}
          </div>
          <div style={{ height: '2px', background: accent, margin: '0 48px 0', position: 'relative' }} />
        </div>
        <div style={{ padding: '14px 48px 40px' }}>
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
            <PhotoBlock size={100} />
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
