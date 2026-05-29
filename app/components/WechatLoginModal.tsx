'use client'
import { useState, useRef, FormEvent } from 'react'
import Image from 'next/image'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('rc_device_id')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    localStorage.setItem('rc_device_id', id)
  }
  return id
}

export default function WechatLoginModal({ onClose, onSuccess }: Props) {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      setError('请输入6位数字登录码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, device_id: getDeviceId() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '验证失败，请重试')
        setLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(() => onSuccess(), 1000)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  const canSubmit = code.length === 6 && !loading

  return (
    <>
      {/* Suppress autofill/placeholder size via scoped style */}
      <style>{`
        .login-code-input::placeholder { font-size: 13px; letter-spacing: 0; font-weight: 400; }
      `}</style>

      <div
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div style={{
          width: '100%', maxWidth: '340px',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          background: '#fff',
        }}>

          {/* ── Green gradient header ── */}
          <div style={{
            background: 'linear-gradient(180deg, #07C160 0%, rgba(7,193,96,0.08) 100%)',
            padding: '18px 20px 28px',
            textAlign: 'center',
            position: 'relative',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '12px', right: '14px',
                background: 'none', border: 'none', fontSize: '20px',
                cursor: 'pointer', color: 'rgba(255,255,255,0.75)', lineHeight: 1,
              }}
            >×</button>

            <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>
              微信登录
            </div>

            <div style={{
              display: 'inline-block', padding: '7px',
              background: '#fff', borderRadius: '10px',
              marginBottom: '10px',
            }}>
              <Image
                src="/wechat_qrcode.jpg" alt="公众号二维码"
                width={128} height={128}
                style={{ borderRadius: '5px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
              扫码关注「简力全开」后，发送
              <span style={{ fontWeight: 700, margin: '0 2px' }}>登录</span>
              获取验证码
            </div>
          </div>

          {/* ── White body ── */}
          <div style={{ padding: '20px 20px 24px' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#07C160', fontSize: '17px', fontWeight: 600 }}>
                ✓ 登录成功！
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  className="login-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  placeholder="输入6位数字验证码"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: `1.5px solid ${error ? '#f87171' : '#d1d5db'}`,
                    borderRadius: '8px', padding: '10px 14px',
                    fontSize: '20px', fontWeight: 700, letterSpacing: '5px',
                    textAlign: 'center', outline: 'none',
                    fontFamily: 'monospace',
                    marginBottom: error ? '5px' : '12px',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#07C160')}
                  onBlur={e => (e.currentTarget.style.borderColor = error ? '#f87171' : '#d1d5db')}
                />
                {error && (
                  <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    width: '100%',
                    background: canSubmit ? 'var(--theme-blue)' : '#d1d5db',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '11px', fontSize: '15px', fontWeight: 600,
                    cursor: canSubmit ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? '验证中…' : '登录'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
