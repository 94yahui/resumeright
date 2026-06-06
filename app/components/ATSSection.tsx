'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { getDeviceId } from '../lib/payment'
import { useAuth } from '../hooks/useAuth'

const SUB_PLANS = new Set(['monthly', 'quarterly', 'yearly', 'trial7'])
function isActiveSub(plan?: string | null, expiresAt?: number): boolean {
  if (!plan || !SUB_PLANS.has(plan)) return false
  if (expiresAt != null && expiresAt <= Date.now()) return false
  return true
}

interface ATSDimension { key: string; name: string; score: number; feedback: string }
interface ATSResult {
  name: string; jobtitle: string; totalScore: number; overview: string
  dimensions: ATSDimension[]
}

// ── Progress bar loading ──────────────────────────────────────────────────────
const PHASES = [
  { at: 0,  label: '读取简历内容…' },
  { at: 12, label: '提取文字内容…' },
  { at: 28, label: '检测编码规范…' },
  { at: 44, label: '分析版面结构…' },
  { at: 60, label: '识别字段信息…' },
  { at: 74, label: '检测文件格式…' },
  { at: 88, label: '生成分析报告…' },
]

function LoadingState({ apiDone, onComplete, filename }: {
  apiDone: boolean; onComplete: () => void; filename: string
}) {
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState('读取简历内容…')
  const progressRef = useRef(0)
  const apiDoneRef = useRef(false)
  const completedRef = useRef(false)

  useEffect(() => { apiDoneRef.current = apiDone }, [apiDone])

  useEffect(() => {
    const PAUSE_AT = 92  // wait here until API responds
    const timer = setInterval(() => {
      const cur = progressRef.current
      const done = apiDoneRef.current

      let next: number
      if (done && cur >= 85) {
        next = Math.min(100, cur + 2.5)  // sprint to finish
      } else if (!done && cur >= PAUSE_AT) {
        next = cur  // hold until API ready
      } else {
        // Ease-out: fast start, slow finish
        const step = cur < 25 ? 0.7 : cur < 55 ? 0.4 : cur < 78 ? 0.22 : 0.12
        next = Math.min(PAUSE_AT, cur + step)
      }

      progressRef.current = next
      setProgress(Math.floor(next))

      // Update label
      const phase = [...PHASES].reverse().find(p => next >= p.at)
      if (phase) setLabel(phase.label)

      // Complete
      if (next >= 100 && !completedRef.current) {
        completedRef.current = true
        clearInterval(timer)
        setTimeout(onComplete, 350)
      }
    }, 80)
    return () => clearInterval(timer)
  }, [onComplete])

  const scoreColor = '#0789ec'

  return (
    <div style={{ padding: '64px 24px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
        正在分析：{filename}
      </div>
      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>{label}</div>

      {/* Progress bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${scoreColor}, #0f5fc2)`,
            borderRadius: '9999px',
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 0 10px rgba(7,137,236,0.4)',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
        <span>{progress}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ── Radar chart ───────────────────────────────────────────────────────────────
function RadarChart({ dimensions }: { dimensions: ATSDimension[] }) {
  const cx = 240, cy = 240, R = 170, N = dimensions.length
  const toXY = (i: number, r: number) => ({
    x: cx + r * Math.cos(Math.PI * (-0.5 + 2 * i / N)),
    y: cy + r * Math.sin(Math.PI * (-0.5 + 2 * i / N)),
  })
  const poly = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const outer = dimensions.map((_, i) => toXY(i, R))
  const data  = dimensions.map((d, i) => toXY(i, R * d.score / 20))
  const grids = [0.25, 0.5, 0.75, 1].map(f => dimensions.map((_, i) => toXY(i, R * f)))

  return (
    <svg width="480" height="480" viewBox="0 0 480 480" style={{ overflow: 'visible', display: 'block', width: '100%', maxWidth: '480px' }}>
      {grids.map((ring, ri) => <polygon key={ri} points={poly(ring)} fill={ri === 3 ? 'rgba(7,137,236,0.04)' : 'none'} stroke={ri === 3 ? '#bfdbfe' : '#e2e8f0'} strokeWidth={ri === 3 ? 1.5 : 1} />)}
      {outer.map((pt, i) => <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1.5" />)}
      <polygon points={poly(data)} fill="rgba(7,137,236,0.10)" stroke="#0789ec" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r={6} fill="#0789ec" stroke="white" strokeWidth="2.5" />)}
      {dimensions.map((d, i) => {
        const { x, y } = toXY(i, R + 38)
        const cosA = Math.cos(Math.PI * (-0.5 + 2 * i / N))
        const anchor = cosA > 0.15 ? 'start' : cosA < -0.15 ? 'end' : 'middle'
        return (
          <g key={i}>
            <text x={x} y={y - 8} fontSize="14" fill="#64748b" textAnchor={anchor} fontFamily="var(--font-sans)" fontWeight="500">{d.name}</text>
            <text x={x} y={y + 12} fontSize="18" fill="#0f172a" textAnchor={anchor} fontFamily="var(--font-sans)" fontWeight="800">
              {d.score}<tspan fontSize="12" fill="#94a3b8" fontWeight="400">/20</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Dimension card ────────────────────────────────────────────────────────────
function DimCard({ dim }: { dim: ATSDimension }) {
  const pct = dim.score / 20
  const color = pct >= 0.8 ? '#16a34a' : pct >= 0.6 ? '#d97706' : '#dc2626'
  const bg    = pct >= 0.8 ? '#f0fdf4' : pct >= 0.6 ? '#fffbeb' : '#fef2f2'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '14px 16px', background: 'white',
      borderRadius: '12px', border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ flexShrink: 0, background: bg, borderRadius: '10px', padding: '8px 12px', textAlign: 'center', minWidth: '62px' }}>
        <div style={{ fontSize: '26px', fontWeight: 900, color, lineHeight: 1.1 }}>{dim.score}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>/ 20</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{dim.name}</div>
        <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>{dim.feedback}</div>
      </div>
    </div>
  )
}

// ── Upload card ───────────────────────────────────────────────────────────────
function UploadCard({ onFile, hintText, exhausted, exhaustedMsg, needLogin, onLoginRequest }: {
  onFile: (f: File) => void; hintText: string
  exhausted?: boolean; exhaustedMsg?: string
  needLogin?: boolean; onLoginRequest?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  // For not-logged-in exhausted: show hint + login button only after first click
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleButtonClick = () => {
    if (exhausted && needLogin) { setShowLoginPrompt(true); return }
    if (exhausted) return  // logged-in exhausted: do nothing
    inputRef.current?.click()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (exhausted) { if (needLogin) setShowLoginPrompt(true); return }
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile, exhausted, needLogin])

  // After login prompt is shown, the button becomes "登录/注册"
  const showLoginButton = showLoginPrompt && needLogin

  return (
    <div onDragOver={e => { e.preventDefault(); if (!exhausted) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
      className="ats-upload-card"
      style={{
        background: dragging ? '#f0f9ff' : 'white', borderRadius: '24px',
        padding: '44px 40px 40px',
        boxShadow: '0 8px 40px rgba(7,137,236,0.10), 0 2px 12px rgba(0,0,0,0.06)',
        transition: 'background 0.15s',
        border: dragging ? '1.5px solid #0789ec' : '1.5px solid rgba(226,232,240,0.8)',
        minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px', lineHeight: 1.35 }}>
        测一测你的简历能否通过<br />大厂自动筛选？
      </h3>
      <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.8, margin: '0 0 32px' }}>
        从<span style={{ color: '#0789ec', fontWeight: 600 }}>文字提取、编码规范、版面结构、字段识别、文件格式</span>五个 ATS 技术角度检测兼容性
      </p>

      {showLoginButton ? (
        /* ── After clicking with exhausted guest: login button ── */
        <button onClick={onLoginRequest} style={{
          width: '100%', padding: '16px 24px', borderRadius: '9999px', fontSize: '16px', fontWeight: 700,
          background: 'linear-gradient(135deg, #0789ec, #0f5fc2)', color: 'white', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', boxShadow: '0 4px 14px rgba(7,137,236,0.35)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(7,137,236,0.45)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(7,137,236,0.35)' }}
        >登录</button>
      ) : (
        /* ── Normal / logged-in exhausted: upload button ── */
        <button onClick={handleButtonClick} style={{
          width: '100%', padding: '16px 24px', borderRadius: '9999px', fontSize: '16px', fontWeight: 700,
          background: exhausted && !needLogin ? '#cbd5e1' : 'linear-gradient(135deg, #0789ec, #0f5fc2)',
          color: 'white', border: 'none',
          cursor: exhausted && !needLogin ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: exhausted && !needLogin ? 'none' : '0 4px 14px rgba(7,137,236,0.35)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { if (!(exhausted && !needLogin)) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(7,137,236,0.45)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; if (!(exhausted && !needLogin)) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(7,137,236,0.35)' }}
        >上传你的简历</button>
      )}

      {/* ── Inline hint: shown after guest clicks with exhausted quota, or always for logged-in exhausted ── */}
      {((showLoginPrompt && needLogin) || (exhausted && !needLogin)) && exhaustedMsg && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
          background: '#fff7ed', border: '1px solid #fed7aa',
          fontSize: '13px', color: '#9a3412', lineHeight: 1.6, textAlign: 'center',
        }}>
          {exhaustedMsg}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'center', lineHeight: 1.7 }}>
        支持 PDF、Word（.docx）· 不超过 5 MB<br />{hintText}
      </div>
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────
function Results({ result, onReset, onGoEditor, goingToEditor }: {
  result: ATSResult; onReset: () => void
  onGoEditor: () => void; goingToEditor: boolean
}) {
  const scoreColor = result.totalScore >= 80 ? '#16a34a' : result.totalScore >= 60 ? '#d97706' : '#dc2626'
  const scoreLabel = result.totalScore >= 80 ? '优秀' : result.totalScore >= 60 ? '良好' : '待改善'
  return (
    <>
      {/* Constrained top */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {result.name && <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '5px' }}>{result.name}</div>}
          {result.jobtitle && <div style={{ fontSize: '16px', fontWeight: 300, color: '#64748b', letterSpacing: '0.3px' }}>{result.jobtitle}</div>}
          <button onClick={onReset} style={{
            marginTop: '14px', padding: '7px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
            border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>重新检测</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 0', minWidth: '180px', background: 'white', borderRadius: '16px',
            border: '1px solid #e2e8f0', padding: '32px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '88px', fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: '-3px' }}>{result.totalScore}</div>
            <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>/ 100</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: scoreColor, marginTop: '8px' }}>{scoreLabel}</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '12px' }}>ATS 综合评分</div>
          </div>
          <div style={{
            flex: '1 1 0', minWidth: '180px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            borderRadius: '16px', border: '1px solid #dbeafe',
            padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0789ec', marginBottom: '14px' }}>评分说明</div>
            <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.85, margin: 0 }}>{result.overview}</p>
          </div>
        </div>
      </div>

      {/* Bottom: radar 1.8fr + cards 1.2fr, centered */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1.8 1 280px', minWidth: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RadarChart dimensions={result.dimensions} />
          </div>
          <div style={{ flex: '1.2 1 240px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
            {result.dimensions.map(d => <DimCard key={d.key} dim={d} />)}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '28px 24px 0' }}>
        <button onClick={onGoEditor} disabled={goingToEditor} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 36px', borderRadius: '9999px', fontSize: '16px', fontWeight: 700,
          background: goingToEditor ? '#94a3b8' : 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
          color: 'white', border: 'none', cursor: goingToEditor ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)', boxShadow: goingToEditor ? 'none' : '0 4px 20px rgba(220,10,243,0.25)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => { if (!goingToEditor) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
        >
          {goingToEditor ? '加载中…' : '前往编辑器优化简历 →'}
        </button>
      </div>
    </>
  )
}

// ── Quota pre-check ───────────────────────────────────────────────────────────
function getQuotaCheck(auth: ReturnType<typeof useAuth>): { exhausted: boolean; msg: string; needLogin: boolean } {
  if (auth.loading) return { exhausted: false, msg: '', needLogin: false }
  if (!auth.loggedIn) {
    try {
      const deviceId = getDeviceId()
      if (localStorage.getItem(`rc_ats_exhausted_${deviceId}`) === '1') {
        return { exhausted: true, msg: 'ATS 检测免费次数已用完，登录后可再用 2 次，升级 Pro 可享每日 5 次。', needLogin: true }
      }
    } catch {}
    return { exhausted: false, msg: '', needLogin: false }
  }
  const mem = auth.membership as { plan?: string; expires_at?: number } | null | undefined
  const isPro = isActiveSub(mem?.plan, mem?.expires_at)
  if (isPro) {
    if (auth.dailyAtsUsed >= 5)
      return { exhausted: true, msg: '今日 ATS 检测次数已达上限（5 次/天），明天再来吧。', needLogin: false }
  } else if (mem?.plan === 'single') {
    if (auth.singleAtsUsed >= 5)
      return { exhausted: true, msg: '单次购买的 ATS 检测（5 次）已用完，升级 Pro 可享每天 5 次。', needLogin: false }
  } else {
    if (auth.freeAtsUsed >= 2)
      return { exhausted: true, msg: '已用完 2 次免费 ATS 检测，升级 Pro 可享每天 5 次。', needLogin: false }
  }
  return { exhausted: false, msg: '', needLogin: false }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ATSSection({ onLoginRequest }: { onLoginRequest?: () => void }) {
  const auth = useAuth()
  const [phase, setPhase] = useState<'upload' | 'loading' | 'result' | 'error'>('upload')
  const [result, setResult] = useState<ATSResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [filename, setFilename] = useState('')
  const [needLogin, setNeedLogin] = useState(false)
  const [goingToEditor, setGoingToEditor] = useState(false)
  // Track API completion separately from UI phase so progress bar can animate
  const [apiDone, setApiDone] = useState(false)
  const pendingResult = useRef<ATSResult | null>(null)
  const pendingError = useRef<{ msg: string; needLogin: boolean } | null>(null)

  async function handleFile(file: File) {
    setFilename(file.name)
    setPhase('loading')
    setApiDone(false)
    pendingResult.current = null
    pendingError.current = null
    setNeedLogin(false)

    const deviceId = getDeviceId()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('deviceId', deviceId)
    try {
      const res = await fetch('/api/ai/ats-score', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        // Mark guest as exhausted so next click is caught immediately
        if (res.status === 429 && !auth.loggedIn) {
          try { localStorage.setItem(`rc_ats_exhausted_${deviceId}`, '1') } catch {}
        }
        pendingError.current = { msg: data.error || '分析失败，请重试', needLogin: res.status === 429 }
      } else {
        pendingResult.current = data
        // Store parsed resume so editor can pre-fill without a second API call.
        // Always write the entry (even when AI parse failed) so the editor's from_ats
        // handler always runs. Include original filename for use as document title.
        const resumeForEditor = data.parsedData ?? (data.name ? { name: data.name, jobtitle: data.jobtitle || '' } : null)
        console.log('[ATS] parsedData:', data.parsedData, '| resumeForEditor:', resumeForEditor)
        if (resumeForEditor) {
          try {
            sessionStorage.setItem('rc_ats_import', JSON.stringify({
              filename: file.name.replace(/\.[^.]+$/, ''),
              resume: resumeForEditor,
            }))
            console.log('[ATS] sessionStorage written, filename:', file.name)
          } catch {}
        } else {
          console.warn('[ATS] Nothing to store — parsedData null and no name from heuristic')
        }
      }
    } catch {
      pendingError.current = { msg: '网络错误，请稍后重试', needLogin: false }
    }
    setApiDone(true)
  }

  function handleProgressComplete() {
    if (pendingError.current) {
      setErrorMsg(pendingError.current.msg)
      setNeedLogin(pendingError.current.needLogin)
      setPhase('error')
    } else if (pendingResult.current) {
      setResult(pendingResult.current)
      setPhase('result')
    }
  }

  function handleGoEditor() {
    setGoingToEditor(true)
    // parsedData was already stored in sessionStorage during the ATS scan
    window.location.href = '/editor?from_ats=1'
  }

  // Auth-aware hint text
  const mem = auth.membership as { plan?: string; expires_at?: number } | null | undefined
  const isPro = !auth.loading && auth.loggedIn && isActiveSub(mem?.plan, mem?.expires_at)
  const isSingle = !auth.loading && auth.loggedIn && mem?.plan === 'single'
  const hintText = auth.loading
    ? '支持 PDF、Word（.docx）· 不超过 5 MB'
    : !auth.loggedIn
      ? '未登录免费 1 次 · 登录后可用 2 次'
      : isPro
        ? '会员账户 · 每天 5 次 ATS 检测'
        : isSingle
          ? '单次购买 · 共 5 次 ATS 检测'
          : '免费账户 · 共 2 次 ATS 检测（终身）'

  return (
    <section id="ats" style={{ padding: '88px 0', position: 'relative', overflow: 'hidden', background: 'white' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(7,137,236,0.07) 0%, rgba(7,137,236,0.03) 50%, transparent 100%)' }} />
      <div style={{ position: 'absolute', top: '-80px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {phase === 'upload' && (
          <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '56px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
              <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', lineHeight: 1.15 }}>
                你的简历<br />能过大厂筛选吗？
              </h2>
              <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#64748b', lineHeight: 1.8, margin: 0 }}>
                超过 90% 的大公司使用 ATS 自动过滤简历，绝大多数求职者在这一环节出局，却浑然不知。上传简历，AI 实时给出评分与改进建议。
              </p>
            </div>
            <div style={{ flex: '0 1 420px', minWidth: '0', maxWidth: '460px', width: '100%' }}>
              {(() => {
                const check = getQuotaCheck(auth)
                return (
                  <UploadCard
                    onFile={handleFile}
                    hintText={hintText}
                    exhausted={check.exhausted}
                    exhaustedMsg={check.msg}
                    needLogin={check.needLogin}
                    onLoginRequest={onLoginRequest}
                  />
                )
              })()}
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <LoadingState apiDone={apiDone} onComplete={handleProgressComplete} filename={filename} />
        )}

        {phase === 'result' && result && (
          <Results result={result} onReset={() => { setPhase('upload'); setResult(null); setGoingToEditor(false); setApiDone(false) }} onGoEditor={handleGoEditor} goingToEditor={goingToEditor} />
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>{errorMsg}</div>
            {needLogin && (
              <button onClick={onLoginRequest} style={{ margin: '10px 8px 0', padding: '11px 28px', borderRadius: '9999px', fontSize: '15px', fontWeight: 700, background: 'var(--highlight)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>登录 / 注册</button>
            )}
            <button onClick={() => { setPhase('upload'); setApiDone(false) }} style={{ margin: '10px 8px 0', padding: '11px 28px', borderRadius: '9999px', fontSize: '15px', fontWeight: 600, background: 'white', color: '#334155', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>重新上传</button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 680px) {
          #ats { padding: 56px 0 !important; }
          #ats h2 { font-size: 28px !important; }
        }
        @media (max-width: 480px) {
          .ats-upload-card { padding: 32px 24px 28px !important; }
        }
      `}</style>
    </section>
  )
}
