'use client'
import { useState } from 'react'
import { GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { StudentModal } from '../editor/components/Modals'
import { getDeviceId } from '../lib/payment'

export default function GradPromo() {
  const [panelOpen, setPanelOpen] = useState(false)
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
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 500,
      }}>
        {/* Slide-out panel */}
        <div style={{
          width: panelOpen ? '260px' : '0px',
          overflow: 'hidden',
          transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}>
          <div style={{
            width: '260px',
            background: 'linear-gradient(160deg, #14532d 0%, #166534 60%, #15803d 100%)',
            borderRadius: '16px 0 0 16px',
            padding: '24px 20px 20px',
            boxShadow: '-6px 0 32px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#86efac" />
              <span style={{ color: '#86efac', fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>毕业季特惠</span>
              <button
                onClick={() => setDismissed(true)}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'rgba(134,239,172,0.5)',
                  display: 'flex', alignItems: 'center', padding: '2px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(134,239,172,0.9)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(134,239,172,0.5)' }}
              ><X size={13} /></button>
            </div>

            {/* Offer highlight */}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid rgba(134,239,172,0.2)',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fde68a', lineHeight: 1.1, marginBottom: '4px' }}>
                全场 5 折
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                学生邮箱认证，立即享受折扣<br />Pro 会员所有功能全部解锁
              </div>
            </div>

            {!verified ? (
              <button
                onClick={() => setStudentOpen(true)}
                style={{
                  padding: '9px 16px', borderRadius: '8px', border: 'none',
                  background: '#fbbf24', color: '#1a1a1a',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >立即认证 →</button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: '#86efac', fontWeight: 600,
              }}>
                <span style={{ fontSize: '16px' }}>✓</span> 已认证，结算时自动享折扣
              </div>
            )}
          </div>
        </div>

        {/* Tab */}
        <div
          onClick={() => setPanelOpen(o => !o)}
          style={{
            width: '30px',
            background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '8px 0 0 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '18px 0',
            boxShadow: '-3px 0 16px rgba(34,197,94,0.35)',
            userSelect: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' }}
        >
          <GraduationCap size={15} color="white" />
          <span style={{
            fontSize: '10px', fontWeight: 700, color: 'white',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            letterSpacing: '1.5px', lineHeight: 1,
          }}>学生优惠</span>
          <div style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center' }}>
            {panelOpen ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
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
