'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TEMPLATES, CATEGORIES, CATEGORY_MAP, TemplateConfig } from '../lib/templates-config'
import TemplateThumbnail from '../lib/TemplateThumbnail'

const FREE_COUNT = TEMPLATES.filter(t => t.free).length
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export default function Templates() {
  const [activeFilter, setActiveFilter] = useState('全部')
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

  const step = isMobile ? 6 : 10
  const defaultCount = isMobile ? 6 : 10
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

        {/* Category filter */}
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
                  boxShadow: 'none',
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
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            delay={Math.min(i, 9) * 0.04}
            onPreview={() => setPreviewTpl(tpl)}
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
            查看更多 ↓
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
          该分类暂无模板
        </div>
      )}

      {previewTpl && (
        <TemplatePreviewModal tpl={previewTpl} onClose={() => setPreviewTpl(null)} />
      )}
    </section>
  )
}

function TemplateCard({ tpl, delay, onPreview }: { tpl: TemplateConfig; delay: number; onPreview: () => void }) {
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
        <TemplateThumbnail template={tpl} fillWidth />
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: tpl.free ? 'var(--teal)' : '#0f172a',
          color: 'white',
          padding: '3px 10px', borderRadius: '5px',
          fontSize: '10px', fontWeight: 600,
        }}>{tpl.free ? '免费' : 'Pro'}</div>

        {/* Hover overlay — light tint with theme-blue 预览 button */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          <div style={{
            background: 'var(--theme-blue)',
            color: 'white',
            padding: '7px 20px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            boxShadow: '0 2px 12px rgba(7,137,236,0.45)',
          }}>预览</div>
        </div>
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
      </div>
    </div>
    </div>
  )
}

function TemplatePreviewModal({ tpl, onClose }: { tpl: TemplateConfig; onClose: () => void }) {
  const [size, setSize] = useState({ w: 340, h: 481 })
  const [hasHistory, setHasHistory] = useState(false)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    const compute = () => {
      const maxW = window.innerWidth * 0.88
      const maxH = window.innerHeight * 0.84
      const wFromH = maxH * PAGE_WIDTH / PAGE_HEIGHT
      const w = Math.round(Math.min(maxW, wFromH))
      const h = Math.round(w * PAGE_HEIGHT / PAGE_WIDTH)
      setSize({ w, h })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('resumecraft_history') || '[]')
      setHasHistory(Array.isArray(history) && history.length > 0)
    } catch {}
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

  function handleUseTemplate() {
    if (hasHistory) {
      setShowContinue(true)
    } else {
      window.location.href = `/editor?template=${tpl.id}`
    }
  }

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
          <TemplateThumbnail template={tpl} width={size.w} />
        </div>

        {/* Centered 使用模版 button */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <button
            onClick={handleUseTemplate}
            style={{
              pointerEvents: 'all',
              background: 'rgba(7,137,236,0.82)',
              color: '#fff',
              padding: '13px 32px',
              borderRadius: '10px',
              fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(7,137,236,0.4)',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(2px)',
            }}
          >
            使用模版
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
          aria-label="关闭"
        >
          ×
        </button>

        {/* Continue editing dialog */}
        {showContinue && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(10,16,30,0.72)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '2px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              background: 'white', borderRadius: '14px',
              padding: '28px 24px', width: Math.min(size.w - 40, 300),
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                继续之前的编辑？
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                你有未完成的简历，是继续编辑还是用此模版新建？
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => { window.location.href = '/editor' }}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: '8px', border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#0f172a',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  继续编辑
                </button>
                <button
                  onClick={() => { window.location.href = `/editor?template=${tpl.id}` }}
                  style={{
                    flex: 1, padding: '10px 0',
                    borderRadius: '8px', border: 'none',
                    background: 'var(--theme-blue)', color: 'white',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  使用新模版
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
