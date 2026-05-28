'use client'
import { useState } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { StudentModal } from '../editor/components/Modals'
import { getDeviceId } from '../lib/payment'

export default function GradPromo() {
  const [open, setOpen] = useState(true)
  const [studentOpen, setStudentOpen] = useState(false)
  const [verified, setVerified] = useState(false)

  if (!open) return null

  return (
    <>
      <div style={{
        background: 'linear-gradient(90deg, #1a2744 0%, #0f3460 50%, #1a2744 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '12px', flexWrap: 'wrap', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={16} color="#fbbf24" />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
            🎓 <strong>毕业季特惠</strong>：学生认证立享全场 <strong style={{ color: '#fbbf24' }}>5 折</strong> 优惠
          </span>
        </div>
        {!verified && (
          <button
            onClick={() => setStudentOpen(true)}
            style={{
              padding: '5px 14px', borderRadius: '6px', border: 'none',
              background: '#fbbf24', color: '#1a1a1a',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', flexShrink: 0,
            }}
          >立即认证 →</button>
        )}
        {verified && (
          <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>✓ 已认证，结算时自动享折扣</span>
        )}
        <button
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', padding: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        ><X size={14} /></button>
      </div>

      {studentOpen && (
        <StudentModal
          deviceId={getDeviceId()}
          onClose={() => setStudentOpen(false)}
          onSuccess={() => { setVerified(true); setStudentOpen(false) }}
        />
      )}
    </>
  )
}
