'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Target, CheckCircle2, ChevronRight, FileUp } from 'lucide-react'
import { parsedToResumeData } from '../lib/types'
import { getDeviceId, recordUsage, FREE_ANALYZE_LIMIT } from '../lib/payment'
import { useAuth } from '../hooks/useAuth'
import LogoSweepLoader from './LogoSweepLoader'
import { saveResumeToCache, getCachedResumeName, getCachedResumeFile, saveParsedDataToCache, getCachedParsedData, RESUME_CACHED_EVENT } from '../lib/resumeCache'

interface AnalysisResult {
  hasOfferRate: boolean
  offerRate?: number
  overview: string
  suggestions: Array<{ label: string; tip: string; optimizedContent?: string[] | string }>
  missingSkills?: string[]
  jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null
  matchBreakdown?: { overall?: number; experience: number; skills: number; other: number } | null
}

function formatSkillTag(s: string): string {
  // Defensively strip a leading Chinese "需"/"需要" prefix the model sometimes adds.
  return s.replace(/^\s*需要?\s*/, '').trim()
}

const FREE_LIMIT = FREE_ANALYZE_LIMIT
const SUB_PLANS = new Set(['day3', 'weekly', 'monthly', 'quarterly'])

// ── Chalk / red-pen "graded paper" accents (analysis section prototype) ──────
const CHALK = "'Caveat', 'Inter', cursive"

// Hand-drawn check mark with a chalky rough edge.
function ChalkCheck({ size = 26, color = '#86efac' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, filter: 'url(#chalkRough)' }} aria-hidden>
      <path d="M3.5 12.5 C5 14, 7.6 16.4, 9.2 18.6 C12 13, 15.5 7.4, 20.6 4.4"
        stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Wavy hand-drawn underline.
function ScribbleUnderline({ width = 300, color = '#fcd34d' }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="16" viewBox={`0 0 ${width} 16`} fill="none"
      style={{ display: 'block', marginTop: '4px', maxWidth: '100%', filter: 'url(#chalkRough)' }} aria-hidden>
      <path d={`M4 9 C ${width * 0.2} 4, ${width * 0.35} 13, ${width * 0.55} 7 S ${width * 0.85} 4, ${width - 4} 8`}
        stroke={color} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

// Hand-drawn ellipse to circle a "grade".
function ChalkCircle({ color = '#86efac' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 50" fill="none" preserveAspectRatio="none" aria-hidden
      style={{ position: 'absolute', inset: '-9px -10px', width: 'calc(100% + 20px)', height: 'calc(100% + 18px)', filter: 'url(#chalkRough)', pointerEvents: 'none' }}>
      <path d="M40 4 C63 3, 77 14, 75 26 C73 40, 53 47, 35 46 C15 45, 3 35, 5 22 C7 10, 23 4, 46 5"
        stroke={color} strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  )
}

const SAMPLE_JDS = [
  {
    label: 'Senior Frontend Engineer',
    text: `Responsibilities:
1. Own frontend architecture and development for core products, driving engineering best practices
2. Collaborate with product, design, and backend teams to ship high-quality features
3. Continuously optimize page performance and Core Web Vitals (LCP/FID/CLS)

Requirements:
- 3+ years of frontend experience, expert in React/Vue 3, proficient in TypeScript
- Familiar with Webpack/Vite and performance tuning
- Knowledge of Node.js; experience with micro-frontends or mobile web a plus`,
  },
  {
    label: 'Product Manager',
    text: `Responsibilities:
1. Drive product planning and iteration from 0 to 1 to achieve business goals
2. Dive into user scenarios, uncover needs, and produce PRDs and prototypes
3. Coordinate cross-functional delivery, track metrics, and iterate

Requirements:
- 3+ years of product experience with end-to-end B2C or B2B product ownership
- Proficient with Figma/Axure and strong data analysis skills
- Experience with AI products, SaaS, or e-commerce platforms a plus`,
  },
  {
    label: 'Full-Stack Engineer',
    text: `Responsibilities:
1. Independently build frontend and backend of web applications to validate ideas quickly
2. Design RESTful APIs and contribute to data modeling and performance optimization
3. Participate in tech selection and drive engineering standards

Requirements:
- Strong in React/Vue on the frontend, familiar with Node.js/Python backends
- Familiar with MySQL/PostgreSQL and Redis caching
- Experience with Docker/cloud services; shipped side projects a plus`,
  },
  {
    label: 'UI/UX Designer',
    text: `Responsibilities:
1. Own interaction and visual design for app/web and contribute to the design system
2. Understand user needs and iterate the experience through research and testing
3. Work with engineering to ensure design fidelity and interaction consistency

Requirements:
- 3+ years of UI/UX design experience
- Proficient with Figma; able to deliver full design specs and component libraries
- Portfolio with complete projects from research to delivery`,
  },
]

export default function LandingAnalysisSection({ onLoginRequest }: { onLoginRequest?: () => void } = {}) {
  const router = useRouter()
  const auth = useAuth()
  const [jobDesc, setJobDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [parsedRawData, setParsedRawData] = useState<unknown>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [cachedFilename, setCachedFilename] = useState<string | null>(null)
  const analyzeAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    setCachedFilename(getCachedResumeName())

    const handler = (e: Event) => {
      const { name, source } = (e as CustomEvent<{ name: string; source: string }>).detail
      if (source === 'analysis') return
      setCachedFilename(name)
      setFile(null)  // clear so next analyze uses the new cached file
    }
    window.addEventListener(RESUME_CACHED_EVENT, handler)
    return () => window.removeEventListener(RESUME_CACHED_EVENT, handler)
  }, [])

  // Derived quota state
  const isSubscriber = auth.loggedIn && !!auth.membership &&
    SUB_PLANS.has(auth.membership.plan) &&
    (!auth.membership.expires_at || auth.membership.expires_at > Date.now())
  const analyzeUsed = isSubscriber ? auth.dailyAnalyzeUsed : auth.freeAnalyzeUsed
  const analyzeLimit = isSubscriber ? 20 : FREE_LIMIT
  const analyzeExhausted = analyzeUsed >= analyzeLimit

  useEffect(() => {
    if (!showModal) { setAnimRate(0); return }
    const t = setTimeout(() => setAnimRate(result?.offerRate ?? 0), 80)
    return () => clearTimeout(t)
  }, [showModal, result])

  const optimizedOfferRate = (rate: number) => Math.min(95, rate + 15)

  const reportRef = useRef<HTMLDivElement>(null)
  const [animRate, setAnimRate] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGoToEditor = () => {
    const filename = (file?.name ?? cachedFilename)?.replace(/\.[^.]+$/, '') || 'Resume'
    sessionStorage.setItem('resumecraft_landing_import', JSON.stringify({
      data: parsedRawData,
      filename,
      analysis: result,
    }))
    setShowModal(false)
    router.push('/editor')
  }

  useEffect(() => {
    return () => { analyzeAbortRef.current?.abort() }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) {
      setFile(f); setError(''); saveResumeToCache(f); setCachedFilename(f.name)
      window.dispatchEvent(new CustomEvent(RESUME_CACHED_EVENT, { detail: { name: f.name, source: 'analysis' } }))
    }
  }

  const handleAnalyze = async () => {
    const fileToUse = file ?? getCachedResumeFile()
    if (!fileToUse) { setError('Please upload a resume file'); return }

    if (!auth.loggedIn) {
      onLoginRequest?.()
      return
    }

    // Quota pre-check (server enforces authoritatively; this avoids wasted round-trips)
    if (analyzeExhausted) {
      setError('Daily analysis limit reached, please try again tomorrow')
      return
    }

    // Abort any previous in-flight analysis
    analyzeAbortRef.current?.abort()
    const controller = new AbortController()
    analyzeAbortRef.current = controller

    setError('')
    setLoading(true)
    try {
      // If no new file was selected, try using cached parsed data to skip the parse API call
      const cachedParsed = !file ? getCachedParsedData() : null
      let parsedRaw: unknown

      if (cachedParsed) {
        parsedRaw = cachedParsed
        setParsedRawData(parsedRaw)
      } else {
        const fd = new FormData()
        fd.append('file', fileToUse)
        fd.append('deviceId', deviceId)
        fd.append('skipImportQuota', 'true')
        const parseRes = await fetch('/api/ai/parse-resume', { method: 'POST', body: fd, signal: controller.signal })
        if (controller.signal.aborted) return
        if (parseRes.status === 422) {
          setError('No resume content detected, please upload a resume file')
          return
        }
        if (!parseRes.ok) {
          if (parseRes.status === 429) {
            const errJson = await parseRes.json().catch(() => null)
            setError(errJson?.error || 'Import limit reached, please try again later')
          } else {
            setError('Something went wrong, please try again later')
          }
          return
        }
        const parseJson = await parseRes.json()
        if (controller.signal.aborted) return
        parsedRaw = parseJson.data ?? {}
        setParsedRawData(parsedRaw)
        saveParsedDataToCache(parsedRaw)
      }

      const resumeData = parsedToResumeData(parsedRaw as Parameters<typeof parsedToResumeData>[0])

      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDesc, deviceId }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!analyzeRes.ok) {
        if (analyzeRes.status === 429) {
          const errJson = await analyzeRes.json().catch(() => null)
          setError(errJson?.error || 'Analysis limit reached, please try again later')
          if (auth.loggedIn) window.dispatchEvent(new Event('rc:login'))
        } else {
          setError('Something went wrong, please try again later')
        }
        return
      }
      const analysisResult = await analyzeRes.json()
      if (controller.signal.aborted) return
      // Record usage only after both calls succeed
      if (auth.loggedIn) {
        // Server already updated DB via checkServerQuota; refresh auth so counts reflect in UI
        window.dispatchEvent(new Event('rc:login'))
      }
      setResult(analysisResult)
      setShowModal(true)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError('Something went wrong, please try again later')
    } finally {
      if (analyzeAbortRef.current === controller) {
        analyzeAbortRef.current = null
        setLoading(false)
      }
    }
  }

  return (
    <section id="analysis" style={{
      background: '#07060f',
      minHeight: '100vh',
      padding: '0 32px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
        @keyframes landingSpin { to { transform: rotate(360deg) } }
        @keyframes aiPulse { 0%,100% { opacity: 0.7 } 50% { opacity: 1 } }
      `}</style>

      {/* Chalk rough-edge filter for the hand-drawn accents */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <filter id="chalkRough">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
          </filter>
        </defs>
      </svg>

      {/* Violet glow — top left */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(7,137,236,0.52) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Theme-blue glow — bottom right */}
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-8%',
        width: '650px', height: '650px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,116,144,0.40) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Magenta accent — center right */}
      <div style={{
        position: 'absolute', top: '30%', right: '10%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(103,232,249,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
      }} />

      <input
        ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) {
            setFile(f); setError(''); saveResumeToCache(f); setCachedFilename(f.name)
            window.dispatchEvent(new CustomEvent(RESUME_CACHED_EVENT, { detail: { name: f.name, source: 'analysis' } }))
          }
          e.target.value = ''
        }}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', width: '100%', padding: '80px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '72px', alignItems: 'center',
        }} className="landing-analysis-grid">

          {/* Left: headline */}
          <div className="fade-in">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(7,137,236,0.14)',
              border: '1px solid rgba(56,189,248,0.35)',
              color: '#7dd3fc',
              fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: '20px',
              marginBottom: '28px',
              backdropFilter: 'blur(1px)'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38bdf8' }} />
              Targeted analysis & optimization
            </div>

            <h2 style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              color: 'white', lineHeight: 1.2,
              letterSpacing: '-1px', marginBottom: '24px',
            }}>
              Tailored to the job,<br />
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #7dd3fc 0%, #5eead4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                paddingRight: '0.2em'
              }}>optimized in one click</em>
              <ScribbleUnderline width={320} />
            </h2>

            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontWeight: 300, marginBottom: '40px', maxWidth: '420px' }}>
              AI analyzes the job requirements in depth and tailors your resume so every line speaks directly to what the recruiter is looking for
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { text: 'Parse job requirements and gauge how well your resume fits', icon: Target, color: '#38bdf8', bg: 'rgba(7,137,236,0.20)', border: 'rgba(56,189,248,0.45)' },
                { text: 'Pinpoint weak spots and give job-targeted improvement tips', icon: CheckCircle2, color: '#5eead4', bg: 'rgba(14,116,144,0.20)', border: 'rgba(94,234,212,0.45)' },
                { text: 'Import to the editor and apply suggestions in one click', icon: Sparkles, color: '#67e8f9', bg: 'rgba(103,232,249,0.16)', border: 'rgba(103,232,249,0.45)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.75)' }}>
                  <ChalkCheck size={26} color={item.color} />
                  {item.text}
                </div>
              ))}
            </div>

            {/* Graded-score margin note — exam-paper motif */}
            <div style={{
              marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '12px',
              fontFamily: CHALK, lineHeight: 1, transform: 'rotate(-2deg)',
            }}>
              <span style={{ fontSize: '19px', color: 'rgba(255,255,255,0.5)' }}>Job match</span>
              <span style={{ fontSize: '30px', fontWeight: 700, color: '#fca5a5', textDecoration: 'line-through', textDecorationThickness: '2px' }}>72</span>
              <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.35)' }}>→</span>
              <span style={{ position: 'relative', fontSize: '32px', fontWeight: 700, color: '#5eead4', padding: '0 8px' }}>
                91
                <ChalkCircle color="#5eead4" />
              </span>
            </div>
          </div>

          {/* Right: form / loading */}
          <div className="fade-in" style={{ transitionDelay: '0.15s' }}>
            <div style={{
              background: loading ? 'linear-gradient(160deg, #0b1322 0%, #07060f 100%)' : '#ffffff',
              border: '1px solid rgba(56,189,248,0.18)',
              borderRadius: '20px',
              padding: loading ? '0' : '32px',
              boxShadow: '0 0 0 1px rgba(7,137,236,0.06), 0 24px 64px rgba(0,0,0,0.45), 0 0 100px rgba(7,137,236,0.14)',
              transition: 'background 0.3s, padding 0.3s',
              minHeight: '360px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              {loading ? (
                <LogoSweepLoader />
              ) : (<>
              {/* JD on top */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Target job details{' '}
                  <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px', color: '#94a3b8' }}>(recommended, for targeted optimization)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    suppressHydrationWarning
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    placeholder="Paste the job posting — AI will tailor your resume and score your job match..."
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                      paddingRight: jobDesc ? '34px' : '14px',
                      paddingBottom: '22px',
                      background: '#f8fafc',
                      border: `1.5px solid ${jobDesc.length > 3000 ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      fontFamily: "'Inter','Noto Sans SC',sans-serif",
                      fontSize: '13px', color: '#0f172a',
                      outline: 'none', resize: 'none', lineHeight: 1.6,
                    }}
                    onFocus={e => { e.target.style.borderColor = jobDesc.length > 3000 ? '#ef4444' : 'rgba(14,116,144,0.6)'; e.target.style.background = '#ecfeff' }}
                    onBlur={e => { e.target.style.borderColor = jobDesc.length > 3000 ? '#ef4444' : '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                  />
                  {jobDesc && (
                    <button
                      onClick={() => setJobDesc('')}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(100,116,139,0.15)', border: 'none',
                        borderRadius: '50%', width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#94a3b8', padding: 0,
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.3)'; e.currentTarget.style.color = '#475569' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.15)'; e.currentTarget.style.color = '#94a3b8' }}
                    ><X size={10} /></button>
                  )}
                  {jobDesc.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '11px', color: jobDesc.length > 3000 ? '#ef4444' : '#94a3b8', pointerEvents: 'none' }}>
                      {jobDesc.length}/3000
                    </div>
                  )}
                </div>
                {jobDesc.length > 3000 && (
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>
                    Too long — please keep it under 3000 characters
                  </div>
                )}
                {/* Sample JD chips */}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Try:</span>
                  {SAMPLE_JDS.map(jd => (
                    <button
                      key={jd.label}
                      onClick={() => setJobDesc(jd.text)}
                      style={{
                        padding: '3px 10px', borderRadius: '20px',
                        border: `1px solid ${jobDesc === jd.text ? 'rgba(14,116,144,0.45)' : '#e2e8f0'}`,
                        background: jobDesc === jd.text ? '#ecfeff' : '#f8fafc',
                        color: jobDesc === jd.text ? '#0e7490' : '#64748b',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter','Noto Sans SC',sans-serif",
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (jobDesc !== jd.text) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' } }}
                      onMouseLeave={e => { if (jobDesc !== jd.text) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' } }}
                    >{jd.label}</button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Upload resume <span style={{ color: '#0e7490', fontWeight: 400 }}>*</span>
                </label>
                {(() => {
                  const showCached = !file && !!cachedFilename
                  return (
                    <div
                      onClick={() => { if (!showCached) fileInputRef.current?.click() }}
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      style={{
                        border: `1.5px dashed ${file ? 'rgba(14,116,144,0.7)' : showCached ? 'rgba(14,116,144,0.45)' : error ? 'rgba(239,68,68,0.5)' : '#cbd5e1'}`,
                        borderRadius: '10px', padding: '22px 16px',
                        textAlign: 'center', cursor: showCached ? 'default' : 'pointer',
                        background: (file || showCached) ? '#ecfeff' : '#f8fafc',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (!file && !showCached) { e.currentTarget.style.borderColor = 'rgba(14,116,144,0.6)'; e.currentTarget.style.background = '#ecfeff' } }}
                      onMouseLeave={e => { if (!file && !showCached) { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <FileUp size={24} color={(file || showCached) ? '#0e7490' : '#94a3b8'} />
                      </div>
                      {file ? (
                        <div style={{ fontSize: '13px', color: '#0e7490', fontWeight: 500 }}>
                          {file.name}
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 400 }}>Click to choose another</div>
                        </div>
                      ) : showCached ? (
                        <div style={{ fontSize: '13px', color: '#0e7490', fontWeight: 500 }}>
                          <span style={{ color: '#64748b', fontWeight: 400 }}>Last upload: </span>{cachedFilename}
                          <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 400 }}>
                            <button
                              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                              style={{ textDecoration: 'underline', cursor: 'pointer', color: '#94a3b8', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                            >Re-upload</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          <span style={{ color: '#0e7490', fontWeight: 600 }}>Click to choose a file</span> or drag it here
                          <div style={{ fontSize: '11px', marginTop: '4px', color: '#94a3b8' }}>PDF or Word (.docx), max 10MB</div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {error && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</div>}
              </div>

              <button
                onClick={!auth.loading && analyzeExhausted && !auth.loggedIn ? () => onLoginRequest?.() : handleAnalyze}
                disabled={loading || jobDesc.length > 3000}
                style={{
                  width: '100%', padding: '14px',
                  background: jobDesc.length > 3000
                    ? '#e2e8f0'
                    : (!auth.loading && analyzeExhausted && !auth.loggedIn)
                      ? 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))'
                      : loading ? 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))' : jobDesc.trim()
                        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
                        : 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
                  boxShadow: jobDesc.length > 3000 ? 'none' : !loading && jobDesc.trim() ? '0 4px 16px rgba(124,58,237,0.35)' : '0 2px 8px rgba(0,0,0,0.12)',
                  color: jobDesc.length > 3000 ? '#94a3b8' : 'white',
                  border: 'none', borderRadius: '12px',
                  fontFamily: "'Inter','Noto Sans SC',sans-serif",
                  fontSize: '14px', fontWeight: 600,
                  cursor: loading || jobDesc.length > 3000 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'landingSpin 0.8s linear infinite', flexShrink: 0 }} />
                    Analyzing...
                  </>
                ) : analyzeExhausted && auth.loggedIn ? (
                  <>Daily limit reached</>
                ) : jobDesc.trim() ? (
                  <><Target size={15} /> Match &amp; optimize for this job</>
                ) : (
                  <>Review my resume quality</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
                {jobDesc.trim()
                  ? <>Scores your job-match rate &amp; gives JD-targeted fixes · Free</>
                  : <>General writing &amp; quality review · <span style={{ color: '#7c3aed', fontWeight: 600 }}>paste a JD</span> for match scoring</>}
              </div>
            </>)}
            </div>
          </div>
        </div>
      </div>

      {/* Result modal */}
      {showModal && result && (() => {
        const offerRate = result.offerRate ?? 0
        const showOfferRate = result.hasOfferRate === true
        // Bright, tiered gradients for the match score — green at the top, warm-bright lower down.
        const offerGradient = offerRate >= 70 ? 'linear-gradient(135deg, #06d6a0, #34e0b8)'
          : offerRate >= 50 ? 'linear-gradient(135deg, #f59e0b, #fde047)'
          : offerRate >= 30 ? 'linear-gradient(135deg, #fb7a3c, #fdba74)'
          : 'linear-gradient(135deg, #f43f5e, #fb7185)'
        const optGradient = 'linear-gradient(135deg, #06d6a0, #34e0b8)'
        // Paints text with a gradient fill.
        const gradientText = (g: string): React.CSSProperties => ({
          background: g, WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent', color: 'transparent',
        })
        const optRate = optimizedOfferRate(offerRate)
        return (
        <div
          onClick={() => {}}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(7,6,15,0.88)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <style>{`
            @keyframes analysisUp{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
          `}</style>
          <div ref={reportRef} className="overlay-scroll" style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            maxWidth: '680px', width: '100%', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            animation: 'analysisUp 0.25s ease',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={15} color="white" />
              </div>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', flex: 1 }}>Resume Report</span>
              <button onClick={() => setShowModal(false)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            {/* Job match rate — current vs post-optimization (same card as the editor) */}
            {showOfferRate && (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 45%, #effdfa 100%)', border: '1px solid #c7f0e2', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#059669', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={9} color="#059669" /> Job match rate
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>Current</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '30px', fontWeight: 800, lineHeight: 1, ...gradientText(offerGradient) }}>{offerRate}%</div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 700, textAlign: 'center' }}>→</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>After optimization</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '30px', fontWeight: 800, lineHeight: 1, ...gradientText(optGradient) }}>{optRate}%</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '3px', ...gradientText(optGradient) }}>+{optRate - offerRate}%</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', height: '4px', background: 'rgba(15,23,42,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${animRate}%`, height: '100%', background: offerGradient, borderRadius: '2px', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            )}

            {/* Overview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Overall assessment</div>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.8, margin: 0, padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {result.overview}
              </p>
            </div>

            {/* Missing skills tags */}
            {showOfferRate && result.missingSkills && result.missingSkills.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Skills needed</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.missingSkills.map((skill, i) => (
                    <span key={i} style={{
                      fontSize: '12px', fontWeight: 500,
                      color: '#dc2626',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontFamily: "'Inter','Noto Sans SC',sans-serif",
                    }}>{formatSkillTag(skill)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions — summary only, details in editor */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Where to improve</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={handleGoToEditor}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'linear-gradient(135deg, rgba(7,137,236,0.06), rgba(103,232,249,0.04))', borderRadius: '10px', border: '1px solid rgba(7,137,236,0.12)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(7,137,236,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(7,137,236,0.12)' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{s.label}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>{s.tip}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#0e7490', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>View details →</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>Open the editor to see full AI suggestions and apply them in one click</div>
            </div>

            {/* CTA */}
            <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #07060f, #0b1322)', borderRadius: '14px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px', lineHeight: 1.6 }}>
                Open the editor to review every AI suggestion and apply it to your resume so each line hits the target role&apos;s needs
              </div>
              <button onClick={handleGoToEditor} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
                color: 'white', borderRadius: '10px',
                fontFamily: "'Inter','Noto Sans SC',sans-serif",
                fontSize: '14px', fontWeight: 600,
                border: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}>
                Open the editor and optimize now <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )})()}

      <style>{`
        @media (max-width: 768px) {
          .landing-analysis-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  )
}
