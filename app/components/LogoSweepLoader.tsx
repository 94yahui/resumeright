'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface Props {
  message?: string
}

export default function LogoSweepLoader({ message = 'AI 正在分析你的简历' }: Props) {
  const sweepRef  = useRef<HTMLDivElement>(null)
  const breathRef = useRef<HTMLDivElement>(null)
  const dotsRef   = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf: number
    let t0: number | null = null

    const SWEEP_MS  = 2400
    const BREATH_MS = 2800
    const TAIL_DEG  = 130

    function frame(ts: number) {
      if (!t0) t0 = ts
      const dt = ts - t0

      const angle  = (dt / SWEEP_MS * 360) % 360
      const breath = 0.84 + 0.16 * Math.sin(dt / BREATH_MS * Math.PI * 2)

      if (sweepRef.current) {
        const stop = 360 - TAIL_DEG
        const mid  = 360 - TAIL_DEG * 0.38
        const mask =
          `conic-gradient(from ${angle}deg,` +
          ` black 0deg,` +
          ` rgba(0,0,0,0.55) 7deg,` +
          ` transparent 22deg,` +
          ` transparent ${stop}deg,` +
          ` rgba(0,0,0,0.08) ${stop}deg,` +
          ` rgba(0,0,0,0.42) ${mid}deg,` +
          ` rgba(0,0,0,0.82) 360deg` +
          `)`
        sweepRef.current.style.webkitMaskImage = mask
        sweepRef.current.style.maskImage        = mask
      }

      if (breathRef.current) {
        breathRef.current.style.opacity = String(breath)
      }

      raf = requestAnimationFrame(frame)
    }

    let dotN = 0
    const dotTimer = setInterval(() => {
      dotN = (dotN + 1) % 4
      if (dotsRef.current) dotsRef.current.textContent = '.'.repeat(dotN)
    }, 480)

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(dotTimer)
    }
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '28px', padding: '40px 24px',
    }}>
      <style>{`
        @keyframes sweepOuterRing {
          0%, 100% { opacity: 0.20; transform: scale(1); }
          50%       { opacity: 0.52; transform: scale(1.05); }
        }
        @keyframes sweepInnerRing {
          0%, 100% { opacity: 0.10; }
          50%       { opacity: 0.28; }
        }
      `}</style>

      {/* Breathing wrapper */}
      <div ref={breathRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: '160px', height: '160px',
          borderRadius: '50%',
          border: '1.5px solid rgba(120, 170, 255, 0.55)',
          animation: 'sweepOuterRing 2.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: '128px', height: '128px',
          borderRadius: '50%',
          border: '1px solid rgba(140, 190, 255, 0.35)',
          animation: 'sweepInnerRing 2.8s ease-in-out infinite',
          animationDelay: '-0.5s',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '92px', height: '92px', position: 'relative' }}>
          {/* Dim ghost layer */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo-white.png" alt="简力全开" width={76} height={76}
              style={{ objectFit: 'contain', display: 'block' }} priority />
          </div>
          {/* Swept bright layer */}
          <div ref={sweepRef} style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo-white.png" alt="" aria-hidden width={76} height={76}
              style={{ objectFit: 'contain', display: 'block' }} priority />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          color: 'rgba(255,255,255,0.88)', fontSize: '15px', fontWeight: 500,
          fontFamily: "'Inter','Noto Sans SC',sans-serif",
          margin: 0, letterSpacing: '0.3px',
        }}>
          {message}<span ref={dotsRef} style={{ display: 'inline-block', minWidth: '26px', textAlign: 'left' }} />
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.34)', fontSize: '12px',
          fontFamily: "'Inter','Noto Sans SC',sans-serif",
          margin: '10px 0 0',
        }}>加速处理中</p>
      </div>
    </div>
  )
}
