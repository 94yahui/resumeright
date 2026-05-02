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
        <div style={{ fontSize: '20px', color: 'var(--paper)' }}>
          简历帮
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['关于我们', '隐私政策', '使用条款', '帮助中心'].map(l => (
            <a key={l} href="#" style={{
              color: 'rgba(250,248,244,0.45)', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--paper)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,248,244,0.45)')}
            >{l}</a>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(250,248,244,0.3)' }}>© 2026 简历帮</div>
      </div>
    </footer>
  )
}
