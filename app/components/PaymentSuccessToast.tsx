'use client'
import { useEffect, useState } from 'react'

const PLAN_LABEL: Record<string, string> = {
  monthly:   '月卡',
  quarterly: '季卡',
  yearly:    '年卡',
  trial7:    '7天体验卡',
}

export default function PaymentSuccessToast() {
  const [visible, setVisible] = useState(false)
  const [label, setLabel]     = useState('')

  useEffect(() => {
    function onSuccess(e: Event) {
      const plan = (e as CustomEvent<{ plan?: string }>).detail?.plan ?? ''
      setLabel(PLAN_LABEL[plan] ? `${PLAN_LABEL[plan]}已激活` : '会员权益已激活')
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(t)
    }
    window.addEventListener('rc:payment_success', onSuccess)
    return () => window.removeEventListener('rc:payment_success', onSuccess)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#0f172a',
      color: 'white',
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.12)',
      animation: 'toast-in 0.25s ease',
    }}>
      <span style={{ fontSize: '18px' }}>🎉</span>
      <span>支付成功！{label}</span>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)', fontSize: '16px',
          padding: '0 0 0 8px', lineHeight: 1,
        }}
      >×</button>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
