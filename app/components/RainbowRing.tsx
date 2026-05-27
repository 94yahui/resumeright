'use client'
import { useEffect, useState } from 'react'

interface Props {
  score: number    // 0–10
  size?: number
  innerBg?: string
  animate?: boolean
}

export default function RainbowRing({ score, size = 110, innerBg = '#fff', animate = false }: Props) {
  const thickness = Math.max(6, Math.round(size * 0.088))   // thinner
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2

  // 270° sweep: score 0 at 225° (7 o'clock), score 10 at 135° (5 o'clock)
  const sweepAngle = (score / 10) * 270
  const [displaySweep, setDisplaySweep] = useState(animate ? 0 : sweepAngle)

  useEffect(() => {
    if (!animate) { setDisplaySweep(sweepAngle); return }
    setDisplaySweep(0)
    const t = setTimeout(() => setDisplaySweep(sweepAngle), 80)
    return () => clearTimeout(t)
  }, [animate, sweepAngle])

  // CSS rotation angle for the orbiting dot
  const dotCSSAngle = 225 + displaySweep
  // Dot larger than ring thickness
  const dotSize = Math.max(10, Math.round(thickness * 1.8))

  const isDark = innerBg !== '#fff' && innerBg !== 'white' && innerBg !== '#ffffff'
  const textColor = isDark ? '#fff' : '#0f172a'
  const subColor  = isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'

  // Rounded cap positions (start=225°, end=135°)
  const capPos = (deg: number) => {
    const rad = deg * Math.PI / 180
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
  }
  const startCap = capPos(225)
  const endCap   = capPos(135)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Rainbow arc + 90° gap */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: `conic-gradient(from 135deg,
          ${innerBg} 0deg, ${innerBg} 90deg,
          #ef4444 90deg, #f97316 135deg, #eab308 180deg,
          #22c55e 225deg, #06b6d4 270deg, #6366f1 315deg, #6366f1 360deg
        )`,
      }} />

      {/* Slightly-rounded caps at arc ends */}
      <div style={{ position: 'absolute', width: thickness, height: thickness, borderRadius: '3px', background: '#ef4444', left: startCap.x - thickness / 2, top: startCap.y - thickness / 2 }} />
      <div style={{ position: 'absolute', width: thickness, height: thickness, borderRadius: '3px', background: '#6366f1', left: endCap.x - thickness / 2, top: endCap.y - thickness / 2 }} />

      {/* Donut hole */}
      <div style={{
        position: 'absolute', inset: thickness, borderRadius: '50%', background: innerBg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: Math.round(size * 0.37), fontWeight: 700, color: textColor, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: Math.round(size * 0.12), color: subColor, lineHeight: 1, marginTop: 2 }}>/10</div>
      </div>

      {/* Orbiting dot (animates along the arc) */}
      <div style={{
        position: 'absolute',
        left: cx, top: cy,
        width: 0, height: 0,
        transform: `rotate(${dotCSSAngle}deg) translateY(-${r}px)`,
        transition: animate ? 'transform 1.3s cubic-bezier(0.4,0,0.2,1)' : 'none',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute',
          width: dotSize, height: dotSize,
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${isDark ? 'rgba(255,255,255,0.5)' : '#334155'}`,
          left: -dotSize / 2, top: -dotSize / 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}
