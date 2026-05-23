'use client'
import { useState, useRef, useEffect } from 'react'
import { FileDown, FileType, ImageIcon, FileUp, CheckCircle2, Sparkles, X, QrCode, Smartphone, FilePen, Plus, Target, ChevronDown, ChevronUp, MessageSquare, Lightbulb, GraduationCap, Star } from 'lucide-react'
import type { AISuggestion } from '../../lib/types'
import { addPayment, generateOrderId, PRICES, PLAN_DURATION_MS, setStudentRecord } from '../../lib/payment'
import type { PlanType, PayMethod } from '../../lib/payment'

export function ContinueModal({
  docTitle, savedAt, onContinue, onNew,
}: {
  docTitle: string; savedAt: number; onContinue: () => void; onNew: () => void
}) {
  function fmt(ts: number) {
    const d = new Date(ts)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return (
    <ModalWrap onClose={onNew} disableBackdropClose>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>继续上次编辑？</div>
        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
          发现上次未完成的简历，是否继续编辑？
        </div>
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: '10px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
          {docTitle || '我的简历'}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>上次编辑：{fmt(savedAt)}</div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onContinue} style={{
          flex: 1, padding: '12px',
          background: '#0f172a', color: 'white',
          border: 'none', borderRadius: '10px',
          fontSize: '13.5px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <FilePen size={15} /> 继续编辑
        </button>
        <button onClick={onNew} style={{
          flex: 1, padding: '12px',
          background: 'white', color: '#334155',
          border: '1.5px solid #e2e8f0', borderRadius: '10px',
          fontSize: '13.5px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Plus size={15} /> 创建新简历
        </button>
      </div>
    </ModalWrap>
  )
}

export function DownloadModal({
  onClose, onPrintPDF, onDownloadWord, onDownloadPNG,
  isPro, isPaid, onUnlockPro,
}: {
  onClose: () => void
  onPrintPDF: () => void
  onDownloadWord?: () => void
  onDownloadPNG?: () => void
  isPro?: boolean
  isPaid?: boolean
  onUnlockPro?: () => void
}) {
  const proRows = [
    {
      icon: <FileType size={22} />,
      label: 'Word (.doc)',
      sub: isPaid ? '可编辑格式 · 适合二次修改' : 'Pro 功能',
      onClick: onDownloadWord,
    },
    {
      icon: <ImageIcon size={22} />,
      label: 'PNG 图片',
      sub: isPaid ? '高清图片 · 适合直接分享' : 'Pro 功能',
      onClick: onDownloadPNG,
    },
  ]

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>下载简历</div>
      <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
        选择下载格式，生成后自动保存到本地
      </p>

      {/* PDF — always available */}
      <div onClick={onPrintPDF} style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        border: '2px solid var(--theme-blue)',
        borderRadius: '10px', cursor: 'pointer', marginBottom: '10px',
        background: '#e0f0fd',
        transition: 'all 0.2s',
      }}>
        <FileDown size={22} color="var(--theme-blue)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>PDF 格式</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>推荐 · 适合投递使用</div>
        </div>
        <span style={{ fontSize: '14px', color: 'var(--theme-blue)' }}>→</span>
      </div>

      {isPro && !isPaid && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '8px',
          background: '#fef3c7', border: '1px solid #fbbf24',
          marginBottom: '10px',
        }}>
          <span style={{ fontSize: '12px', color: '#92400e', flex: 1 }}>Pro 模板 · 当前下载含水印</span>
          <button onClick={onUnlockPro} style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
            background: '#d4a017', color: '#1a1814', fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>解锁无水印 ¥19</button>
        </div>
      )}

      {/* Word and PNG — enabled for Pro, locked for free */}
      {proRows.map(row => {
        const enabled = isPaid && !!row.onClick
        return (
          <div
            key={row.label}
            onClick={enabled ? row.onClick : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px',
              border: `1.5px solid ${enabled ? '#e2e8f0' : '#f1f5f9'}`,
              borderRadius: '10px', marginBottom: '10px',
              background: 'white',
              cursor: enabled ? 'pointer' : 'default',
              opacity: enabled ? 1 : 0.55,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (enabled) (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
            onMouseLeave={e => { if (enabled) (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
          >
            <span style={{ color: enabled ? '#334155' : '#94a3b8' }}>{row.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{row.label}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{row.sub}</div>
            </div>
            {enabled
              ? <span style={{ fontSize: '14px', color: '#64748b' }}>→</span>
              : <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>🔒 Pro</span>
            }
          </div>
        )
      })}

      <button onClick={onClose} style={{
        width: '100%', marginTop: '4px', padding: '11px',
        border: '1px solid #e2e8f0', background: 'transparent',
        borderRadius: '8px', fontFamily: 'var(--font-sans)',
        fontSize: '13px', cursor: 'pointer', color: '#64748b',
      }}>取消</button>
    </ModalWrap>
  )
}

type AIPanelPhase = 'entry' | 'analyzing' | 'result' | 'applying'

interface AIPanelProps {
  flow: 'current' | 'upload'
  phase: AIPanelPhase
  uploadFilename: string
  templateApplied: boolean
  optimizeEnabled: boolean
  optimizing?: boolean
  analysis?: { hasOfferRate?: boolean; offerRate?: number; overview: string; suggestions: AISuggestion[]; interviewQuestions?: string[]; interviewAnswers?: string[] } | null
  appliedSuggestionIds?: Set<string>
  uploadError?: string
  jobDesc: string
  onJobDescChange: (v: string) => void
  onAnalyzeCurrent: (jobDesc: string) => void
  onSelectFile: (file: File) => void
  onApplyTemplate: () => void
  onApplySuggestion: (s: AISuggestion) => void
  onApplyAll: () => void
  onClose: () => void
}

export function AIPanel({
  flow, phase, uploadFilename, templateApplied, optimizeEnabled,
  analysis, appliedSuggestionIds, uploadError, jobDesc, onJobDescChange,
  onAnalyzeCurrent, onSelectFile, onApplyTemplate, onApplySuggestion, onApplyAll, onClose,
}: AIPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showInterviewQ, setShowInterviewQ] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())

  const toggleAnswer = (i: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onSelectFile(file)
    e.target.value = ''
  }

  const showOfferRate = !!(analysis?.hasOfferRate) || analysis?.offerRate !== undefined
  const offerRate = analysis?.offerRate ?? 0
  const rawSuggestions = analysis?.suggestions ?? []
  // Summary suggestion always first
  const suggestions = [...rawSuggestions].sort((a, b) =>
    a.section === 'summary' ? -1 : b.section === 'summary' ? 1 : 0
  )
  const interviewQuestions = analysis?.interviewQuestions ?? []
  const interviewAnswers = analysis?.interviewAnswers ?? []
  const unappliedCount = suggestions.filter(s => !appliedSuggestionIds?.has(s.id)).length

  return (
    <div style={{ width: '100%', height: '100%', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes aipB{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-8px);opacity:1}}
        @keyframes scanLine{0%{top:0%;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:100%;opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes aiSpin{to{transform:rotate(360deg)}}
      `}</style>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg,var(--ai-color-1),var(--ai-color-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={11} color="white" />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', flex: 1 }}>AI 解析 & 优化</span>
        <button
          onClick={onClose}
          style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
        >×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Entry */}
        {phase === 'entry' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={aiPanelLabel}>
                  目标职位描述{' '}
                  <span style={{ fontWeight: 400, fontSize: '11px', letterSpacing: 0, textTransform: 'none' }}>（可选）</span>
                </label>
                {jobDesc && (
                  <button onClick={() => onJobDescChange('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#475569' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
                  ><X size={13} /></button>
                )}
              </div>
              <textarea
                value={jobDesc}
                onChange={e => onJobDescChange(e.target.value)}
                placeholder="粘贴目标岗位详情或描述职位要求..."
                rows={4}
                style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#0f172a', background: '#f8fafc', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => onAnalyzeCurrent(jobDesc)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={14} /> 解析当前简历
              </button>
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FileUp size={14} /> 上传简历解析
              </button>
            </div>
          </>
        )}

        {/* Analyzing */}
        {phase === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-blue)', animation: `aipB 1.2s ${i * 0.18}s infinite` }} />
              ))}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>AI 分析中...</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>正在生成专属分析报告</div>
          </div>
        )}

        {/* Applying template */}
        {phase === 'applying' && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ position: 'relative', width: '96px', height: '124px', margin: '0 auto 22px', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
              {[14, 26, 38, 54, 64, 74, 84, 96, 108].map((top, i) => (
                <div key={i} style={{ position: 'absolute', left: '10px', top: `${top}px`, width: i === 0 ? '44px' : i % 3 === 0 ? '66px' : i % 3 === 1 ? '54px' : '48px', height: i === 0 ? '5px' : '3px', background: i === 0 ? 'var(--theme-blue)' : '#e2e8f0', borderRadius: '2px', animation: `scanPulse 1.8s ${i * 0.08}s infinite` }} />
              ))}
              <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, var(--theme-blue) 30%, #14b8a6 50%, var(--theme-blue) 70%, transparent 100%)', boxShadow: '0 0 8px 3px rgba(13,148,136,0.35)', animation: 'scanLine 1.8s ease-in-out infinite' }} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>AI 扫描识别中...</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>正在匹配模板并填入简历内容</div>
          </div>
        )}

        {/* Result — non-resume error */}
        {phase === 'result' && uploadError === 'not_resume' && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>未检测到简历内容</div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
              请上传 PDF 或 Word 格式的简历文件，当前文件不像是简历
            </div>
            <button onClick={() => fileRef.current?.click()}
              style={{ width: '100%', padding: '11px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileUp size={14} /> 重新选择文件
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>关闭</button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && !uploadError && (
          <>
            {/* Upload: apply template button (prominent, at top) */}
            {flow === 'upload' && !templateApplied && (
              <div style={{ marginBottom: '14px' }}>
                <button
                  onClick={onApplyTemplate}
                  style={{
                    width: '100%', padding: '14px 12px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 20px rgba(15,23,42,0.35)',
                    animation: 'templatePulse 2.4s ease-in-out infinite',
                  }}
                >
                  <CheckCircle2 size={16} /> 使用当前模板（必须先点此步骤）
                </button>
                <p style={{ margin: '7px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                  导入内容将填入模板，之后即可逐条应用 AI 优化建议
                </p>
                <style>{`
                  @keyframes templatePulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(15,23,42,0.35); }
                    50% { box-shadow: 0 4px 28px rgba(14,165,233,0.55); }
                  }
                `}</style>
              </div>
            )}

            {/* Offer rate */}
            {showOfferRate && (
              <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', border: '1px solid rgba(14,165,233,0.28)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Target size={12} color="var(--ai-color-2)" />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>匹配 Offer 率</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '7px', background: 'rgba(14,165,233,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${offerRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--ai-color-1), var(--ai-color-2))', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: offerRate >= 70 ? '#16a34a' : offerRate >= 40 ? '#d97706' : '#dc2626', minWidth: '44px', textAlign: 'right' }}>{offerRate}%</div>
                </div>
              </div>
            )}

            {/* Overview */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', letterSpacing: '0.5px', marginBottom: '7px' }}>总体分析</div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                {analysis?.overview ?? (flow === 'current'
                  ? '简历结构清晰，工作经历描述详实。核心技能匹配度良好，建议进一步量化成果指标，突出差异化优势。'
                  : uploadFilename
                    ? `已成功识别「${uploadFilename}」内容。建议使用当前模板优化排版，提升投递竞争力。`
                    : '已成功识别上传的简历内容。建议使用当前模板优化排版，提升投递竞争力。')}
              </p>
            </div>

            {/* Interview questions (expandable) */}
            {interviewQuestions.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <style>{`
                  @keyframes answerSlide { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
                `}</style>
                <button
                  onClick={() => setShowInterviewQ(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: showInterviewQ ? '#f0f9ff' : '#f8fafc',
                    border: `1px solid ${showInterviewQ ? 'rgba(14,165,233,0.28)' : '#e2e8f0'}`,
                    borderRadius: showInterviewQ ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={9} color="white" />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>预测面试题</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>({interviewQuestions.length} 道)</span>
                  </div>
                  {showInterviewQ ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
                </button>

                {showInterviewQ && (
                  <div style={{
                    border: '1px solid rgba(14,165,233,0.25)', borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    background: '#f0f9ff',
                    maxHeight: '400px', overflowY: 'auto',
                  }}>
                    {interviewQuestions.map((q, i) => {
                      const hasAnswer = !!interviewAnswers[i]
                      const answerExpanded = expandedAnswers.has(i)
                      return (
                        <div key={i} style={{
                          borderTop: i > 0 ? '1px solid rgba(14,165,233,0.12)' : 'none',
                        }}>
                          <div
                            onClick={() => hasAnswer && toggleAnswer(i)}
                            style={{
                              display: 'flex', gap: '8px', alignItems: 'flex-start',
                              padding: '8px 12px',
                              cursor: hasAnswer ? 'pointer' : 'default',
                            }}
                          >
                            <span style={{
                              minWidth: '17px', height: '17px', borderRadius: '50%',
                              background: 'rgba(13,148,136,0.12)',
                              color: 'var(--teal)',
                              fontSize: '9px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: '2px',
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.6 }}>{q}</span>
                              {hasAnswer && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                                  <Lightbulb size={9} color="var(--teal)" />
                                  <span style={{ fontSize: '9.5px', color: 'var(--teal)', fontWeight: 600 }}>
                                    {answerExpanded ? '收起回答建议' : '查看回答建议'}
                                  </span>
                                  {answerExpanded
                                    ? <ChevronUp size={9} color="var(--teal)" />
                                    : <ChevronDown size={9} color="var(--teal)" />}
                                </div>
                              )}
                            </div>
                          </div>
                          {hasAnswer && answerExpanded && (
                            <div style={{
                              margin: '0 12px 8px 37px',
                              padding: '8px 10px',
                              background: 'rgba(13,148,136,0.07)',
                              borderRadius: '6px',
                              borderLeft: '2px solid var(--teal)',
                              animation: 'answerSlide 0.2s ease',
                            }}>
                              <p style={{ margin: 0, fontSize: '10.5px', color: '#334155', lineHeight: 1.65 }}>
                                {interviewAnswers[i]}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Per-suggestion cards */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  优化建议
                  {flow === 'current' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>（对应位置已标注 ✦ AI建议）</span>}
                  {flow === 'upload' && templateApplied && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>（已识别的简历版块）</span>}
                  {flow === 'upload' && !templateApplied && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>（使用当前模板后可逐条应用）</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestions.map((s) => {
                    const applied = appliedSuggestionIds?.has(s.id)
                    const canApply = optimizeEnabled && !applied
                    return (
                      <div key={s.id} style={{
                        padding: '10px 12px', borderRadius: '10px',
                        border: applied ? '1px solid #bbf7d0' : '1px solid rgba(7, 137, 236, 0.25)',
                        background: applied ? '#f0fdf4' : 'linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))',
                        transition: 'all 0.2s',
                      }}>
                        {/* Header */}
                        <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px', color: applied ? '#16a34a' : '#fff' }}>
                          {applied ? (
                            <><CheckCircle2 size={12} color="#16a34a" /> 已应用</>
                          ) : (
                            <><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', flexShrink: 0 }} /> AI 优化结果</>
                          )}
                        </div>
                        {/* Label and tip */}
                        <div style={{ fontSize: '11px', fontWeight: 600, color: applied ? '#334155' : 'rgba(255,255,255,0.92)', marginBottom: '2px' }}>{s.label}</div>
                        <div style={{ fontSize: '10.5px', color: applied ? 'var(--theme-blue)' : 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '8px' }}>{s.tip}</div>
                        {/* Full optimized content */}
                        {s.section === 'summary' ? (
                          <p style={{ margin: 0, fontSize: '11px', color: applied ? '#475569' : 'white', lineHeight: 1.65 }}>
                            {Array.isArray(s.optimizedContent)
                              ? (s.optimizedContent as string[]).filter(Boolean).join(' ')
                              : (s.optimizedContent as string).replace(/\n+/g, ' ')}
                          </p>
                        ) : Array.isArray(s.optimizedContent) ? (
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {(s.optimizedContent as string[]).map((b, bi) => (
                              <li key={bi} style={{ fontSize: '11px', color: applied ? '#475569' : 'white', lineHeight: 1.6, marginBottom: '2px' }}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, fontSize: '11px', color: applied ? '#475569' : 'white', lineHeight: 1.55 }}>
                            {(s.optimizedContent as string).replace(/\n+/g, ' ')}
                          </p>
                        )}
                        {/* Apply button */}
                        {!applied && (
                          <button
                            onClick={canApply ? () => onApplySuggestion(s) : undefined}
                            disabled={!canApply}
                            style={{
                              width: '100%', marginTop: '10px', padding: '7px',
                              background: 'var(--theme-blue)',
                              color: 'white', border: '1px solid white', borderRadius: '6px',
                              fontFamily: 'var(--font-sans)', fontSize: '12px',
                              cursor: canApply ? 'pointer' : 'not-allowed', fontWeight: 500,
                              opacity: canApply ? 1 : 0.5,
                            }}
                          >✓ 应用优化</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Apply all */}
            {optimizeEnabled && unappliedCount > 0 && (
              <button
                onClick={onApplyAll}
                style={{ width: '100%', padding: '12px', marginBottom: '10px', background: 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
              >
                <Sparkles size={14} /> 全部应用（{unappliedCount} 条）
              </button>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>关闭</button>
          </>
        )}

      </div>
    </div>
  )
}

const aiPanelLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
  textTransform: 'uppercase', color: '#64748b',
  display: 'block', marginBottom: '6px',
}

export function ImportModal({ filename, loading, onStart, onClose }: {
  filename: string
  loading: boolean
  onStart: () => void
  onClose: () => void
}) {
  return (
    <ModalWrap onClose={loading ? () => {} : onClose}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <style>{`@keyframes impBounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-8px);opacity:1}}`}</style>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-blue)',
                animation: `impBounce 1.2s ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>正在匹配当前模版</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>正在导入「{filename}」，请稍候...</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#e0f0fd', border: '1px solid rgba(13,148,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileUp size={15} color="var(--theme-blue)" />
            </div>
            <div style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>导入简历</div>
          </div>

          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
            padding: '14px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <CheckCircle2 size={18} color="var(--theme-blue)" />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{filename}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>将使用默认免费模版导入简历内容</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', background: 'transparent',
              fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', color: '#64748b',
            }}>取消</button>
            <button onClick={onStart} style={{
              flex: 2, padding: '12px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, var(--theme-blue), #0c5cbd)',
              color: 'white', fontFamily: 'var(--font-sans)',
              fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
            }}>开始导入</button>
          </div>
        </>
      )}
    </ModalWrap>
  )
}

export function PaymentModal({
  templateName, onClose, onSuccess
}: {
  templateName: string; onClose: () => void; onSuccess: () => void
}) {
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePay = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setPaid(true) }, 2000)
  }

  return (
    <ModalWrap onClose={onClose}>
      {paid ? (
        <>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={48} color="var(--theme-blue)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>支付成功！</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>已解锁「{templateName}」无水印下载</p>
            <button onClick={() => { onSuccess(); onClose() }} style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              background: 'var(--theme-blue)', color: 'white', border: 'none',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}>立即下载无水印版</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>解锁模板</div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
            解锁「{templateName}」· 永久使用 · 无水印下载
          </p>
          {/* Mock WeChat QR code */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px', background: '#f8fafc', borderRadius: '12px',
            marginBottom: '14px', border: '1px solid #e2e8f0',
          }}>
            <Smartphone size={16} color="#64748b" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>微信扫码支付</div>
            {/* QR code placeholder */}
            <div style={{
              width: '140px', height: '140px', background: 'white',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <QrCode size={100} color="#0f172a" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '12px' }}>¥19</div>
          </div>
          <button onClick={handlePay} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            background: loading ? '#94a3b8' : '#07c160',
            color: 'white', border: 'none',
            fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'var(--font-sans)', marginBottom: '8px',
          }}>
            {loading ? '支付确认中...' : '模拟支付（测试）'}
          </button>
          <button onClick={onClose} style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: 'transparent',
            fontSize: '13px', cursor: 'pointer', color: '#64748b',
            fontFamily: 'var(--font-sans)',
          }}>取消</button>
        </>
      )}
    </ModalWrap>
  )
}

// ─────────────────────────────────────────────────────────────
// Photo crop / position modal
// ─────────────────────────────────────────────────────────────
export function PhotoCropModal({
  src, initialMeta, onConfirm, onReplace, onRemove, onClose,
}: {
  src: string
  initialMeta?: { x: number; y: number; scale: number; natW?: number; natH?: number }
  onConfirm: (meta: { x: number; y: number; scale: number; natW: number; natH: number }) => void
  onReplace: () => void
  onRemove: () => void
  onClose: () => void
}) {
  const PREVIEW = 240

  const [scale, setScale] = useState(initialMeta?.scale ?? 1)
  const [pos, setPos]     = useState({ x: initialMeta?.x ?? 0, y: initialMeta?.y ?? 0 })
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(
    initialMeta?.natW ? { w: initialMeta.natW, h: initialMeta.natH! } : null
  )
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Load natural dimensions whenever src changes (e.g. user replaces photo)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])

  // Compute cover-fit base dimensions that preserve the image's natural aspect ratio.
  // At scale=1 the image exactly covers the circle; at scale>1 it's proportionally larger.
  const nat = natSize ?? { w: PREVIEW, h: PREVIEW }
  const coverScale = Math.max(PREVIEW / nat.w, PREVIEW / nat.h)
  const baseW = nat.w * coverScale
  const baseH = nat.h * coverScale
  const renderedW = baseW * scale
  const renderedH = baseH * scale

  // Per-axis pan limits: image must always fully cover the circle in both dimensions.
  // A portrait image (baseH > PREVIEW) can be panned vertically even at scale=1.
  // A landscape image (baseW > PREVIEW) can be panned horizontally even at scale=1.
  const maxOffX = Math.max(0, (renderedW - PREVIEW) / (2 * PREVIEW))
  const maxOffY = Math.max(0, (renderedH - PREVIEW) / (2 * PREVIEW))
  const cx = Math.max(-maxOffX, Math.min(maxOffX, pos.x))
  const cy = Math.max(-maxOffY, Math.min(maxOffY, pos.y))

  const imgLeft = (PREVIEW - renderedW) / 2 + cx * PREVIEW
  const imgTop  = (PREVIEW - renderedH) / 2 + cy * PREVIEW

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: cx, py: cy }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = (e.clientX - dragRef.current.sx) / PREVIEW
    const dy = (e.clientY - dragRef.current.sy) / PREVIEW
    setPos({ x: dragRef.current.px + dx, y: dragRef.current.py + dy })
  }
  const onUp = () => { dragRef.current = null; setDragging(false) }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.max(1, Math.min(3, s - e.deltaY * 0.001)))
  }

  // Hint text that adapts to image orientation
  const hint = !natSize ? '加载中…'
    : baseH > PREVIEW + 1 && baseW > PREVIEW + 1 ? '拖拽移动 · 滚轮或滑块缩放'
    : baseH > PREVIEW + 1 ? '上下拖拽调整位置 · 缩放查看更多'
    : baseW > PREVIEW + 1 ? '左右拖拽调整位置 · 缩放查看更多'
    : '拖拽移动 · 滚轮或滑块缩放'

  const btnBase: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'background 0.15s',
  }

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', textAlign: 'center' }}>
        调整照片
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>
        {hint}
      </div>

      {/* Circular crop preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onWheel={onWheel}
          style={{
            width: PREVIEW, height: PREVIEW, borderRadius: '50%',
            overflow: 'hidden', position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none', touchAction: 'none',
            boxShadow: '0 0 0 3px #6366f130, 0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false}
            style={{
              position: 'absolute',
              width: `${renderedW}px`, height: `${renderedH}px`,
              left: `${imgLeft}px`, top: `${imgTop}px`,
              pointerEvents: 'none', userSelect: 'none',
            }}
          />
        </div>
      </div>

      {/* Zoom slider */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '12px', color: '#64748b', marginBottom: '8px',
        }}>
          <span>缩放</span>
          <span style={{ fontWeight: 600, color: '#334155' }}>{Math.round(scale * 100)}%</span>
        </div>
        <input type="range" min={1} max={3} step={0.02} value={scale}
          onChange={e => setScale(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onRemove}
          style={{ ...btnBase, border: '1.5px solid #fee2e2', background: '#fff5f5', color: '#ef4444' }}>
          移除
        </button>
        <button onClick={onReplace}
          style={{ ...btnBase, flex: 1, border: '1.5px solid #e2e8f0', background: 'white', color: '#334155' }}>
          更换照片
        </button>
        <button
          disabled={!natSize}
          onClick={() => natSize && onConfirm({ x: cx, y: cy, scale, natW: natSize.w, natH: natSize.h })}
          style={{ ...btnBase, flex: 1, border: 'none', background: natSize ? '#0f172a' : '#94a3b8', color: 'white', fontWeight: 600 }}>
          确认
        </button>
      </div>
    </ModalWrap>
  )
}

// ─────────────────────────────────────────────────────────────
// Paywall modal
// ─────────────────────────────────────────────────────────────

export type PaywallTrigger =
  | 'download_free'   // free template, offer watermark-free upgrade + free download option
  | 'download_pro'    // pro template, must pay (no free option)
  | 'ai_optimize'     // AI bullet rewrite locked
  | 'ai_analyze'      // job match analysis locked
  | 'import_limit'    // daily import quota hit
  | 'upgrade'         // direct upgrade from pricing page

export interface PaywallModalProps {
  trigger: PaywallTrigger
  resumeId?: string           // current resume ID (for single purchase binding)
  templateId?: string         // current template ID (for single purchase binding)
  deviceId: string
  isStudent: boolean
  isFirstOrder: boolean       // true → show ¥0.99 first-order price
  onClose: () => void
  onSuccess: (planType: PlanType, orderId: string) => void
  onFreeDownload?: () => void // only for 'download_free'
  onOpenStudent: () => void
}

const TRIGGER_COPY: Record<PaywallTrigger, { title: string; sub: string }> = {
  download_free:  { title: '升级 Pro 享无水印下载',    sub: '去掉简历底部水印，更专业地投递' },
  download_pro:   { title: '解锁 Pro 模板',             sub: '付费解锁这套模板，即刻无水印下载' },
  ai_optimize:    { title: '解锁 AI 内容优化',           sub: '让 AI 帮你重写经历描述，提升竞争力' },
  ai_analyze:     { title: '解锁岗位匹配分析',            sub: '分析简历与 JD 的匹配度，获得针对性建议' },
  import_limit:   { title: '今日导入次数已用完',           sub: '免费用户每天可导入 2 份，升级 Pro 每天 10 份' },
  upgrade:        { title: '升级 Pro 会员',               sub: '解锁全部功能 · 无水印下载 · AI 优化无限次' },
}

const PLAN_META = {
  monthly:   { label: '月卡', period: '月', badge: '',         saving: '' },
  quarterly: { label: '季卡', period: '季', badge: '最受欢迎', saving: '省21%' },
  yearly:    { label: '年卡', period: '年', badge: '',         saving: '省52%' },
}

const SUB_BENEFITS = [
  '全部 50+ 套精美模板',
  '无水印 PDF 下载',
  'AI 优化 100次/天',
  '简历智能解析',
  '岗位匹配分析',
  'Word / PNG 导出',
]

const SINGLE_BENEFITS = [
  '本份简历无水印下载',
  'AI 优化 5次',
  '永久重新下载',
]

function fmtFen(fen: number): string {
  const y = fen / 100
  return `¥${y % 1 === 0 ? y : y.toFixed(2)}`
}

type PaywallPhase = 'plans' | 'paying' | 'success'
type ActiveTab = 'single' | 'sub'

export function PaywallModal({
  trigger, resumeId, templateId, deviceId,
  isStudent, isFirstOrder,
  onClose, onSuccess, onFreeDownload, onOpenStudent,
}: PaywallModalProps) {
  const [tab, setTab]             = useState<ActiveTab>('sub')
  const [phase, setPhase]         = useState<PaywallPhase>('plans')
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly')
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat')
  const [pendingType, setPendingType] = useState<PlanType | null>(null)
  const [pendingOrder, setPendingOrder] = useState('')

  const copy           = TRIGGER_COPY[trigger]
  const showFreeOption = trigger === 'download_free' && !!onFreeDownload

  const singlePrice = isFirstOrder
    ? PRICES.singleFirst.normal
    : isStudent ? PRICES.single.student : PRICES.single.normal

  const subPrice = (p: 'monthly' | 'quarterly' | 'yearly') =>
    isStudent ? PRICES[p].student : PRICES[p].normal

  function startPay(planType: PlanType, method: PayMethod) {
    const orderId = generateOrderId()
    setPendingType(planType)
    setPendingOrder(orderId)
    setPayMethod(method)
    setPhase('paying')
  }

  function devPaid() {
    if (!pendingType) return
    const now      = Date.now()
    const amount   = pendingType === 'single'    ? singlePrice
                   : pendingType === 'monthly'   ? subPrice('monthly')
                   : pendingType === 'quarterly' ? subPrice('quarterly')
                   :                               subPrice('yearly')
    const expiresAt = pendingType !== 'single'
      ? now + PLAN_DURATION_MS[pendingType]
      : undefined

    addPayment({
      orderId: pendingOrder, deviceId,
      planType: pendingType, amount, isStudent,
      resumeId:   pendingType === 'single' ? resumeId   : undefined,
      templateId: pendingType === 'single' ? templateId : undefined,
      paidAt: now, expiresAt, payMethod,
      aiOptimizeUsed: 0, aiAnalyzeUsed: 0,
    })
    setPhase('success')
    setTimeout(() => { onSuccess(pendingType!, pendingOrder); onClose() }, 1200)
  }

  const payingAmount = !pendingType ? 0
    : pendingType === 'single'    ? singlePrice
    : pendingType === 'monthly'   ? subPrice('monthly')
    : pendingType === 'quarterly' ? subPrice('quarterly')
    :                               subPrice('yearly')

  // ── Success overlay ──────────────────────────────────────────
  if (phase === 'success') {
    return (
      <ModalWrap onClose={() => {}}>
        <style>{`@keyframes pwSuccess{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ textAlign: 'center', padding: '28px 16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', animation: 'pwSuccess 0.4s ease',
          }}>
            <CheckCircle2 size={34} color="#16a34a" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>支付成功！</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>正在为你解锁权益…</div>
        </div>
      </ModalWrap>
    )
  }

  // ── QR / paying phase ────────────────────────────────────────
  if (phase === 'paying') {
    return (
      <ModalWrap onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setPhase('plans')} style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            border: '1.5px solid #e2e8f0', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', fontSize: '16px', fontFamily: 'var(--font-sans)',
          }}>←</button>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>扫码支付</div>
        </div>


        {/* Fake QR */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            padding: '22px', background: '#f8fafc',
            borderRadius: '12px', border: '1px solid #e2e8f0',
          }}>
            <QrCode size={128} color="#0f172a" />
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '14px' }}>
              {fmtFen(payingAmount)}
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
              订单号 {pendingOrder}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
            请使用微信扫描上方二维码完成支付
          </div>
        </div>

        <button onClick={devPaid} style={{
          width: '100%', padding: '13px', borderRadius: '10px', marginBottom: '10px',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: 'white', border: 'none', fontFamily: 'var(--font-sans)',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          ✅ [DEV] 模拟支付成功
        </button>
        <button onClick={() => setPhase('plans')} style={{
          width: '100%', padding: '10px', borderRadius: '8px',
          border: '1.5px solid #e2e8f0', background: 'white',
          fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', color: '#64748b',
        }}>取消</button>
      </ModalWrap>
    )
  }

  // ── Plans phase ──────────────────────────────────────────────
  return (
    <ModalWrap onClose={onClose} wide>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{copy.title}</div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{copy.sub}</div>
        </div>
        <button onClick={onClose} style={{
          width: '28px', height: '28px', flexShrink: 0, marginLeft: '12px',
          borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', fontSize: '16px', fontFamily: 'var(--font-sans)',
        }}>×</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
        {(['single', 'sub'] as ActiveTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            border: 'none', transition: 'all 0.15s',
            background: tab === t ? 'white' : 'transparent',
            color: tab === t ? '#0f172a' : '#64748b',
            boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
          }}>
            {t === 'single' ? '单次解锁' : '订阅 Pro'}
          </button>
        ))}
      </div>

      {/* ── Single tab ────────────────────────────────────── */}
      {tab === 'single' && (
        <>
          <div style={{
            background: '#f8fafc', borderRadius: '12px',
            border: '1.5px solid #e2e8f0', padding: '18px', marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{fmtFen(singlePrice)}</div>
              {isFirstOrder && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: '#ef4444', borderRadius: '6px', padding: '2px 8px' }}>首单特惠</span>
              )}
              {isStudent && !isFirstOrder && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: 'var(--teal)', borderRadius: '6px', padding: '2px 8px' }}>学生价</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>本份简历 · 永久使用 · 不过期</div>
            {SINGLE_BENEFITS.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span style={{ fontSize: '13px', color: '#334155' }}>{b}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: showFreeOption ? '10px' : 0 }}>
            <button onClick={() => startPay('single', 'wechat')} style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              background: '#07c160',
              color: 'white', fontFamily: 'var(--font-sans)',
              fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
            }}>
              微信支付
            </button>
          </div>

          {showFreeOption && (
            <button onClick={onFreeDownload} style={{
              width: '100%', padding: '10px', border: 'none', background: 'transparent',
              fontFamily: 'var(--font-sans)', fontSize: '12px',
              color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline',
            }}>
              免费下载（带水印）
            </button>
          )}
        </>
      )}

      {/* ── Sub tab ───────────────────────────────────────── */}
      {tab === 'sub' && (
        <>
          {/* Plan cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {(['monthly', 'quarterly', 'yearly'] as const).map(plan => {
              const meta        = PLAN_META[plan]
              const price       = subPrice(plan)
              const active      = selectedPlan === plan
              const isHighlight = plan === 'quarterly'
              return (
                <div key={plan} onClick={() => setSelectedPlan(plan)} style={{
                  padding: '13px 16px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${active ? (isHighlight ? 'var(--theme-blue)' : '#334155') : '#e2e8f0'}`,
                  background: active ? (isHighlight ? '#e0f0fd' : '#f8fafc') : 'white',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s',
                }}>
                  {/* Radio */}
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${active ? (isHighlight ? 'var(--theme-blue)' : '#334155') : '#cbd5e1'}`,
                    background: active ? (isHighlight ? 'var(--theme-blue)' : '#334155') : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                  {/* Labels */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{meta.label}</span>
                      {meta.badge && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', background: 'var(--theme-blue)', borderRadius: '5px', padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Star size={8} fill="white" strokeWidth={0} />
                          {meta.badge}
                        </span>
                      )}
                      {isStudent && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', background: 'var(--teal)', borderRadius: '5px', padding: '1px 7px' }}>学生价</span>
                      )}
                    </div>
                    {meta.saving && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>{meta.saving}</span>
                    )}
                  </div>
                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '21px', fontWeight: 800, color: active && isHighlight ? 'var(--theme-blue)' : '#0f172a' }}>
                      {fmtFen(price)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>/{meta.period}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pro benefits */}
          <div style={{
            background: '#f8fafc', borderRadius: '10px',
            border: '1px solid #e2e8f0', padding: '14px', marginBottom: '14px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '10px' }}>Pro 会员权益</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 0' }}>
              {SUB_BENEFITS.map((b, i) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '50%', paddingRight: i % 2 === 0 ? '8px' : 0 }}>
                  <CheckCircle2 size={12} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#334155' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay button */}
          <div style={{ marginBottom: '10px' }}>
            <button onClick={() => startPay(selectedPlan, 'wechat')} style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              background: '#07c160',
              color: 'white', fontFamily: 'var(--font-sans)',
              fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
            }}>
              微信支付
            </button>
          </div>

          {/* Student link */}
          <button onClick={onOpenStudent} style={{
            width: '100%', padding: '9px', border: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#64748b', cursor: 'pointer',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <GraduationCap size={16} />
              学生认证享全场5折 →
            </span>
          </button>
        </>
      )}
    </ModalWrap>
  )
}

// ─────────────────────────────────────────────────────────────
// Student verification modal
// ─────────────────────────────────────────────────────────────

export function StudentModal({
  deviceId, onClose, onSuccess,
}: {
  deviceId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const [sending, setSending]   = useState(false)

  const isEduEmail = (e: string) => /\.edu(\.cn)?$|@edu\./i.test(e.toLowerCase())

  function sendCode() {
    if (!isEduEmail(email)) { setError('请输入 .edu.cn 或 .edu 结尾的校园邮箱'); return }
    setError('')
    setSending(true)
    setTimeout(() => { setSending(false); setCodeSent(true) }, 800)
  }

  function verify() {
    if (code.trim() !== '123456') { setError('验证码错误，模拟环境验证码为 123456'); return }
    const now = Date.now()
    setStudentRecord({ deviceId, email, certifiedAt: now, expiresAt: now + 365 * 86_400_000 })
    setDone(true)
    setTimeout(() => { onSuccess(); onClose() }, 1200)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    borderRadius: '8px', border: '1.5px solid #e2e8f0',
    fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#0f172a',
    outline: 'none', background: '#f8fafc',
  }

  if (done) {
    return (
      <ModalWrap onClose={() => {}}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <GraduationCap size={44} color="var(--theme-blue)" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>认证成功！</div>
          <div style={{ fontSize: '13px', color: '#16a34a' }}>已开启全场 5 折学生优惠</div>
        </div>
      </ModalWrap>
    )
  }

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GraduationCap size={20} color="var(--theme-blue)" /> 学生认证
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px', lineHeight: 1.5 }}>
        认证成功后享全场 5 折，有效期 1 年
      </div>

      {/* Email */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>校园邮箱</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="example@university.edu.cn"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
          />
          <button onClick={sendCode} disabled={sending || codeSent} style={{
            padding: '10px 13px', borderRadius: '8px', border: 'none', flexShrink: 0,
            background: codeSent ? '#f0fdf4' : 'var(--theme-blue)',
            color: codeSent ? '#16a34a' : 'white',
            fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
            cursor: sending || codeSent ? 'default' : 'pointer',
          }}>
            {codeSent ? '✓ 已发送' : sending ? '发送中…' : '发送验证码'}
          </button>
        </div>
      </div>

      {/* Code */}
      {codeSent && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>验证码</label>
          <input
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            placeholder="6位验证码"
            maxLength={6}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
          />
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            💡 模拟环境验证码为 <strong style={{ color: '#334155' }}>123456</strong>
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {codeSent && (
        <button onClick={verify} disabled={!code} style={{
          width: '100%', padding: '13px', borderRadius: '10px', border: 'none', marginBottom: '14px',
          background: code ? 'linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))' : '#e2e8f0',
          color: code ? 'white' : '#94a3b8',
          fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700,
          cursor: code ? 'pointer' : 'not-allowed',
        }}>
          确认认证
        </button>
      )}

      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#15803d', lineHeight: 1.8 }}>
        ✓ 全场 5 折&nbsp;·&nbsp;✓ 月卡 ¥14.9&nbsp;·&nbsp;年卡 ¥84&nbsp;·&nbsp;✓ 一次认证有效期 1 年
      </div>
    </ModalWrap>
  )
}

function ModalWrap({ children, onClose, wide, disableBackdropClose }: { children: React.ReactNode; onClose: () => void; wide?: boolean; disableBackdropClose?: boolean }) {
  return (
    <div onClick={disableBackdropClose ? undefined : (e => e.target === e.currentTarget && onClose())} className="no-print"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '28px',
        width: wide ? '480px' : '420px',
        maxWidth: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
        animation: 'fadeUp 0.2s ease',
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        {children}
      </div>
    </div>
  )
}
