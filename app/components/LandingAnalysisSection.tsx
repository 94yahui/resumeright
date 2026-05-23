'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Target, CheckCircle2, ChevronRight, FileUp, ChevronDown, ChevronUp, MessageSquare, Lightbulb } from 'lucide-react'
import { parsedToResumeData } from '../lib/types'
import { getDeviceId, getProStatus, checkUsage, recordUsage, getFreeAnalyzeUsed, FREE_ANALYZE_LIMIT, type ProStatus } from '../lib/payment'
import LogoSweepLoader from './LogoSweepLoader'

interface AnalysisResult {
  hasOfferRate: boolean
  offerRate?: number
  overview: string
  suggestions: Array<{ label: string; tip: string }>
  interviewQuestions?: string[]
  interviewAnswers?: string[]
}

const FREE_LIMIT = FREE_ANALYZE_LIMIT

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

  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    setProStatus(getProStatus(did))
    setUsedToday(getFreeAnalyzeUsed())
  }, [])

  const toggleAnswer = (i: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setError('') }
  }

  const handleAnalyze = async () => {
    if (!file) { setError('请上传你的简历文件'); return }

    // Check shared AI-analyze quota (free: 2 lifetime, shared with editor analyze)
    const check = checkUsage(deviceId, 'ai_analyze', proStatus)
    if (!check.allowed) {
      setError(`${check.limit} 次免费次数已用完，升级 Pro 即可无限使用 →`)
      return
    }

    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('deviceId', deviceId)
      const parseRes = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData })
      if (parseRes.status === 422) {
        setError('未检测到简历内容，请上传简历文件')
        setLoading(false)
        return
      }
      if (!parseRes.ok) {
        setError('AI 开小差了，请稍后重试')
        setLoading(false)
        return
      }
      const parseJson = await parseRes.json()
      setParsedRawData(parseJson.data ?? {})
      const resumeData = parsedToResumeData(parseJson.data ?? {})

      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDesc, deviceId }),
      })
      if (!analyzeRes.ok) {
        setError('AI 开小差了，请稍后重试')
        setLoading(false)
        return
      }
      // Record usage only after both calls succeed
      recordUsage(deviceId, 'ai_analyze', proStatus)
      setUsedToday(getFreeAnalyzeUsed())
      setResult(await analyzeRes.json())
      setShowInterviewQ(false)
      setShowModal(true)
    } catch {
      setError('AI 开小差了，请稍后重试')
    }
    setLoading(false)
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
              免费 AI 简历诊断
            </div>

            <h2 style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              color: 'white', lineHeight: 1.2,
              letterSpacing: '-1px', marginBottom: '24px',
            }}>
              30 秒了解你的<br />
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg, #c4b5fd 0%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                paddingRight: '0.2em'
              }}>简历竞争力</em>
            </h2>

            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontWeight: 300, marginBottom: '40px', maxWidth: '420px' }}>
              上传简历，AI 即时分析内容质量、成果量化程度与竞争力，并给出具体改进建议
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { text: '识别简历内容薄弱点，量化改进建议', icon: CheckCircle2, color: '#a78bfa', bg: 'rgba(109,40,217,0.22)', border: 'rgba(139,92,246,0.45)' },
                { text: '分析与目标岗位匹配度，估算 Offer 率', icon: Target, color: '#60a5fa', bg: 'rgba(7,137,236,0.2)', border: 'rgba(7,137,236,0.45)' },
                { text: '生成专属优化内容，一键应用到编辑器', icon: Sparkles, color: '#34d399', bg: 'rgba(16,185,129,0.18)', border: 'rgba(52,211,153,0.45)' },
                { text: '预测 15 道最可能被问到的面试题', icon: MessageSquare, color: '#67e8f9', bg: 'rgba(14,165,233,0.18)', border: 'rgba(14,165,233,0.45)' },
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
                <LogoSweepLoader message="AI 正在分析你的简历" />
              ) : (<>
              {/* JD on top */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  目标岗位详情{' '}
                  <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px', color: '#94a3b8' }}>（可选，分析匹配度）</span>
                </label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="粘贴目标岗位招聘信息，AI 将评估匹配度并给出 Offer 率..."
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
                disabled={loading || !file}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontFamily: "'Inter','Noto Sans SC',sans-serif",
                  fontSize: '14px', fontWeight: 600,
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.2s',
                  opacity: !file && !loading ? 0.55 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'landingSpin 0.8s linear infinite', flexShrink: 0 }} />
                    AI 分析中...
                  </>
                ) : (
                  <><Sparkles size={15} /> 分析我的简历</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
                {proStatus.kind !== 'free'
                  ? '已升级 · 无限使用 · 数据不存储'
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
      {showModal && result && (
        <div
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(7,6,15,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <style>{`@keyframes analysisUp{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div className="overlay-scroll" style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            animation: 'analysisUp 0.25s ease',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={15} color="white" />
                </div>
                <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>AI 简历诊断报告</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            </div>

            {/* Offer rate */}
            {(result.hasOfferRate || result.offerRate !== undefined) && (
              <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px', border: '1px solid rgba(14,165,233,0.28)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Target size={14} color="var(--ai-color-2)" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>匹配 Offer 率</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(14,165,233,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${result.offerRate ?? 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--ai-color-1), var(--ai-color-2))', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: (result.offerRate ?? 0) >= 70 ? '#16a34a' : (result.offerRate ?? 0) >= 40 ? '#d97706' : '#dc2626', minWidth: '50px', textAlign: 'right' }}>{result.offerRate ?? 0}%</div>
                </div>
              </div>
            )}

            {/* Overview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>总体评估</div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.75, margin: 0, padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {result.overview}
              </p>
            </div>

            {/* Interview questions (expandable) */}
            {result.interviewQuestions && result.interviewQuestions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <style>{`@keyframes landingAnswerSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <button
                  onClick={() => setShowInterviewQ(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: showInterviewQ ? '#f0f9ff' : '#f8fafc',
                    border: `1px solid ${showInterviewQ ? 'rgba(14,165,233,0.28)' : '#e2e8f0'}`,
                    borderRadius: showInterviewQ ? '10px 10px 0 0' : '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
                  <div style={{
                    border: '1px solid rgba(14,165,233,0.25)', borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    background: '#f0f9ff',
                    overflow: 'hidden',
                  }}>
                    {result.interviewQuestions.map((q, i) => {
                      const answer = result.interviewAnswers?.[i]
                      const answerExpanded = expandedAnswers.has(i)
                      return (
                        <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(14,165,233,0.12)' : 'none' }}>
                          <div
                            onClick={() => answer && toggleAnswer(i)}
                            style={{
                              display: 'flex', gap: '10px', alignItems: 'flex-start',
                              padding: '10px 14px',
                              cursor: answer ? 'pointer' : 'default',
                            }}
                          >
                            <span style={{
                              minWidth: '20px', height: '20px', borderRadius: '50%',
                              background: 'rgba(13,148,136,0.12)',
                              color: 'var(--teal)',
                              fontSize: '10px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: '2px',
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.65, fontFamily: 'var(--font-sans)' }}>{q}</span>
                              {answer && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <Lightbulb size={10} color="var(--teal)" />
                                  <span style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                                    {answerExpanded ? '收起回答建议' : '查看回答建议'}
                                  </span>
                                  {answerExpanded
                                    ? <ChevronUp size={10} color="var(--teal)" />
                                    : <ChevronDown size={10} color="var(--teal)" />}
                                </div>
                              )}
                            </div>
                          </div>
                          {answer && answerExpanded && (
                            <div style={{
                              margin: '0 14px 10px 44px',
                              padding: '9px 12px',
                              background: 'rgba(13,148,136,0.07)',
                              borderRadius: '7px',
                              borderLeft: '2px solid var(--teal)',
                              animation: 'landingAnswerSlide 0.22s ease',
                            }}>
                              <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                                {answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div style={{ padding: '8px 14px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['技术深度 ×4', '项目细节 ×4', '行为问题 ×3', '情景问题 ×2', '职业规划 ×2'].map((tag, i) => (
                        <span key={i} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(14,165,233,0.12)', color: 'var(--ai-color-2)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>优化建议</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#475569', lineHeight: 1.65, padding: '10px 12px', background: 'linear-gradient(135deg, rgba(28,53,240,0.06), rgba(191,70,197,0.04))', borderRadius: '8px', border: '1px solid rgba(28,53,240,0.12)' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                    <span><strong style={{ color: '#334155' }}>{s.label}：</strong>{s.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #07060f, #1e1035)', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '12px', lineHeight: 1.5 }}>
                进入编辑器，应用以上建议，打造一份脱颖而出的专业简历
              </div>
              <button onClick={handleGoToEditor} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '12px',
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
      )}

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
