'use client'
import { useState, useEffect, useRef } from 'react'
import { GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { StudentModal } from '../editor/components/Modals'
import { getDeviceId } from '../lib/payment'
import { useAuth } from '../hooks/useAuth'

export default function GradPromo({ onLoginRequest }: { onLoginRequest: (afterLogin: () => void) => void }) {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const [studentOpen, setStudentOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // When logged in, trust server; when logged out, widget should always show
  const isVerified = auth.loggedIn && !auth.loading ? auth.isStudent : false

  // Collapse when clicking outside (skip when modal is open to avoid misfire)
  useEffect(() => {
    if (!open || studentOpen) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open, studentOpen])

  if (dismissed || isVerified) return null

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 500,
          width: open ? '268px' : '30px',
          overflow: 'hidden',
          borderRadius: '10px 0 0 10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
          transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{
          background: '#00afb9',
          minHeight: '160px',
          position: 'relative',
        }}>
          {/* Expanded content — right margin reserves space for the always-visible tab strip */}
          <div style={{
            marginRight: '30px',
            padding: '22px 14px 20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            opacity: open ? 1 : 0,
            transition: 'opacity 0.2s ease',
            transitionDelay: open ? '0.18s' : '0s',
            pointerEvents: open ? 'auto' : 'none',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GraduationCap size={16} color="rgba(255,255,255,0.9)" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>毕业季特惠</span>
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
                在校学生认证，立即享受折扣
              </div>
            </div>

            <button
              onClick={() => {
                if (!auth.loggedIn) {
                  onLoginRequest(() => setStudentOpen(true))
                  return
                }
                setStudentOpen(true)
              }}
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
            >立即认证</button>
          </div>

          {/* Tab strip — absolutely pinned to right edge, always visible regardless of panel width */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Close button — always at top of strip */}
            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', padding: '8px 0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              title="关闭"
            ><X size={12} /></button>
            {/* Toggle area */}
            <div
              onClick={() => setOpen(o => !o)}
              style={{
                flex: 1, width: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '7px', cursor: 'pointer', userSelect: 'none',
                padding: '8px 0 16px',
              }}
            >
              <GraduationCap size={14} color="white" />
              <span style={{
                fontSize: '10px', fontWeight: 700, color: 'white',
                writingMode: 'vertical-rl', textOrientation: 'mixed',
                letterSpacing: '1.5px', lineHeight: 1,
              }}>学生优惠</span>
              <div style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center' }}>
                {open ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {studentOpen && (
        <StudentModal
          deviceId={getDeviceId()}
          onClose={() => setStudentOpen(false)}
          onSuccess={() => {
            setStudentOpen(false)
            auth.refresh()
            window.dispatchEvent(new CustomEvent('rc:studentVerified'))
          }}
        />
      )}
    </>
  )
}
