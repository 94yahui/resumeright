'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Target, CheckCircle2, ChevronRight, FileUp, ChevronDown, ChevronUp, MessageSquare, Lightbulb } from 'lucide-react'
import { parsedToResumeData } from '../lib/types'
import { getDeviceId, getProStatus, checkUsage, recordUsage, getFreeAnalyzeUsed, getDailyCount, FREE_ANALYZE_LIMIT, type ProStatus } from '../lib/payment'
import LogoSweepLoader from './LogoSweepLoader'

interface AnalysisResult {
  hasOfferRate: boolean
  offerRate?: number
  overview: string
  suggestions: Array<{ label: string; tip: string; optimizedContent?: string[] | string }>
  interviewQuestions?: string[]
  interviewAnswers?: string[]
  missingSkills?: string[]
  jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null
  matchBreakdown?: { overall?: number; experience: number; skills: number; other: number } | null
}

function formatSkillTag(s: string): string {
  return s
    .replace(/^无([^\s])/, '需$1')
    .replace(/^不会/, '需掌握')
    .replace(/^[缺欠]乏?/, '需')
    .replace(/^需需/, '需')
}

const FREE_LIMIT = FREE_ANALYZE_LIMIT

const SAMPLE_JDS = [
  {
    label: '高级前端工程师',
    text: `岗位职责：
1. 负责核心产品前端架构设计与开发，推动工程化体系建设
2. 与产品/设计/后端协作，推动功能高质量落地
3. 持续优化页面性能，关注核心 Web 指标（LCP/FID/CLS）

任职要求：
- 3年以上前端经验，精通 React/Vue3，熟练 TypeScript
- 熟悉 Webpack/Vite，有性能调优经验
- 了解 Node.js，有微前端、移动端 H5/小程序开发经验优先`,
  },
  {
    label: '产品经理',
    text: `岗位职责：
1. 负责产品从 0 到 1 规划与迭代，驱动业务目标达成
2. 深入业务场景，洞察用户需求，输出 PRD 和原型
3. 跨部门推动项目落地，跟踪数据并持续优化

任职要求：
- 3年以上互联网产品经验，有完整 C 端或 B 端产品经历
- 熟练使用 Figma/Axure，具备数据分析能力
- 有 AI 产品、SaaS 或电商平台经验者优先`,
  },
  {
    label: '全栈工程师',
    text: `岗位职责：
1. 独立完成 Web 应用前后端开发，快速验证业务需求
2. 设计 RESTful API，参与数据库建模与性能优化
3. 参与技术选型，推动工程规范落地

任职要求：
- 掌握 React/Vue 前端框架，熟悉 Node.js/Python 后端
- 熟悉 MySQL/PostgreSQL，了解 Redis 缓存机制
- 有 Docker/云服务使用经验，有独立产品者加分`,
  },
  {
    label: 'UI/UX 设计师',
    text: `岗位职责：
1. 负责 App/Web 端交互设计与视觉输出，参与设计系统建设
2. 深入理解用户需求，通过研究和测试持续迭代产品体验
3. 与研发协作，确保设计还原度和交互一致性

任职要求：
- 3年以上互联网 UI/UX 设计经验
- 熟练使用 Figma，能输出完整设计规范和组件库
- 作品集需包含完整设计项目，从研究到交付`,
  },
]

export default function LandingAnalysisSection() {
  const router = useRouter()
  const [jobDesc, setJobDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [parsedRawData, setParsedRawData] = useState<unknown>(null)
  const [showModal, setShowModal] = useState(false)
  const [showInterviewQ, setShowInterviewQ] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [proStatus, setProStatus] = useState<ProStatus>({ kind: 'free' })
  const [usedToday, setUsedToday] = useState(0)
  const [proUsedToday, setProUsedToday] = useState(0)
  const analyzeAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    const status = getProStatus(did)
    setProStatus(status)
    setUsedToday(getFreeAnalyzeUsed())
    setProUsedToday(getDailyCount(did, 'ai_analyze'))
  }, [])

  useEffect(() => {
    if (!showModal) { setAnimRate(0); return }
    const t = setTimeout(() => setAnimRate(result?.offerRate ?? 0), 80)
    return () => clearTimeout(t)
  }, [showModal, result])

  const optimizedOfferRate = (rate: number) => Math.min(95, rate + 15)

  const toggleAnswer = (i: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
  const reportRef = useRef<HTMLDivElement>(null)
  const [animRate, setAnimRate] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGoToEditor = () => {
    const filename = file?.name.replace(/\.[^.]+$/, '') || '上传简历'
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
    if (f) { setFile(f); setError('') }
  }

  const handleAnalyze = async () => {
    if (!file) { setError('请上传简历文件'); return }

    // Check shared AI-analyze quota (free: 2 lifetime, shared with editor analyze)
    const check = checkUsage(deviceId, 'ai_analyze', proStatus)
    if (!check.allowed) {
      setError(proStatus.kind === 'free'
        ? `${check.limit} 次免费次数已用完，升级 Pro 每天可用 20 次 →`
        : `今日分析次数已达上限（${check.limit} 次/天）`
      )
      return
    }

    // Abort any previous in-flight analysis
    analyzeAbortRef.current?.abort()
    const controller = new AbortController()
    analyzeAbortRef.current = controller

    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('deviceId', deviceId)
      const parseRes = await fetch('/api/ai/parse-resume', { method: 'POST', body: fd, signal: controller.signal })
      if (controller.signal.aborted) return
      if (parseRes.status === 422) {
        setError('未检测到简历内容，请上传简历文件')
        return
      }
      if (!parseRes.ok) {
        setError('AI 开小差了，请稍后重试')
        return
      }
      const parseJson = await parseRes.json()
      if (controller.signal.aborted) return
      const parsedRaw = parseJson.data ?? {}
      setParsedRawData(parsedRaw)
      const resumeData = parsedToResumeData(parsedRaw)

      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDesc, deviceId }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!analyzeRes.ok) {
        setError('AI 开小差了，请稍后重试')
        return
      }
      const analysisResult = await analyzeRes.json()
      if (controller.signal.aborted) return
      // Record usage only after both calls succeed
      recordUsage(deviceId, 'ai_analyze', proStatus)
      setUsedToday(getFreeAnalyzeUsed())
      setProUsedToday(getDailyCount(deviceId, 'ai_analyze'))
      setResult(analysisResult)
      setShowInterviewQ(false)
      setShowModal(true)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError('AI 开小差了，请稍后重试')
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
        @keyframes landingSpin { to { transform: rotate(360deg) } }
        @keyframes aiPulse { 0%,100% { opacity: 0.7 } 50% { opacity: 1 } }
      `}</style>

      {/* Violet glow — top left */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.52) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Theme-blue glow — bottom right */}
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-8%',
        width: '650px', height: '650px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(7,137,236,0.42) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Magenta accent — center right */}
      <div style={{
        position: 'absolute', top: '30%', right: '10%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
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
        onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError('') }; e.target.value = '' }}
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
              background: 'rgba(109,40,217,0.14)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: '#c4b5fd',
              fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: '20px',
              marginBottom: '28px',
              backdropFilter: 'blur(1px)'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a78bfa' }} />
              精准定向优化
            </div>

            <h2 style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              color: 'white', lineHeight: 1.2,
              letterSpacing: '-1px', marginBottom: '24px',
            }}>
              针对目标职位<br />
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #c4b5fd 0%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                paddingRight: '0.2em'
              }}>一键优化你的简历</em>
            </h2>

            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontWeight: 300, marginBottom: '40px', maxWidth: '420px' }}>
              AI 深度解析职位要求，定向优化简历内容，让每一句话都精准命中面试官的需求
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { text: '解析岗位要求，精准评估简历与职位契合度', icon: Target, color: '#a78bfa', bg: 'rgba(109,40,217,0.22)', border: 'rgba(139,92,246,0.45)' },
                { text: '定向识别薄弱点，给出岗位导向优化建议', icon: CheckCircle2, color: '#60a5fa', bg: 'rgba(7,137,236,0.2)', border: 'rgba(7,137,236,0.45)' },
                { text: '一键导入编辑器，应用 AI 建议快速优化', icon: Sparkles, color: '#34d399', bg: 'rgba(16,185,129,0.18)', border: 'rgba(52,211,153,0.45)' },
                { text: '预测针对目标职位的专属面试题', icon: MessageSquare, color: '#67e8f9', bg: 'rgba(14,165,233,0.18)', border: 'rgba(14,165,233,0.45)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px', color: 'rgba(255,255,255,0.75)' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <item.icon size={12} color={item.color} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form / loading */}
          <div className="fade-in" style={{ transitionDelay: '0.15s' }}>
            <div style={{
              background: loading ? 'linear-gradient(160deg, #0d0b1e 0%, #07060f 100%)' : '#ffffff',
              border: '1px solid rgba(139,92,246,0.18)',
              borderRadius: '20px',
              padding: loading ? '0' : '32px',
              boxShadow: '0 0 0 1px rgba(109,40,217,0.06), 0 24px 64px rgba(0,0,0,0.45), 0 0 100px rgba(109,40,217,0.14)',
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
                  目标岗位详情{' '}
                  <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px', color: '#94a3b8' }}>（推荐填写，定向优化简历）</span>
                </label>
                <textarea
                  suppressHydrationWarning
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="粘贴目标岗位招聘信息，AI 将定向优化简历内容并估算 Offer 率..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    fontFamily: "'Inter','Noto Sans SC',sans-serif",
                    fontSize: '13px', color: '#0f172a',
                    outline: 'none', resize: 'none', lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(109,40,217,0.6)'; e.target.style.background = '#faf5ff' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
                {/* Sample JD chips */}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>试试：</span>
                  {SAMPLE_JDS.map(jd => (
                    <button
                      key={jd.label}
                      onClick={() => setJobDesc(jd.text)}
                      style={{
                        padding: '3px 10px', borderRadius: '20px',
                        border: `1px solid ${jobDesc === jd.text ? 'rgba(109,40,217,0.45)' : '#e2e8f0'}`,
                        background: jobDesc === jd.text ? '#faf5ff' : '#f8fafc',
                        color: jobDesc === jd.text ? '#7c3aed' : '#64748b',
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
                  上传简历 <span style={{ color: '#7c3aed', fontWeight: 400 }}>*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    border: `1.5px dashed ${file ? 'rgba(109,40,217,0.7)' : error ? 'rgba(239,68,68,0.5)' : '#cbd5e1'}`,
                    borderRadius: '10px', padding: '22px 16px',
                    textAlign: 'center', cursor: 'pointer',
                    background: file ? '#faf5ff' : '#f8fafc',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!file) { e.currentTarget.style.borderColor = 'rgba(109,40,217,0.6)'; e.currentTarget.style.background = '#faf5ff' } }}
                  onMouseLeave={e => { if (!file) { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <FileUp size={24} color={file ? '#7c3aed' : '#94a3b8'} />
                  </div>
                  {file ? (
                    <div style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 500 }}>
                      {file.name}
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 400 }}>点击重新选择</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>点击选择文件</span> 或拖拽到此处
                      <div style={{ fontSize: '11px', marginTop: '4px', color: '#94a3b8' }}>支持 PDF、Word (.docx)，最大 10MB</div>
                    </div>
                  )}
                </div>
                {error && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</div>}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))' : jobDesc.trim()
                    ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
                    : 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
                  boxShadow: !loading && jobDesc.trim() ? '0 4px 16px rgba(124,58,237,0.35)' : '0 2px 8px rgba(0,0,0,0.08)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontFamily: "'Inter','Noto Sans SC',sans-serif",
                  fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'landingSpin 0.8s linear infinite', flexShrink: 0 }} />
                    AI 分析中...
                  </>
                ) : jobDesc.trim() ? (
                  <>✨ 精准定向分析</>
                ) : (
                  <>分析我的简历</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
                {proStatus.kind === 'subscription'
                  ? `今日已用 ${proUsedToday}/20 次 · 数据不存储`
                  : proStatus.kind === 'single'
                    ? `今日已用 ${proUsedToday} 次 · 数据不存储`
                    : usedToday === 0
                      ? '首次免费 · 无需注册 · 数据不存储'
                      : `还剩 ${Math.max(0, FREE_LIMIT - usedToday)} 次免费机会 · 数据不存储`
                }
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
        const offerColor = offerRate >= 70 ? '#22c55e' : offerRate >= 50 ? '#eab308' : offerRate >= 30 ? '#f97316' : '#ef4444'
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
            @keyframes landingAnswerSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
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
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', flex: 1 }}>AI 简历诊断报告</span>
              <button onClick={() => setShowModal(false)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            {/* Offer rate — current vs post-optimization */}
            {showOfferRate && (
              <div style={{ background: '#0a0a0f', borderRadius: '16px', padding: '22px 28px', marginBottom: '18px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Target size={10} color="rgba(255,255,255,0.35)" /> 拿到 Offer 率预测
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginBottom: '6px' }}>当前预计</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '48px', fontWeight: 800, color: offerColor, lineHeight: 1 }}>{offerRate}%</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>拿到 Offer 率</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.2)' }}>
                    <ChevronRight size={20} />
                    <div style={{ fontSize: '9px', fontWeight: 700, whiteSpace: 'nowrap' }}>AI优化后</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginBottom: '6px' }}>优化后预计</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '48px', fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>{optRate}%</div>
                    <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>+{optRate - offerRate}% 提升空间</div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${animRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-blue), #22c55e)', borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>0%</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>100%</span>
                </div>
              </div>
            )}

            {/* Overview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>总体评估</div>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.8, margin: 0, padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {result.overview}
              </p>
            </div>

            {/* Missing skills tags */}
            {showOfferRate && result.missingSkills && result.missingSkills.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>职位不符部分</div>
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

            {/* Interview questions (expandable) */}
            {result.interviewQuestions && result.interviewQuestions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowInterviewQ(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: showInterviewQ ? '10px 10px 0 0' : '10px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={11} color="white" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', fontFamily: 'var(--font-sans)' }}>预测面试题</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400, fontFamily: 'var(--font-sans)' }}>（{result.interviewQuestions.length} 道）</span>
                  </div>
                  {showInterviewQ ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                </button>

                {showInterviewQ && (
                  <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', background: '#f8fafc', overflow: 'hidden' }}>
                    {result.interviewQuestions.map((q, i) => {
                      const answer = result.interviewAnswers?.[i]
                      const answerExpanded = expandedAnswers.has(i)
                      return (
                        <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(14,165,233,0.12)' : 'none' }}>
                          <div onClick={() => answer && toggleAnswer(i)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', cursor: answer ? 'pointer' : 'default' }}>
                            <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(13,148,136,0.12)', color: 'var(--teal)', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.65, fontFamily: 'var(--font-sans)' }}>{q}</span>
                              {answer && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <Lightbulb size={10} color="var(--teal)" />
                                  <span style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{answerExpanded ? '收起回答建议' : '查看回答建议'}</span>
                                  {answerExpanded ? <ChevronUp size={10} color="var(--teal)" /> : <ChevronDown size={10} color="var(--teal)" />}
                                </div>
                              )}
                            </div>
                          </div>
                          {answer && answerExpanded && (
                            <div style={{ margin: '0 14px 10px 44px', padding: '9px 12px', background: 'rgba(13,148,136,0.07)', borderRadius: '7px', borderLeft: '2px solid var(--teal)', animation: 'landingAnswerSlide 0.22s ease' }}>
                              <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>{answer}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions — summary only, details in editor */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>优化方向</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={handleGoToEditor}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'linear-gradient(135deg, rgba(28,53,240,0.05), rgba(191,70,197,0.03))', borderRadius: '10px', border: '1px solid rgba(28,53,240,0.1)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,53,240,0.1)' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{s.label}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>{s.tip}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>查看详情 →</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>进入编辑器查看完整 AI 优化内容并一键应用</div>
            </div>

            {/* CTA */}
            <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #07060f, #1e1035)', borderRadius: '14px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px', lineHeight: 1.6 }}>
                进入编辑器，逐条查看 AI 优化内容，一键应用到简历，让每一句话都直击目标岗位需求
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
                进入编辑器，立即优化 <ChevronRight size={16} />
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
