'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TEMPLATES, CATEGORIES, CATEGORY_MAP, TemplateConfig } from '../lib/templates-config'
import TemplateThumbnail from '../lib/TemplateThumbnail'

const FREE_COUNT = TEMPLATES.filter(t => t.free).length

export default function Templates() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [extraLoads, setExtraLoads] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setExtraLoads(0) }, [isMobile])

  const step = isMobile ? 5 : 10
  const defaultCount = isMobile ? 5 : 10
  const showCount = defaultCount + extraLoads * step

  const catKey = CATEGORY_MAP[activeFilter]
  const filtered = TEMPLATES.filter(t =>
    catKey === 'all' || t.categories.includes(catKey)
  )
  const visible = filtered.slice(0, showCount)
  const hasMore = filtered.length > showCount

  function handleFilterChange(f: string) {
    setActiveFilter(f)
    setExtraLoads(0)
  }

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
            多套专业设计，{FREE_COUNT} 套免费 · 更多 Pro 解锁
          </p>
        </div>

        {/* Category filter — parallelogram tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map(f => {
            const active = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                style={{
                  padding: '8px 20px',
                  transform: 'skewX(-12deg)',
                  background: active
                    ? 'linear-gradient(120deg, var(--theme-blue), #0567c4)'
                    : 'white',
                  border: active ? 'none' : '1.5px solid #e2e8f0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.18s, color 0.18s',
                  boxShadow: active ? '0 4px 14px rgba(7,137,236,0.35)' : 'none',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  transform: 'skewX(12deg)',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'white' : '#475569',
                  whiteSpace: 'nowrap',
                }}>
                  {f}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="templates-grid" style={{
        maxWidth: '1280px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: isMobile ? '14px' : '28px',
      }}>
        {visible.map((tpl, i) => (
          <TemplateCard key={tpl.id} tpl={tpl} delay={Math.min(i, 9) * 0.04} />
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
            查看更多 ↓
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
    <div className="fade-in" style={{ transitionDelay: `${delay}s`, minWidth: 0 }}>
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        <TemplateThumbnail template={tpl} fillWidth />
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: tpl.free ? 'var(--teal)' : '#0f172a',
          color: 'white',
          padding: '3px 10px', borderRadius: '5px',
          fontSize: '10px', fontWeight: 600,
        }}>{tpl.free ? '免费' : 'Pro'}</div>
      </div>

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
        }}>使用</Link>
      </div>
    </div>
    </div>
  )
}
