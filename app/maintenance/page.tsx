export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #0789ec, #0562b8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '28px',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
        网站维护中
      </h1>
      <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '380px', lineHeight: 1.7, margin: '0 0 8px' }}>
        我们正在对系统进行升级维护，预计很快恢复。
      </p>
      <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
        感谢您的耐心等待，请稍后再访问。
      </p>
    </div>
  )
}
