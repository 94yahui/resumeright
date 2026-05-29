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

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '32px 28px', width: '100%', maxWidth: '360px',
        textAlign: 'center', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        {/* close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'none', border: 'none', fontSize: '20px',
            cursor: 'pointer', color: '#999', lineHeight: 1,
          }}
        >×</button>

        {success ? (
          <div style={{ padding: '24px 0', color: '#22c55e', fontSize: '18px', fontWeight: 600 }}>
            ✓ 登录成功！
          </div>
        ) : (
          <>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
              微信登录
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
              关注公众号后发送「登录」获取验证码
            </div>

            {/* QR code */}
            <div style={{
              display: 'inline-block', padding: '8px', border: '1px solid #e8e8e8',
              borderRadius: '10px', marginBottom: '8px',
            }}>
              <Image src="/wechat_qrcode.jpg" alt="公众号二维码" width={140} height={140}
                style={{ borderRadius: '6px', display: 'block' }} />
            </div>

            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
              扫码关注「简力全开」后，发送
              <span style={{ color: '#111', fontWeight: 600, margin: '0 4px' }}>登录</span>
              获取6位验证码
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="输入6位数字验证码"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `1.5px solid ${error ? '#f87171' : '#d1d5db'}`,
                  borderRadius: '8px', padding: '11px 14px',
                  fontSize: '18px', fontWeight: 600, letterSpacing: '4px',
                  textAlign: 'center', outline: 'none',
                  fontFamily: 'monospace',
                  marginBottom: error ? '6px' : '12px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#111')}
                onBlur={e => (e.currentTarget.style.borderColor = error ? '#f87171' : '#d1d5db')}
              />
              {error && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  width: '100%', background: loading || code.length !== 6 ? '#d1d5db' : '#111',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '11px', fontSize: '15px', fontWeight: 600,
                  cursor: loading || code.length !== 6 ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? '验证中…' : '登录'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
