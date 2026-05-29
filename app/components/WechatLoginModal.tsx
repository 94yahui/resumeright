'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type Phase = 'loading' | 'ready' | 'expired' | 'success'

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
  const [phase, setPhase] = useState<Phase>('loading')
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(600)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeRef = useRef('')

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const startSession = useCallback(async () => {
    setPhase('loading')
    setSecondsLeft(600)
    clearTimers()
    try {
      const res = await fetch('/api/wechat/login-session', { method: 'POST' })
      const data = await res.json()
      codeRef.current = data.code
      setCode(data.code)
      setSecondsLeft(data.expires_in)
      setPhase('ready')

      // countdown
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearTimers()
            setPhase('expired')
            return 0
          }
          return s - 1
        })
      }, 1000)

      // poll
      const deviceId = getDeviceId()
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/wechat/login-session?code=${codeRef.current}&device_id=${deviceId}`)
          const d = await r.json()
          if (d.status === 'authenticated') {
            clearTimers()
            setPhase('success')
            setTimeout(() => { onSuccess() }, 1200)
          } else if (d.status === 'expired' || d.status === 'not_found') {
            clearTimers()
            setPhase('expired')
          }
        } catch { /* ignore network errors, keep polling */ }
      }, 2000)
    } catch {
      setPhase('expired')
    }
  }, [onSuccess])

  useEffect(() => {
    startSession()
    return clearTimers
  }, [startSession])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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

        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '6px' }}>
          微信登录
        </div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
          关注公众号后发送登录码即可登录
        </div>

        {/* QR code */}
        <div style={{
          display: 'inline-block', padding: '8px', border: '1px solid #e8e8e8',
          borderRadius: '10px', marginBottom: '16px',
        }}>
          <Image src="/wechat_qrcode.jpg" alt="公众号二维码" width={140} height={140}
            style={{ borderRadius: '6px', display: 'block' }} />
        </div>

        {phase === 'loading' && (
          <div style={{ color: '#888', fontSize: '14px' }}>正在生成登录码…</div>
        )}

        {phase === 'ready' && (
          <>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
              扫码关注「简力全开」后，发送以下登录码：
            </div>
            <div style={{
              display: 'inline-block',
              background: '#f4f4f5', borderRadius: '8px',
              padding: '10px 20px', marginBottom: '10px',
              fontSize: '22px', fontWeight: 700, letterSpacing: '2px',
              color: '#111', fontFamily: 'monospace',
              cursor: 'pointer', userSelect: 'all',
            }}
              title="点击复制"
              onClick={() => navigator.clipboard?.writeText(code)}
            >{code}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              登录码 {fmt(secondsLeft)} 后过期
            </div>
          </>
        )}

        {phase === 'expired' && (
          <>
            <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '12px' }}>
              登录码已过期
            </div>
            <button
              onClick={startSession}
              style={{
                background: '#111', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '9px 24px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >重新获取</button>
          </>
        )}

        {phase === 'success' && (
          <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: 600 }}>
            ✓ 登录成功！
          </div>
        )}
      </div>
    </div>
  )
}
