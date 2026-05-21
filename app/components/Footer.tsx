import Link from 'next/link'

const LINKS = [
  { label: '关于我们', href: '/about' },
  { label: '隐私政策', href: '/privacy' },
  { label: '使用条款', href: '/terms' },
  { label: '帮助中心', href: '/help' },
]

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--ink)',
      color: 'rgba(250,248,244,0.6)',
      padding: '48px 32px',
      fontSize: '13px',
    }}>
      <div className="footer-inner" style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px',
      }}>
        <div style={{ fontSize: '20px', color: 'var(--paper)', fontWeight: 500 }}>
          简力全开
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {LINKS.map(l => (
            <Link key={l.label} href={l.href} style={{
              color: 'rgba(250,248,244,0.45)', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--paper)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(250,248,244,0.45)')}
            >{l.label}</Link>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(250,248,244,0.3)' }}>© 2026 简力全开</div>
      </div>
    </footer>
  )
}
