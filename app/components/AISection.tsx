'use client'
import { Sparkles, FileText, Target, ShieldCheck, Minimize2, MonitorSmartphone } from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    rgb: '14,165,233',
    solidColor: '#0ea5e9',
    iconBg: 'rgba(14,165,233,0.15)',
    cardBg: 'rgba(14,165,233,0.06)',
    borderColor: 'rgba(14,165,233,0.3)',
    title: 'ATS-ready Check',
    desc: 'Scan your resume across five technical dimensions — text extraction, encoding, layout, field detection, and file format — to find exactly why it gets filtered out.',
    tag: 'ATS',
    num: '1',
  },
  {
    icon: Sparkles,
    rgb: '167,139,250',
    solidColor: '#a78bfa',
    iconBg: 'rgba(167,139,250,0.15)',
    cardBg: 'rgba(167,139,250,0.05)',
    borderColor: 'rgba(167,139,250,0.3)',
    title: 'Inline Rewrite',
    desc: 'Every work bullet is rewritten inline — stronger verbs, clearer logic — with highlights and strikethroughs you accept in one click. Strictly based on what you wrote, with no made-up numbers.',
    tag: 'Optimize',
    num: '2',
  },
  {
    icon: FileText,
    rgb: '251,191,36',
    solidColor: '#fbbf24',
    iconBg: 'rgba(251,191,36,0.15)',
    cardBg: 'rgba(251,191,36,0.05)',
    borderColor: 'rgba(251,191,36,0.3)',
    title: 'Import in Seconds',
    desc: 'Upload an old PDF or Word resume and it is parsed automatically, reflowing into a fresh template — zero retyping.',
    tag: 'Import',
    num: '3',
  },
  {
    icon: Target,
    rgb: '248,113,113',
    solidColor: '#f87171',
    iconBg: 'rgba(248,113,113,0.15)',
    cardBg: 'rgba(248,113,113,0.05)',
    borderColor: 'rgba(248,113,113,0.3)',
    title: 'Job-fit Analysis',
    desc: 'Paste a job post to get a fit score, gap analysis, and the exact missing skills to add — so you tailor to that role, not in general.',
    tag: 'Match',
    num: '4',
  },
  {
    icon: Minimize2,
    rgb: '16,185,129',
    solidColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.15)',
    cardBg: 'rgba(16,185,129,0.05)',
    borderColor: 'rgba(16,185,129,0.3)',
    title: 'One-page Fit, One Click',
    desc: 'Condense a resume that spills onto a second page down to a clean single page in one click — spacing and layout stay intact.',
    tag: 'Layout',
    num: '5',
  },
  {
    icon: MonitorSmartphone,
    rgb: '99,102,241',
    solidColor: '#6366f1',
    iconBg: 'rgba(99,102,241,0.15)',
    cardBg: 'rgba(99,102,241,0.05)',
    borderColor: 'rgba(99,102,241,0.3)',
    title: 'Edit Anywhere, WYSIWYG',
    desc: 'Edit online from any device on a true what-you-see-is-what-you-get canvas — the resume you build is exactly the resume you export.',
    tag: 'Editor',
    num: '6',
  },
]

export default function AISection() {
  return (
    <section style={{
      background: '#f6f9fc',
      borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid overlay for light-paper texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div id="ai" style={{ padding: '96px 32px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(7,137,236,0.1)',
            border: '1px solid rgba(7,137,236,0.28)',
            padding: '5px 14px', borderRadius: '20px',
            marginBottom: '22px',
          }}>
            <span style={{
              fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase',
              color: '#0789ec', fontWeight: 700,
            }}>
              Main Features
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            letterSpacing: '-1px', color: '#0f172a',
            lineHeight: 1.2, marginBottom: '18px', fontWeight: 700,
          }}>
            Everything you need to build a{' '}
            <span style={{
              background: 'linear-gradient(90deg, #0789ec 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              standout resume
            </span>
          </h2>

          <p style={{
            fontSize: '16px', color: '#64748b',
            maxWidth: '540px', margin: '0 auto', lineHeight: 1.8, fontWeight: 400,
          }}>
            Optimize, import, check, and export — everything to take you from draft to a polished, ready-to-send resume, all in one place
          </p>
        </div>

        {/* Cards grid — 3 per row on desktop (6 features → 2 tidy rows) */}
        <div className="ai-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '18px', marginTop: '60px', maxWidth: '1140px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          {features.map((f, i) => (
            <AICard key={f.title} feature={f} delay={i * 0.08} />
          ))}
        </div>

        <style>{`
          @media (max-width: 960px) { .ai-grid { grid-template-columns: repeat(2, 1fr) !important; max-width: 720px !important; } }
          @media (max-width: 520px) { .ai-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    </section>
  )
}

// Single brand accent for the clean light cards.
const BRAND = '#0789ec'
const BRAND_RGB = '7,137,236'

function AICard({ feature, delay }: { feature: typeof features[0], delay: number }) {
  const Icon = feature.icon

  return (
    <div className="fade-in" style={{ transitionDelay: `${delay}s` }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8edf3',
          borderRadius: '20px', padding: '32px',
          position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          cursor: 'default', height: '100%', boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `rgba(${BRAND_RGB},0.5)`
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.10)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#e8edf3'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Number watermark — very faint */}
        <div style={{
          position: 'absolute', top: '20px', right: '-5px',
          fontSize: '240px', fontWeight: 800, fontStyle: "italic", color: `rgba(${BRAND_RGB},0.05)`,
          letterSpacing: '-2px', lineHeight: 1, pointerEvents: 'none',
          fontFamily: "'Inter', sans-serif",
        }}>
          {feature.num}
        </div>

        {/* Icon box */}
        <div style={{
          width: '52px', height: '52px',
          background: `rgba(${BRAND_RGB},0.1)`,
          borderRadius: '14px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid rgba(${BRAND_RGB},0.2)`,
        }}>
          <Icon size={24} color={BRAND} strokeWidth={1.8} />
        </div>

        {/* Tag */}
        <div style={{
          display: 'inline-block', marginBottom: '12px',
          padding: '3px 10px',
          background: `rgba(${BRAND_RGB},0.1)`,
          color: BRAND, borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          border: `1px solid rgba(${BRAND_RGB},0.22)`,
          letterSpacing: '0.5px',
        }}>
          {feature.tag}
        </div>

        <h3 style={{
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          fontSize: '19px', fontWeight: 700,
          color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.3px',
          display: 'block',
        }}>
          {feature.title}
        </h3>

        <p style={{
          fontSize: '14px', color: '#475569',
          lineHeight: 1.8, fontWeight: 400, margin: 0,
        }}>
          {feature.desc}
        </p>
      </div>
    </div>
  )
}
