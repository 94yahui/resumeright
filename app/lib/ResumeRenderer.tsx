'use client'
import React from 'react'
import { ResumeData, SelectionType, SectionKey, Entry } from './types'
import { TemplateConfig } from './templates-config'

// ============================================================
// Unified Resume Renderer
// All paper is white. Layout/typography differ by template.
// Used for editor, thumbnail, preview, and print.
// ============================================================

interface Props {
  data: ResumeData
  template: TemplateConfig
  color?: string
  interactive?: boolean
  selection?: SelectionType
  onSelect?: (s: SelectionType) => void
  onPhotoUpload?: () => void
  /** Total page count — sidebar layouts extend background to fill all pages */
  pageCount?: number
}

const PAGE_WIDTH = 794   // A4 width @ 96dpi
const PAGE_HEIGHT = 1123 // A4 height @ 96dpi

export default function ResumeRenderer({
  data, template, color, interactive = false, selection, onSelect, onPhotoUpload, pageCount = 1,
}: Props) {

  const accent = color || template.accentColor

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
      outline: sel_ ? `2px solid ${accent}` : '2px solid transparent',
      outlineOffset: '2px',
      borderRadius: '3px',
      transition: 'outline 0.1s, background 0.1s',
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
      marginBottom: '12px',
    }

    switch (template.accentStyle) {
      case 'underline-bar':
        return (
          <div style={{ marginBottom: '12px' }}>
            <div style={baseProps}>{children}</div>
            <div style={{ height: '2px', background: titleColor, width: '36px' }} />
          </div>
        )
      case 'left-bar':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '16px', background: titleColor }} />
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
          </div>
        )
      case 'side-icon':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', background: titleColor, borderRadius: '50%' }} />
            <div style={{ ...baseProps, marginBottom: 0 }}>{children}</div>
            <div style={{ flex: 1, height: '1px', background: titleColor, opacity: 0.3 }} />
          </div>
        )
      case 'background-pill':
        return (
          <div style={{
            display: 'inline-block',
            background: titleColor,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontFamily: headingFont,
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}>{children}</div>
        )
      case 'thin-line':
        return (
          <div style={{ marginBottom: '12px', borderBottom: `1px solid ${titleColor}`, paddingBottom: '6px' }}>
            <div style={{ ...baseProps, marginBottom: 0, fontWeight: 500 }}>{children}</div>
          </div>
        )
      case 'double-line':
        return (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ height: '1px', background: titleColor, marginBottom: '4px' }} />
            <div style={{ ...baseProps, textAlign: 'center', marginBottom: '4px' }}>{children}</div>
            <div style={{ height: '1px', background: titleColor }} />
          </div>
        )
      case 'plain-bold':
      default:
        return <div style={{ ...baseProps, fontSize: '14px' }}>{children}</div>
    }
  }

  // ============ ENTRY ITEM (with bullets) ============
  const EntryItem = ({ entry, sec, idx, onDark = false }: {
    entry: Entry; sec: SectionKey; idx: number; onDark?: boolean
  }) => {
    const titleC = onDark ? '#fff' : '#0f172a'
    const subC = onDark ? 'rgba(255,255,255,0.7)' : '#475569'
    const dateC = onDark ? 'rgba(255,255,255,0.6)' : '#64748b'
    const bodyC = onDark ? 'rgba(255,255,255,0.85)' : '#334155'

    return (
      <div
        data-entry="1"
        onClick={click({ kind: 'entry', sec, idx })}
        style={{
          ...editStyle({ kind: 'entry', sec, idx }),
          marginBottom: '14px',
          padding: interactive ? '6px 8px' : '0',
          marginLeft: interactive ? '-8px' : 0,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: headingFont, fontSize: '14px', fontWeight: 600, color: titleC, lineHeight: 1.35 }}>
              {entry.title}
            </div>
            {entry.sub && (
              <div style={{ fontSize: '12.5px', color: subC, marginTop: '2px' }}>
                {entry.sub}
              </div>
            )}
          </div>
          {entry.date && (
            <div style={{ fontSize: '11.5px', color: dateC, whiteSpace: 'nowrap', fontWeight: 500 }}>
              {entry.date}
            </div>
          )}
        </div>
        {/* Bullets */}
        {entry.bullets && entry.bullets.length > 0 && (
          <ul style={{
            listStyle: 'none',
            margin: '6px 0 0',
            padding: 0,
          }}>
            {entry.bullets.map((b, i) => (
              <li key={i} style={{
                fontSize: '12px',
                color: bodyC,
                lineHeight: 1.65,
                paddingLeft: '14px',
                position: 'relative',
                marginBottom: '3px',
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
      </div>
    )
  }

  // ============ SECTION ============
  const Section = ({ sec, label, items, onDark = false }: {
    sec: SectionKey; label: string; items: Entry[]; onDark?: boolean
  }) => {
    if (!items || items.length === 0) return null
    return (
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle onDark={onDark}>{label}</SectionTitle>
        {items.map((entry, idx) => (
          <EntryItem key={entry.id} entry={entry} sec={sec} idx={idx} onDark={onDark} />
        ))}
      </div>
    )
  }

  // ============ SUMMARY ============
  const SummaryBlock = ({ onDark = false }: { onDark?: boolean }) => {
    if (!data.hasSummary) return null
    const c = onDark ? 'rgba(255,255,255,0.85)' : '#334155'
    return (
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle onDark={onDark}>个人简介</SectionTitle>
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
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle onDark={onDark}>专业技能</SectionTitle>
          <div onClick={click({ kind: 'skills' })}
            style={{
              ...editStyle({ kind: 'skills' }),
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              padding: interactive ? '4px' : 0,
            }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
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
      <div onClick={click({ kind: 'skills' })}
        style={{ ...editStyle({ kind: 'skills' }), marginBottom: '20px', padding: interactive ? '4px' : 0 }}>
        <SectionTitle onDark>专业技能</SectionTitle>
        {data.skills.map((s, i) => (
          <div key={i} style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '4px',
            paddingLeft: '12px',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              left: 0, top: '7px',
              width: '4px', height: '4px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
            }} />
            {s}
          </div>
        ))}
      </div>
    )
  }

  // ============ CONTACT BAR ============
  const ContactInline = ({ onDark = false, vertical = false }: { onDark?: boolean; vertical?: boolean }) => {
    const c = onDark ? 'rgba(255,255,255,0.85)' : '#475569'
    const items = [
      data.email && { icon: '📧', text: data.email },
      data.phone && { icon: '📞', text: data.phone },
      data.city && { icon: '📍', text: data.city },
      data.website && { icon: '🌐', text: data.website },
    ].filter(Boolean) as { icon: string; text: string }[]

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
            <span style={{ opacity: 0.7 }}>{it.icon}</span> {it.text}
          </span>
        ))}
      </div>
    )
  }

  // ============ PHOTO ============
  const PhotoBlock = ({ size = 90, onDark = false }: { size?: number; onDark?: boolean }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (interactive && onPhotoUpload) onPhotoUpload()
    }
    return (
      <div onClick={interactive ? handleClick : undefined}
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : '👤'}
        {interactive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: '9px', textAlign: 'center', padding: '2px',
            opacity: 0, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >上传</div>
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
      {data.hasLanguage && <Section sec="language" label="语言能力" items={data.language} onDark={onDark} />}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <PhotoBlock size={100} onDark />
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <NameBlock onDark centered big={false} />
            </div>

            <div style={{ marginBottom: '20px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <PhotoBlock size={88} />
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <NameBlock centered big={false} />
            </div>
            <div style={{ marginBottom: '20px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
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
          </div>
          <div style={{ flex: 1 }}>
            <Section sec="edu" label="教育背景" items={data.edu} />
            <SkillsBlock />
            {data.hasLanguage && <Section sec="language" label="语言能力" items={data.language} />}
            {data.hasAward && <Section sec="award" label="荣誉奖项" items={data.award} />}
            {data.hasCert && <Section sec="cert" label="证书" items={data.cert} />}
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
