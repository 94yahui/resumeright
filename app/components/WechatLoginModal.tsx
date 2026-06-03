'use client'
import React, { useState, useRef, FormEvent } from 'react'
import Image from 'next/image'
import { BottomSheet, PrivacyContent, TermsContent } from './PolicySheets'

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
  const [code, setCode]             = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [showCode, setShowCode]     = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showPolicy, setShowPolicy] = useState<null | 'privacy' | 'terms'>(null)
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

  const canSubmit = code.length === 6 && !loading && privacyAgreed

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
            background: 'linear-gradient(180deg, var(--highlight) 0%, var(--paper) 100%)',
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

            <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5 }}>
              扫码关注「简力全开」后，发送
              <span style={{ fontWeight: 700, margin: '0 2px' }}>登录</span>
              获取验证码
            </div>
          </div>

          {/* ── White body ── */}
          <div style={{ padding: '20px 20px 24px' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#07C160', fontSize: '17px', fontWeight: 600 }}>
                登录成功！
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ position: 'relative', marginBottom: error ? '5px' : '12px' }}>
                  <input
                    ref={inputRef}
                    className="login-code-input"
                    type={showCode ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="输入6位数字验证码"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: `1.5px solid ${error ? '#f87171' : '#d1d5db'}`,
                      borderRadius: '8px', padding: '10px 44px 10px 14px',
                      fontSize: '20px', fontWeight: 700, letterSpacing: '5px',
                      textAlign: 'center', outline: 'none',
                      fontFamily: 'monospace',
                      marginBottom: 0,
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#07C160')}
                    onBlur={e => (e.currentTarget.style.borderColor = error ? '#f87171' : '#d1d5db')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px', color: '#9ca3af', lineHeight: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showCode ? '隐藏验证码' : '显示验证码'}
                  >
                    {showCode ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>
                    {error}
                  </div>
                )}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  marginBottom: '12px', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={e => setPrivacyAgreed(e.target.checked)}
                    style={{ marginTop: '2px', flexShrink: 0, accentColor: '#07C160', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#6b7280', lineHeight: 1.5 }}>
                    我已阅读并同意{' '}
                    <button type="button"
                      style={{ color: '#07C160', textDecoration: 'none', background: 'none', border: 'none', padding: 0, fontSize: '11.5px', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={e => { e.stopPropagation(); setShowPolicy('privacy') }}
                    >隐私政策</button>
                    {' '}和{' '}
                    <button type="button"
                      style={{ color: '#07C160', textDecoration: 'none', background: 'none', border: 'none', padding: 0, fontSize: '11.5px', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={e => { e.stopPropagation(); setShowPolicy('terms') }}
                    >用户协议</button>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    width: '100%',
                    background: canSubmit ? 'var(--highlight)' : '#d1d5db',
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

      {/* ── Policy sheets (shared with Footer) ── */}
      <BottomSheet open={showPolicy === 'privacy'} title="隐私政策" onClose={() => setShowPolicy(null)} zIndex={1100}>
        <PrivacyContent />
      </BottomSheet>
      <BottomSheet open={showPolicy === 'terms'} title="用户协议" onClose={() => setShowPolicy(null)} zIndex={1100}>
        <TermsContent />
      </BottomSheet>
    </>
  )
}
