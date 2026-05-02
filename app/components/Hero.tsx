'use client'
import Link from 'next/link'

export default function Hero({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <section className="hero-section" style={{
      padding: '120px 32px 80px',
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '80px',
      alignItems: 'center',
    }}>
      {/* Left */}
      <div className="fade-in">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold-light)',
          border: '1px solid var(--gold2)',
          color: '#256EA5',
          fontSize: '12px', fontWeight: 500,
          padding: '4px 12px', borderRadius: '20px',
          marginBottom: '20px',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '10px' }}>✦</span>
          AI 驱动 · 50+ 专业模板
        </div>

        <h1 style={{
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          fontSize: 'clamp(34px, 5vw, 58px)',
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          marginBottom: '20px',
        }}>
          打造<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>令人印象<br />深刻</em>的简历
        </h1>

        <p style={{
          fontSize: '17px', lineHeight: 1.7,
          color: 'var(--ink2)', marginBottom: '36px',
          fontWeight: 300,
        }}>
          从选择模板到 AI 优化内容，只需几分钟，<br />
          创建一份脱颖而出的专业简历。
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/editor" style={{
            background: 'var(--ink)', color: 'var(--paper)',
            border: 'none', padding: '14px 28px',
            borderRadius: '10px', fontSize: '15px', fontWeight: 500,
            cursor: 'pointer', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--ink2)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--ink)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          >
            浏览模板 <span style={{ fontSize: '16px' }}>→</span>
          </Link>

          <button onClick={onUploadClick} style={{
            background: 'transparent', color: 'var(--ink2)',
            border: '1.5px solid var(--paper3)',
            padding: '13px 24px', borderRadius: '10px',
            fontSize: '15px', fontWeight: 400,
            cursor: 'pointer', fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--ink3)'
            e.currentTarget.style.color = 'var(--ink)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--paper3)'
            e.currentTarget.style.color = 'var(--ink2)'
          }}
          >
            <span>📄</span> 上传已有简历
          </button>
        </div>

        {/* Stats */}
        <div className="hero-stats" style={{ display: 'flex', gap: '32px', marginTop: '44px' }}>
          {[
            { num: '50+', label: '专业模板' },
            { num: '50k+', label: '用户使用' },
            { num: '98%', label: '好评率' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                fontSize: '28px', color: 'var(--ink)', letterSpacing: '-0.5px',
              }}>{s.num}</span>
              <span style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Resume preview card */}
      <div className="hero-right fade-in" style={{ position: 'relative', transitionDelay: '0.2s' }}>
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(26,24,20,0.14), 0 4px 12px rgba(26,24,20,0.08)',
          overflow: 'hidden', border: '1px solid var(--paper3)',
        }}>
          <div style={{ background: 'var(--ink)', padding: '28px 32px 24px', color: 'white' }}>
            <div style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '24px', marginBottom: '4px' }}>陈梦瑶</div>
            <div style={{ fontSize: '13px', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 300 }}>
              Senior Product Designer
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
              {['📧 meng@example.com', '📱 138 0000 0000', '🌐 portfolio.io'].map(c => (
                <span key={c} style={{ fontSize: '11px', opacity: 0.7 }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '24px 32px' }}>
            {['工作经历', '教育背景', '专业技能'].map((sec, i) => (
              <div key={sec} style={{ marginBottom: i < 2 ? '20px' : 0 }}>
                <div style={{
                  fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                  color: 'var(--ink3)', fontWeight: 600,
                  borderBottom: '1px solid var(--paper3)', paddingBottom: '6px', marginBottom: '10px',
                }}>{sec}</div>
                {i < 2 ? (
                  [100, 80, 60].map((w, j) => (
                    <div key={j} style={{
                      height: '7px', background: 'var(--paper2)',
                      borderRadius: '3px', marginBottom: '5px', width: `${w}%`,
                    }} />
                  ))
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[60, 70, 50].map((w, j) => (
                      <div key={j} style={{
                        height: '18px', width: `${w}px`,
                        background: 'var(--paper2)', borderRadius: '12px',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="animate-float" style={{
          position: 'absolute', top: '100px', right: '-16px',
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '10px 14px', borderRadius: '10px',
          fontSize: '12px', fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(26,24,20,0.15)',
        }}>
          ✏️ 点击任意区域开始编辑
          <div style={{
            position: 'absolute', left: '-6px', top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid var(--ink)',
          }} />
        </div>

        <div style={{
          position: 'absolute', bottom: '-20px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, var(--teal), #1a5c50)',
          color: 'white', padding: '8px 18px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: '0 4px 20px rgba(45,125,110,0.4)',
          whiteSpace: 'nowrap',
        }}>
          <div className="animate-pulse-dot" style={{
            width: '6px', height: '6px',
            background: 'var(--gold2)', borderRadius: '50%',
          }} />
          AI 正在优化您的描述...
        </div>
      </div>
    </section>
  )
}
