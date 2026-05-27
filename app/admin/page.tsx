'use client'
import { useState } from 'react'

const PLANS = [
  { value: 'trial7',    label: '7天体验卡' },
  { value: 'monthly',   label: '月卡（30天）' },
  { value: 'quarterly', label: '季卡（90天）' },
  { value: 'yearly',    label: '年卡（365天）' },
]

export default function AdminPage() {
  const [secret, setSecret]   = useState('')
  const [authed, setAuthed]   = useState(false)
  const [authErr, setAuthErr] = useState('')

  const [plan, setPlan]   = useState('trial7')
  const [count, setCount] = useState(1)
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [codes, setCodes]   = useState<string[]>([])
  const [error, setError]   = useState('')
  const [copied, setCopied] = useState(false)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    // Quick client-side check: try generating 0 codes to verify secret
    const res  = await fetch('/api/admin/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, plan: 'trial7', count: 0 }),
    })
    if (res.status === 401) { setAuthErr('密码错误'); return }
    setAuthed(true)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setCodes([])
    setError('')
    setCopied(false)
    try {
      const res  = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, plan, count, label: label || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? '生成失败'); return }
      setCodes(data.codes)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  function copyText(text: string, onDone?: () => void) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => copyFallback(text, onDone))
    } else {
      copyFallback(text, onDone)
    }
  }

  function copyFallback(text: string, onDone?: () => void) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try { document.execCommand('copy') } catch { /* ignore */ }
    document.body.removeChild(ta)
    onDone?.()
  }

  function copyAll() {
    copyText(codes.join('\n'), () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', fontFamily: 'var(--font-sans)',
    fontSize: '14px', color: '#0f172a', outline: 'none',
    background: '#f8fafc', boxSizing: 'border-box',
  }

  const btnStyle: React.CSSProperties = {
    padding: '11px 24px', borderRadius: '8px', border: 'none',
    background: '#0f172a', color: 'white',
    fontFamily: 'var(--font-sans)', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer',
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '36px', width: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>管理员入口</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>输入 ADMIN_SECRET 继续</div>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              value={secret}
              onChange={e => { setSecret(e.target.value); setAuthErr('') }}
              placeholder="管理员密码"
              style={inputStyle}
            />
            {authErr && <div style={{ color: '#dc2626', fontSize: '13px' }}>{authErr}</div>}
            <button type="submit" style={btnStyle}>进入</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-sans)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>兑换码生成器</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '32px' }}>生成的码存入数据库，每个码全球只能使用一次</div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Plan */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>套餐类型</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PLANS.map(p => (
                  <div
                    key={p.value}
                    onClick={() => setPlan(p.value)}
                    style={{
                      padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${plan === p.value ? '#0789ec' : '#e2e8f0'}`,
                      background: plan === p.value ? '#e0f0fd' : 'white',
                      fontSize: '13.5px', fontWeight: plan === p.value ? 700 : 400,
                      color: plan === p.value ? '#0789ec' : '#334155',
                      transition: 'all 0.15s',
                    }}
                  >{p.label}</div>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                生成数量
                <span style={{ fontWeight: 400, marginLeft: '6px', color: '#94a3b8' }}>（最多 500 个）</span>
              </label>
              <input
                type="number"
                min={1} max={500}
                value={count}
                onChange={e => setCount(Math.max(1, Math.min(500, Number(e.target.value))))}
                style={inputStyle}
              />
            </div>

            {/* Label */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                备注标签
                <span style={{ fontWeight: 400, marginLeft: '6px', color: '#94a3b8' }}>（可选，用户兑换成功时显示）</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="例如：内测体验码、新用户专享"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? '生成中…' : `生成 ${count} 个${PLANS.find(p => p.value === plan)?.label ?? ''}`}
            </button>
          </form>
        </div>

        {/* Results */}
        {codes.length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>生成成功 ✓</span>
                <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>{codes.length} 个码</span>
              </div>
              <button
                onClick={copyAll}
                style={{
                  padding: '7px 16px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                  background: copied ? '#f0fdf4' : 'white', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '13px',
                  color: copied ? '#16a34a' : '#334155', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ 已复制' : '全部复制'}
              </button>
            </div>
            <div style={{
              background: '#f8fafc', borderRadius: '8px', padding: '14px 16px',
              border: '1px solid #e2e8f0', maxHeight: '320px', overflowY: 'auto',
            }}>
              {codes.map(c => (
                <div
                  key={c}
                  onClick={() => copyText(c)}
                  style={{
                    fontFamily: 'monospace', fontSize: '14px', color: '#0f172a',
                    padding: '5px 0', borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', letterSpacing: '0.5px',
                  }}
                  title="点击复制"
                >{c}</div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>点击单个码可复制</div>
          </div>
        )}
      </div>
    </div>
  )
}
