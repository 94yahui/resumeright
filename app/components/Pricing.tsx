'use client'
import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: '免费版',
    price: '0',
    period: '永久免费',
    features: ['5 套精选模板', '基础在线编辑', 'PDF 下载（带水印）', '模块拖拽排序'],
    cta: '立即开始',
    ctaHref: '/editor?template=classic-pro',
    featured: false,
  },
  {
    name: 'Pro 会员',
    price: '19',
    period: '/ 月 · 按月订阅',
    features: ['全部模板', '无水印下载', 'AI 内容优化（无限次）', '简历智能解析', '岗位匹配分析', '多份简历保存', 'Word / PDF 格式'],
    cta: '订阅 Pro',
    ctaHref: '#',
    featured: true,
  },
  {
    name: '单次购买',
    price: '9',
    period: '/ 套模板 · 永久使用',
    features: ['解锁指定 1 套模板', '无水印下载', '终身使用权', 'AI 优化（5 次）'],
    cta: '浏览模板',
    ctaHref: '#templates',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" style={{
      background: 'var(--theme-blue)',
      padding: '80px 32px',
      borderTop: '1px solid var(--paper3)',
    }}>
      <div style={{ textAlign: 'center' }} className="fade-in">
        <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--paper)', fontWeight: 500, marginBottom: '12px' }}>
          定价方案
        </div>
        <h2 style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-1px', color: 'var(--paper)' }}>
          选择适合你的<em style={{ fontStyle: 'italic', color: 'var(--paper)' }}>方案</em>
        </h2>
        <p style={{ color: 'var(--paper)', marginTop: '10px', fontWeight: 300 }}>灵活选择，按需付费</p>
      </div>

      <div className="pricing-grid" style={{
        maxWidth: '900px', margin: '56px auto 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px',
        alignItems: 'start',
      }}>
        {plans.map((plan, i) => (
          <PricingCard key={plan.name} plan={plan} delay={i * 0.1} />
        ))}
      </div>
    </section>
  )
}

function PricingCard({ plan, delay }: { plan: typeof plans[0]; delay: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fade-in" style={{ transitionDelay: `${delay}s` }}>
      <div
        className={plan.featured ? 'pricing-featured' : ''}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: plan.featured ? 'var(--ink)' : 'white',
          borderRadius: '16px',
          padding: '32px 28px',
          position: 'relative',
          transform: plan.featured ? 'scale(1.04)' : 'scale(1)',
          // boxShadow: plan.featured ? '0 12px 40px rgba(26,24,20,0.14)' : hovered ? '0 4px 16px rgba(26,24,20,0.10)' : 'none',
          transition: 'box-shadow 0.25s',
          color: plan.featured ? 'var(--paper)' : 'var(--ink)',
        }}
      >
        {plan.featured && (
          <div style={{
            position: 'absolute', top: '-12px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#f5d209', color: 'var(--ink)',
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
          }}>✦ 最受欢迎</div>
        )}

        <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', opacity: plan.featured ? 0.5 : 1, color: plan.featured ? 'var(--paper)' : 'var(--ink3)' }}>
          {plan.name}
        </div>

        <div style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '42px', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px' }}>
          <sup style={{ fontSize: '20px', verticalAlign: 'super' }}>¥</sup>{plan.price}
        </div>
        <div style={{ fontSize: '13px', marginBottom: '28px', opacity: plan.featured ? 0.5 : 1, color: plan.featured ? 'var(--paper)' : 'var(--ink3)' }}>
          {plan.period}
        </div>

        <ul style={{ listStyle: 'none', marginBottom: '28px' }}>
          {plan.features.map(f => (
            <li key={f} style={{
              fontSize: '13px',
              color: plan.featured ? 'rgba(250,248,244,0.8)' : 'var(--ink2)',
              padding: '6px 0',
              display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: `1px solid ${plan.featured ? 'rgba(255,255,255,0.1)' : 'var(--paper3)'}`,
            }}>
              <span style={{ color: plan.featured ? 'var(--gold2)' : 'var(--theme-blue)', fontWeight: 700, fontSize: '12px' }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        <Link href={plan.ctaHref} style={{
          display: 'block', width: '100%', padding: '12px',
          borderRadius: '10px', textAlign: 'center',
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          fontSize: '14px', fontWeight: 500,
          textDecoration: 'none',
          cursor: 'pointer', transition: 'background 0.2s',
          background: plan.featured ? 'var(--theme-blue)' : 'transparent',
          color: plan.featured ? '#fff' : 'var(--ink)',
          border: `1.5px solid ${plan.featured ? 'var(--theme-blue)' : 'var(--paper3)'}`,
        }}
        onMouseEnter={e => { if (plan.featured) e.currentTarget.style.background = 'black' }}
        onMouseLeave={e => { if (plan.featured) e.currentTarget.style.background = 'var(--theme-blue)' }}
        >{plan.cta}</Link>
      </div>
    </div>
  )
}
