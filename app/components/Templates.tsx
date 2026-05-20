'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TEMPLATES, CATEGORIES, CATEGORY_MAP, TemplateConfig } from '../lib/templates-config'
import TemplateThumbnail from '../lib/TemplateThumbnail'

const FREE_COUNT = TEMPLATES.filter(t => t.free).length
const PRO_COUNT = TEMPLATES.filter(t => !t.free).length

export default function Templates() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [showAll, setShowAll] = useState(false)

  const catKey = CATEGORY_MAP[activeFilter]
  const filtered = TEMPLATES.filter(t =>
    catKey === 'all' || t.categories.includes(catKey)
  )
  const visible = showAll ? filtered : filtered.slice(0, 12)

  return (
    <section id="templates" className="templates-section" style={{
      background: 'var(--paper2)',
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
          }}>模板库</div>
          <h2 style={{
            fontSize: '38px', letterSpacing: '-1px', lineHeight: 1.15,
            fontWeight: 700, color: '#0f172a',
          }}>
            找到<span style={{ color: 'var(--theme-blue)' }}>属于你</span>的风格
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '10px', fontWeight: 400 }}>
            {TEMPLATES.length} 套专业设计，{FREE_COUNT} 套免费 · {PRO_COUNT} 套 Pro
          </p>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(f => {
            const cat = CATEGORY_MAP[f]
            const count = cat === 'all' ? TEMPLATES.length
                        : TEMPLATES.filter(t => t.categories.includes(cat)).length
            const active = activeFilter === f
            return (
              <button key={f} onClick={() => { setActiveFilter(f); setShowAll(false) }}
                style={{
                  padding: '8px 18px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  border: '1.5px solid',
                  borderColor: active ? '#0f172a' : '#cbd5e1',
                  background: active ? '#0f172a' : 'white',
                  color: active ? '#fff' : '#334155',
                  transition: 'all 0.2s',
                }}>
                {f} <span style={{ opacity: 0.55, fontSize: '11px', marginLeft: '4px' }}>({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="templates-grid" style={{
        maxWidth: '1280px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '28px',
      }}>
        {visible.map((tpl, i) => (
          <TemplateCard key={tpl.id} tpl={tpl} delay={Math.min(i, 11) * 0.04} />
        ))}
      </div>

      {filtered.length > 12 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button onClick={() => setShowAll(v => !v)} style={{
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
            {showAll ? '收起' : `查看全部 ${filtered.length} 套`} {showAll ? '↑' : '↓'}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
          该分类暂无模板
        </div>
      )}
    </section>
  )
}

function TemplateCard({ tpl, delay }: { tpl: TemplateConfig; delay: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    // Outer: scroll-fade stagger only
    // minWidth:0 prevents CSS Grid from expanding the track to the child's max-content width
    <div className="fade-in" style={{ transitionDelay: `${delay}s`, minWidth: 0 }}>
    {/* Inner: hover — zero delay, always instant */}
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.22s',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
      }}
    >
      {/* Thumbnail — A4 paper fills full cell width, shadow sits on paper edges */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 16px 48px rgba(15, 23, 42, 0.30)'
          : '0 2px 12px rgba(15, 23, 42, 0.10)',
        transition: 'box-shadow 0.22s',
      }}>
        <TemplateThumbnail template={tpl} fillWidth />
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: tpl.free ? 'var(--teal)' : '#0f172a',
          color: 'white',
          padding: '3px 10px', borderRadius: '5px',
          fontSize: '10px', fontWeight: 600,
        }}>{tpl.free ? '免费' : 'Pro'}</div>
      </div>

      {/* Info below thumbnail — no card wrapper */}
      <div style={{
        padding: '10px 4px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{tpl.name}</div>
          <div style={{ background: 'var(--ink)', borderRadius:'3px', paddingInline: '5px', fontSize: '11px', color: '#fff', marginTop: '2px' }}>{tpl.tag}</div>
        </div>
        <Link href={`/editor?template=${tpl.id}`} style={{
          background: 'var(--theme-blue)',
          color: '#fff',
          padding: '6px 14px', borderRadius: '7px',
          fontSize: '12px', fontWeight: 600,
          textDecoration: 'none',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.2s, transform 0.2s',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>{tpl.free ? '使用' : '使用'}</Link>
      </div>
    </div>
    </div>
  )
}
