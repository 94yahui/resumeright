'use client'
import { useState } from 'react'
import { GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { StudentModal } from '../editor/components/Modals'
import { getDeviceId } from '../lib/payment'

export default function GradPromo() {
  const [open, setOpen] = useState(false)
  const [studentOpen, setStudentOpen] = useState(false)
  const [verified, setVerified] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <>
      <div style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'stretch',
        width: open ? '268px' : '30px',
        overflow: 'hidden',
        borderRadius: '10px 0 0 10px',
        background: 'var(--teal)',
        boxShadow: '-3px 0 20px rgba(13,148,136,0.4)',
        transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: open ? 'default' : 'pointer',
      }}
        onClick={!open ? () => setOpen(true) : undefined}
      >
        {/* Expanded content — visible when open */}
        <div style={{
          flex: 1,
          minWidth: 0,
          padding: '22px 16px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
          transitionDelay: open ? '0.15s' : '0s',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={16} color="rgba(255,255,255,0.9)" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>毕业季特惠</span>
            <button
              onClick={() => setDismissed(true)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', padding: '2px',
                transition: 'color 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            ><X size={13} /></button>
          </div>

          {/* Offer box */}
          <div style={{
            background: 'rgba(0,0,0,0.18)',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fde68a', lineHeight: 1.15, marginBottom: '3px', whiteSpace: 'nowrap' }}>
              全场 5 折
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
              学生邮箱认证，立即享受折扣
            </div>
          </div>

          {!verified ? (
            <button
              onClick={() => setStudentOpen(true)}
              style={{
                padding: '8px 14px', borderRadius: '7px', border: 'none',
                background: '#fbbf24', color: '#1a1a1a',
                fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s',
                whiteSpace: 'nowrap', alignSelf: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >立即认证 →</button>
          ) : (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ✓ 已认证，结算时自动享折扣
            </div>
          )}
        </div>

        {/* Tab strip — always 30px on the right */}
        <div
          onClick={open ? () => setOpen(false) : undefined}
          style={{
            width: '30px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '16px 0',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <GraduationCap size={14} color="white" />
          <span style={{
            fontSize: '9.5px', fontWeight: 700, color: 'white',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            letterSpacing: '1.5px', lineHeight: 1,
          }}>学生优惠</span>
          <div style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center' }}>
            {open ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
          </div>
        </div>
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
