'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'
import { PASS_PLANS, PRICES, AI_QUOTA, formatUsd, type PassPlan } from '../lib/payment'

const ACCENT = '#0789ec'

const FREE_FEATURES = [
  'All 30+ professional templates',
  'Online editor — edit anywhere, WYSIWYG',
  'PDF export (with watermark)',
  `${AI_QUOTA.free.optimize} AI optimizations`,
  `${AI_QUOTA.free.ats} ATS checks`,
  `${AI_QUOTA.free.import} Smart imports — old PDF/Word into a template`,
  `${AI_QUOTA.free.coverLetter} Cover letter — tailored to each job`,
]

const PAYG_FEATURES = [
  'Watermark-free PDF — one resume',
  'Permanent re-download, no time limit',
  `${AI_QUOTA.single.optimize} AI optimizations`,
  `${AI_QUOTA.single.ats} ATS checks`,
  `${AI_QUOTA.single.import} Smart imports — old PDF/Word into a template`,
  `${AI_QUOTA.single.coverLetter} Cover letters — tailored to each job`,
  'One-time — yours forever, no subscription',
]

const PRO_FEATURES = [
  'Unlimited watermark-free PDF',
  `${AI_QUOTA.pro.optimize} AI optimizations / day`,
  `${AI_QUOTA.pro.ats} ATS checks / day`,
  `${AI_QUOTA.pro.import} Smart imports / day — old PDF/Word into a template`,
  `${AI_QUOTA.pro.coverLetter} Cover letters / day — tailored to each job`,
  'Job-match analysis & interview prep',
  'One-click fit to a single page',
]

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
      {items.map((f) => (
        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
          <Check size={15} color={ACCENT} strokeWidth={2.6} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  const router = useRouter()
  const [pass, setPass] = useState<PassPlan>(
    PASS_PLANS.find((p) => p.badge === 'Most popular') ?? PASS_PLANS[0],
  )

  // No checkout backend yet — every CTA routes into the editor for now.
  // TODO: wire each plan to Stripe Checkout once payments are connected.
  const choose = (_planKey: string) => router.push('/editor')

  const perPeriod =
    pass.key === 'day3' ? '/ 3 days' :
    pass.key === 'weekly' ? '/ week' :
    pass.key === 'monthly' ? '/ month' : '/ quarter'

  const card: React.CSSProperties = {
    background: '#ffffff', border: '1px solid #e7ecf3', borderRadius: '18px',
    padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: '20px',
  }
  const cta: React.CSSProperties = {
    marginTop: 'auto', padding: '12px 18px', borderRadius: '10px', border: 'none',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'opacity 0.2s, transform 0.15s',
  }

  return (
    <section id="pricing" style={{ background: '#f8fafc', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '12px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Pay only while you’re job-hunting. Short passes are one-time and never auto-renew —
            or just unlock a single resume, once.
          </p>
        </div>

        {/* Cards */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' }}>
          {/* Free */}
          <div style={card}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>$0</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>Try it, no card needed</div>
            </div>
            <FeatureList items={FREE_FEATURES} />
            <button onClick={() => choose('free')} style={{ ...cta, background: '#f1f5f9', color: '#0f172a' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
              Start free
            </button>
          </div>

          {/* Pay-as-you-go */}
          <div style={card}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Pay-as-you-go</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{formatUsd(PRICES.single)}</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>one-time</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>Unlock one resume, forever</div>
            </div>
            <FeatureList items={PAYG_FEATURES} />
            <button onClick={() => choose('single')} style={{ ...cta, background: '#0f172a', color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
              Unlock one resume
            </button>
          </div>

          {/* Pro (passes) */}
          <div style={{ ...card, border: `1.5px solid ${ACCENT}`, boxShadow: '0 12px 40px rgba(7,137,236,0.14)', position: 'relative' }}>
            {pass.badge && (
              <div style={{
                position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                background: ACCENT, color: '#fff', fontSize: '11px', fontWeight: 700,
                padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
              }}>{pass.badge}</div>
            )}
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Pro</div>

              {/* Pass selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', margin: '12px 0 14px' }}>
                {PASS_PLANS.map((p) => {
                  const active = p.key === pass.key
                  return (
                    <button key={p.key} onClick={() => setPass(p)} style={{
                      padding: '7px 8px', borderRadius: '9px', cursor: 'pointer',
                      border: `1px solid ${active ? ACCENT : '#e2e8f0'}`,
                      background: active ? 'rgba(7,137,236,0.08)' : '#fff',
                      color: active ? ACCENT : '#475569', fontFamily: 'var(--font-sans)',
                      fontSize: '12px', fontWeight: 600, lineHeight: 1.3,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                      <span>{p.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.75 }}>{formatUsd(p.cents)}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{formatUsd(pass.cents)}</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{perPeriod}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: pass.autoRenew ? '#94a3b8' : '#059669', marginTop: '4px', fontWeight: pass.autoRenew ? 400 : 600 }}>
                {pass.autoRenew ? 'Auto-renews · cancel anytime' : 'One-time · no auto-renew'}
              </div>
            </div>
            <FeatureList items={PRO_FEATURES} />
            <button onClick={() => choose(pass.key)} style={{ ...cta, background: ACCENT, color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
              Get Pro — {pass.label}
            </button>
          </div>
        </div>

        {/* Honesty footnote */}
        <p style={{ textAlign: 'center', fontSize: '12.5px', color: '#94a3b8', marginTop: '28px', lineHeight: 1.6 }}>
          No hidden charges. Short passes never renew automatically. 7-day refund on any purchase.
        </p>
      </div>

      <style>{`@media (max-width: 820px){ .pricing-grid{ grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; } }`}</style>
    </section>
  )
}
