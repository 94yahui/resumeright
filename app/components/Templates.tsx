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
    <section id="templates" style={{
      background: '#f8fafc',
      padding: '80px 32px',
      borderTop: '1px solid #e2e8f0',
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
            找到<span style={{ color: '#256EA5' }}>属于你</span>的风格
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

      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.background = '#f8fafc' }}
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
    <div className="fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1.5px solid ${hovered ? 'transparent' : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 36px rgba(15, 23, 42, 0.14)' : 'none',
        transitionDelay: `${delay}s`,
      }}
    >
      <div style={{
        position: 'relative',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 10px',
        height: '280px',
        overflow: 'hidden',
      }}>
        <TemplateThumbnail template={tpl} width={180} />
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: tpl.free ? '#0d9488' : '#0f172a',
          color: 'white',
          padding: '3px 10px', borderRadius: '5px',
          fontSize: '10px', fontWeight: 600,
        }}>{tpl.free ? '免费' : '🔒 Pro'}</div>
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{tpl.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{tpl.tag}</div>
        </div>
        <Link href={`/editor?template=${tpl.id}`} style={{
          background: tpl.free ? '#0d9488' : '#0f172a',
          color: '#fff',
          padding: '6px 14px', borderRadius: '7px',
          fontSize: '12px', fontWeight: 600,
          textDecoration: 'none',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.9)',
          transition: 'all 0.2s',
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}>{tpl.free ? '使用' : '解锁'}</Link>
      </div>
    </div>
  )
}
