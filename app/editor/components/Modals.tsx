'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { FileDown, FileType, ImageIcon, FileUp, CheckCircle2, Sparkles, X, QrCode, Smartphone, FilePen, Plus, Target, ChevronDown, ChevronUp, MessageSquare, Lightbulb, GraduationCap, Star } from 'lucide-react'
import type { AISuggestion } from '../../lib/types'
import { hasDiffMarkup, parseDiffBullet } from '../../lib/types'
import ImportLoadingBar from '../../components/ImportLoadingBar'
import { addPayment, generateOrderId, PRICES, PLAN_DURATION_MS, setStudentRecord, hasRedeemedCode, markCodeRedeemed } from '../../lib/payment'
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
  onClose, onPrintPDF, onDownloadPNG,
  isPro, isPaid, onUnlockPro,
}: {
  onClose: () => void
  onPrintPDF: () => void
  onDownloadPNG?: () => void
  isPro?: boolean
  isPaid?: boolean
  onUnlockPro?: () => void
}) {
  const proRows = [
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

function formatSkillTag(s: string): string {
  return s
    .replace(/^无([^\s])/, '需$1')
    .replace(/^不会/, '需掌握')
    .replace(/^[缺欠]乏?/, '需')
    .replace(/^需需/, '需')
}

type AIPanelPhase = 'entry' | 'analyzing' | 'result' | 'applying'

interface AIPanelProps {
  flow: 'current' | 'upload'
  phase: AIPanelPhase
  uploadFilename: string
  templateApplied: boolean
  optimizeEnabled: boolean
  optimizing?: boolean
  analysis?: { hasOfferRate?: boolean; offerRate?: number; overview: string; suggestions: AISuggestion[]; interviewQuestions?: string[]; interviewAnswers?: string[]; missingSkills?: string[]; jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null; matchBreakdown?: { overall?: number; experience: number; skills: number; other: number } | null } | null
  appliedSuggestionIds?: Set<string>
  uploadError?: string
  jobDesc: string
  currentSkills?: string[]
  onJobDescChange: (v: string) => void
  onAnalyzeCurrent: (jobDesc: string) => void
  onSelectFile: (file: File) => void
  onApplyTemplate: () => void
  onApplySuggestion: (s: AISuggestion, checkedSkills?: string[]) => void
  onApplyAll: () => void
  onClose: () => void
  onSkillChecksChange?: (skills: string[]) => void
}

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

export function AIPanel({
  flow, phase, uploadFilename, templateApplied, optimizeEnabled,
  analysis, appliedSuggestionIds, uploadError, jobDesc, currentSkills, onJobDescChange,
  onAnalyzeCurrent, onSelectFile, onApplyTemplate, onApplySuggestion, onApplyAll, onClose, onSkillChecksChange,
}: AIPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showInterviewQ, setShowInterviewQ] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())
  const [editorAnimRate, setEditorAnimRate] = useState(0)
  const [skillChecks, setSkillChecks] = useState<Record<string, boolean>>({})
  const onSkillChecksChangeRef = useRef(onSkillChecksChange)
  useEffect(() => { onSkillChecksChangeRef.current = onSkillChecksChange })
  useEffect(() => {
    const checked = Object.entries(skillChecks).filter(([, v]) => v).map(([k]) => k)
    onSkillChecksChangeRef.current?.(checked)
  }, [skillChecks])

  const PROGRESS_MSGS = ['正在读取简历内容…', '识别工作经历与技能…', '评估岗位匹配度…', '生成优化建议…', '生成面试题…']
  const [progressIdx, setProgressIdx] = useState(0)

  useEffect(() => {
    if (phase !== 'analyzing') { setProgressIdx(0); return }
    const delays = [0, 3500, 7000, 10500, 14000]
    const timers = delays.map((d, i) => setTimeout(() => setProgressIdx(i), d))
    return () => timers.forEach(clearTimeout)
  }, [phase])

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

  const showOfferRate = analysis?.hasOfferRate === true
  const offerRate = analysis?.offerRate ?? 0
  const rawSuggestions = useMemo(() => analysis?.suggestions ?? [], [analysis])
  // Summary suggestion always first
  const suggestions = [...rawSuggestions].sort((a, b) =>
    a.section === 'summary' ? -1 : b.section === 'summary' ? 1 : 0
  )
  const interviewQuestions = analysis?.interviewQuestions ?? []
  const interviewAnswers = analysis?.interviewAnswers ?? []
  const unappliedCount = suggestions.filter(s => !appliedSuggestionIds?.has(s.id)).length

  // Initialize skill checkboxes when suggestions arrive — pre-check new skills only
  useEffect(() => {
    const normalize = (s: string) => s.toLowerCase().trim()
    const existingSet = new Set((currentSkills ?? []).map(normalize))
    const checks: Record<string, boolean> = {}
    for (const s of rawSuggestions) {
      if (s.section === 'skills' && Array.isArray(s.optimizedContent)) {
        for (const skill of s.optimizedContent as string[]) {
          checks[skill] = !existingSet.has(normalize(skill))
        }
      }
    }
    setSkillChecks(checks)
  }, [rawSuggestions, currentSkills])

  useEffect(() => {
    if (!showOfferRate) { setEditorAnimRate(0); return }
    const t = setTimeout(() => setEditorAnimRate(offerRate), 80)
    return () => clearTimeout(t)
  }, [showOfferRate, offerRate])

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* JD textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={aiPanelLabel}>
                  目标职位描述{' '}
                  <span style={{ fontWeight: 400, fontSize: '11px', letterSpacing: 0, textTransform: 'none', color: '#94a3b8' }}>（可选，但强烈推荐）</span>
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
                placeholder="粘贴目标岗位 JD，AI 将精准命中岗位关键词..."
                rows={4}
                style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#0f172a', background: '#f8fafc', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
              />
              {/* Sample JD chips */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500, marginRight: '6px' }}>试试：</span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '5px', verticalAlign: 'middle' }}>
                  {SAMPLE_JDS.map(jd => (
                    <button
                      key={jd.label}
                      onClick={() => onJobDescChange(jd.text)}
                      style={{
                        padding: '3px 9px', borderRadius: '20px', border: '1px solid #e2e8f0',
                        background: jobDesc === jd.text ? 'linear-gradient(135deg, #ede9fe, #fce7f3)' : '#f8fafc',
                        color: jobDesc === jd.text ? '#7c3aed' : '#475569',
                        fontSize: '10.5px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'all 0.15s',
                        borderColor: jobDesc === jd.text ? '#c4b5fd' : '#e2e8f0',
                      }}
                      onMouseEnter={e => { if (jobDesc !== jd.text) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' } }}
                      onMouseLeave={e => { if (jobDesc !== jd.text) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' } }}
                    >{jd.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Value proposition card */}
            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)',
              border: '1px solid #ede9fe',
              borderRadius: '10px',
              padding: '11px 13px',
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#6d28d9', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={11} color="#8b5cf6" />
                为什么强烈建议添加目标职位？
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.65 }}>
                AI 将根据目标岗位的硬核技术栈与关键词进行<strong style={{ color: '#6d28d9' }}>精准定向微调</strong>，直击 HR 痛点，匹配率暴增。
              </div>
            </div>

            {/* Main CTA button — dynamic based on jobDesc */}
            <button
              onClick={() => onAnalyzeCurrent(jobDesc)}
              style={{
                width: '100%', padding: '13px',
                background: jobDesc.trim()
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
                  : 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))',
                color: 'white', border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '7px',
                boxShadow: jobDesc.trim() ? '0 4px 16px rgba(124,58,237,0.35)' : '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            >
              {jobDesc.trim() ? <><Sparkles size={14} />✨ 开始精准定向优化</> : '开始常规智能解析'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>或</span>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
            </div>

            {/* Upload button */}
            <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '11px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '10px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
            >
              <FileUp size={14} /> 上传简历解析
            </button>
          </div>
        )}

        {/* Analyzing */}
        {phase === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-blue)', animation: `aipB 1.2s ${i * 0.18}s infinite` }} />
              ))}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>AI 分析中...</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>正在生成专属分析报告</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', transition: 'opacity 0.4s', minHeight: '16px' }}>
              {PROGRESS_MSGS[progressIdx]}
            </div>
          </div>
        )}

        {/* Applying template */}
        {phase === 'applying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '96px', height: '124px', margin: '0 auto 22px', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
              {[14, 26, 38, 54, 64, 74, 84, 96, 108].map((top, i) => (
                <div key={i} style={{ position: 'absolute', left: '10px', top: `${top}px`, width: i === 0 ? '44px' : i % 3 === 0 ? '66px' : i % 3 === 1 ? '54px' : '48px', height: i === 0 ? '5px' : '3px', background: i === 0 ? 'var(--theme-blue)' : '#e2e8f0', borderRadius: '2px', animation: `scanPulse 1.8s ${i * 0.08}s infinite` }} />
              ))}
              <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, var(--highlight) 30%, #ff8c00 50%, var(--highlight) 70%, transparent 100%)', boxShadow: '0 0 8px 3px rgba(255,103,0,0.35)', animation: 'scanLine 1.8s ease-in-out infinite' }} />
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
                  <CheckCircle2 size={16} /> 使用当前模板
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

            {/* Offer rate — current vs post-optimization */}
            {showOfferRate && (() => {
              const optimizedRate = Math.min(95, offerRate + 15)
              const offerColor = offerRate >= 70 ? '#22c55e' : offerRate >= 50 ? '#eab308' : offerRate >= 30 ? '#f97316' : '#ef4444'
              return (
                <div style={{ background: '#0a0a0f', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={9} color="rgba(255,255,255,0.35)" /> 拿到 Offer 率预测
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>当前预计</div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '30px', fontWeight: 800, color: offerColor, lineHeight: 1 }}>{offerRate}%</div>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 700, textAlign: 'center' }}>→<br/>AI优化</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>优化后预计</div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '30px', fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>{optimizedRate}%</div>
                      <div style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600, marginTop: '3px' }}>+{optimizedRate - offerRate}%</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${editorAnimRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-blue), #22c55e)', borderRadius: '2px', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              )
            })()}

            {/* Overview */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>总体评估</div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, margin: 0, padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {analysis?.overview ?? (flow === 'current'
                  ? '简历结构清晰，工作经历描述详实。核心技能匹配度良好，建议进一步量化成果指标，突出差异化优势。'
                  : uploadFilename
                    ? `已成功识别「${uploadFilename}」内容。建议使用当前模板优化排版，提升投递竞争力。`
                    : '已成功识别上传的简历内容。建议使用当前模板优化排版，提升投递竞争力。')}
              </p>
            </div>

            {/* Missing skills tags */}
            {showOfferRate && analysis?.missingSkills && analysis.missingSkills.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>职位不符部分</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {analysis.missingSkills.map((skill, i) => (
                    <span key={i} style={{ fontSize: '11px', fontWeight: 500, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 9px', borderRadius: '5px', fontFamily: 'var(--font-sans)' }}>{formatSkillTag(skill)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview questions (expandable) */}
            {interviewQuestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <style>{`
                  @keyframes answerSlide { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
                `}</style>
                <button
                  onClick={() => setShowInterviewQ(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: showInterviewQ ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
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
                  <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#f8fafc', maxHeight: '320px', overflowY: 'auto' }}>
                    {interviewQuestions.map((q, i) => {
                      const hasAnswer = !!interviewAnswers[i]
                      const answerExpanded = expandedAnswers.has(i)
                      return (
                        <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(14,165,233,0.12)' : 'none' }}>
                          <div onClick={() => hasAnswer && toggleAnswer(i)} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', cursor: hasAnswer ? 'pointer' : 'default' }}>
                            <span style={{ minWidth: '17px', height: '17px', borderRadius: '50%', background: 'rgba(13,148,136,0.12)', color: 'var(--teal)', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.6 }}>{q}</span>
                              {hasAnswer && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                                  <Lightbulb size={9} color="var(--teal)" />
                                  <span style={{ fontSize: '9.5px', color: 'var(--teal)', fontWeight: 600 }}>{answerExpanded ? '收起' : '回答建议'}</span>
                                  {answerExpanded ? <ChevronUp size={9} color="var(--teal)" /> : <ChevronDown size={9} color="var(--teal)" />}
                                </div>
                              )}
                            </div>
                          </div>
                          {hasAnswer && answerExpanded && (
                            <div style={{ margin: '0 12px 8px 37px', padding: '8px 10px', background: 'rgba(13,148,136,0.07)', borderRadius: '6px', borderLeft: '2px solid var(--teal)', animation: 'answerSlide 0.2s ease' }}>
                              <p style={{ margin: 0, fontSize: '10.5px', color: '#334155', lineHeight: 1.65 }}>{interviewAnswers[i]}</p>
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
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  优化方向
                  {flow === 'current' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>（✦ 标注处）</span>}
                  {flow === 'upload' && !templateApplied && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>（使用模板后可应用）</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {suggestions.map((s) => {
                    const applied = appliedSuggestionIds?.has(s.id)
                    const canApply = optimizeEnabled && !applied
                    const isSkills = s.section === 'skills' && s.field === 'skills' && Array.isArray(s.optimizedContent)
                    const normalize = (str: string) => str.toLowerCase().trim()
                    const existingSet = new Set((currentSkills ?? []).map(normalize))
                    return (
                      <div key={s.id} style={{
                        padding: '10px 12px', borderRadius: '10px',
                        border: applied ? '1px solid #bbf7d0' : '1px solid rgba(28,53,240,0.12)',
                        background: applied ? '#f0fdf4' : 'linear-gradient(135deg, rgba(28,53,240,0.06), rgba(7,137,236,0.04))',
                        transition: 'all 0.2s',
                      }}>
                        {/* Header */}
                        <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px', color: applied ? '#16a34a' : 'var(--ai-color-1)' }}>
                          {applied ? <><CheckCircle2 size={12} color="#16a34a" /> 已应用</> : <>✦ AI 优化建议</>}
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginBottom: '8px' }}>{s.tip}</div>
                        {/* Optimized content */}
                        {isSkills ? (() => {
                          const allSkills = s.optimizedContent as string[]
                          const newSkills = allSkills.filter(sk => !existingSet.has(normalize(sk)))
                          const alreadyCount = allSkills.length - newSkills.length
                          const anyChecked = newSkills.some(sk => !!skillChecks[sk])
                          return (
                            <div>
                              {newSkills.length > 0 ? (
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.3px' }}>是否添加以下技能</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {newSkills.map(skill => (
                                      <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: !applied ? 'pointer' : 'default', background: skillChecks[skill] && !applied ? 'rgba(7,137,236,0.07)' : 'rgba(0,0,0,0.02)', transition: 'background 0.15s', border: '1px solid', borderColor: skillChecks[skill] && !applied ? 'rgba(7,137,236,0.2)' : 'transparent' }}>
                                        <input
                                          type="checkbox"
                                          checked={!!skillChecks[skill]}
                                          disabled={!!applied}
                                          onChange={e => setSkillChecks(prev => ({ ...prev, [skill]: e.target.checked }))}
                                          style={{ accentColor: 'var(--theme-blue)', width: '13px', height: '13px', flexShrink: 0, cursor: !applied ? 'pointer' : 'default' }}
                                        />
                                        <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600, flex: 1 }}>{skill}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>建议中的技能您已全部添加</p>
                              )}
                              {alreadyCount > 0 && (
                                <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#94a3b8' }}>另有 {alreadyCount} 项技能您的简历中已有，无需重复添加</p>
                              )}
                              {/* Apply button inline for skills — disabled when nothing checked */}
                              {!applied && newSkills.length > 0 && (
                                <button
                                  onClick={canApply && anyChecked ? () => {
                                    const selected = newSkills.filter(sk => skillChecks[sk])
                                    onApplySuggestion(s, selected)
                                  } : undefined}
                                  disabled={!canApply || !anyChecked}
                                  style={{
                                    width: '100%', marginTop: '10px', padding: '7px',
                                    background: canApply && anyChecked ? 'linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))' : '#e2e8f0',
                                    color: canApply && anyChecked ? 'white' : '#94a3b8', border: 'none', borderRadius: '6px',
                                    fontFamily: 'var(--font-sans)', fontSize: '12px',
                                    cursor: canApply && anyChecked ? 'pointer' : 'not-allowed', fontWeight: 600,
                                  }}
                                >✓ 添加所选技能</button>
                              )}
                            </div>
                          )
                        })() : s.section === 'summary' ? (
                          <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.65, padding: '8px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
                            {Array.isArray(s.optimizedContent)
                              ? (s.optimizedContent as string[]).filter(Boolean).join(' ')
                              : (s.optimizedContent as string).replace(/\n+/g, ' ')}
                          </p>
                        ) : (s.section === 'exp' || s.section === 'project') && Array.isArray(s.optimizedContent) && (s.optimizedContent as string[]).some(hasDiffMarkup) ? (
                          // Inline diff format: show changeDescription + each bullet with coloured segments
                          <div>
                            {s.changeDescription && (
                              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#475569', lineHeight: 1.55, padding: '6px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
                                {s.changeDescription}
                              </p>
                            )}
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', letterSpacing: '0.3px' }}>改动预览（<span style={{ color: 'var(--highlight)' }}>橙色</span>新增 · <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>删除</span>）</div>
                            <ul style={{ margin: 0, paddingLeft: '14px' }}>
                              {(s.optimizedContent as string[]).map((b, bi) => {
                                const segs = hasDiffMarkup(b) ? parseDiffBullet(b) : null
                                return (
                                  <li key={bi} style={{ fontSize: '11px', lineHeight: 1.6, marginBottom: '3px', color: '#475569' }}>
                                    {segs ? segs.map((seg, si) => (
                                      <span key={si} style={{
                                        color: seg.type === 'add' ? 'var(--highlight)' : seg.type === 'del' ? '#94a3b8' : '#475569',
                                        textDecoration: seg.type === 'del' ? 'line-through' : 'none',
                                        fontWeight: seg.type === 'add' ? 600 : 400,
                                      }}>{seg.text}</span>
                                    )) : b}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ) : Array.isArray(s.optimizedContent) ? (
                          <ul style={{ margin: 0, paddingLeft: '14px' }}>
                            {(s.optimizedContent as string[]).map((b, bi) => (
                              <li key={bi} style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6, marginBottom: '2px' }}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.55 }}>
                            {(s.optimizedContent as string).replace(/\n+/g, ' ')}
                          </p>
                        )}
                        {/* Apply button — skills have their own inline button above */}
                        {!applied && !isSkills && (
                          <button
                            onClick={canApply ? () => onApplySuggestion(s) : undefined}
                            disabled={!canApply}
                            style={{
                              width: '100%', marginTop: '10px', padding: '7px',
                              background: canApply ? 'linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))' : '#e2e8f0',
                              color: canApply ? 'white' : '#94a3b8', border: 'none', borderRadius: '6px',
                              fontFamily: 'var(--font-sans)', fontSize: '12px',
                              cursor: canApply ? 'pointer' : 'not-allowed', fontWeight: 600,
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
              全部应用（{unappliedCount} 条）
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
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '28px' }}>AI 正在识别简历</div>
          <ImportLoadingBar />
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
  initialMeta?: { x: number; y: number; scale: number; natW?: number; natH?: number; shape?: 'circle' | 'rounded' }
  onConfirm: (meta: { x: number; y: number; scale: number; natW: number; natH: number; shape: 'circle' | 'rounded' }) => void
  onReplace: () => void
  onRemove: () => void
  onClose: () => void
}) {
  const PORTRAIT_RATIO = 4 / 3

  const [shape, setShape] = useState<'circle' | 'rounded'>(initialMeta?.shape ?? 'circle')
  // Portrait shape uses a 3:4 ratio preview; circle uses a square.
  const previewW = shape === 'rounded' ? 180 : 240
  const previewH = shape === 'rounded' ? Math.round(180 * PORTRAIT_RATIO) : 240

  const [scale, setScale] = useState(initialMeta?.scale ?? 1)
  const [pos, setPos]     = useState({ x: initialMeta?.x ?? 0, y: initialMeta?.y ?? 0 })
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(
    initialMeta?.natW ? { w: initialMeta.natW, h: initialMeta.natH! } : null
  )
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Reset crop position and zoom when the user switches shape (different aspect ratio)
  useEffect(() => { setPos({ x: 0, y: 0 }); setScale(1) }, [shape])

  // Load natural dimensions whenever src changes (e.g. user replaces photo)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])

  // Compute cover-fit base dimensions that preserve the image's natural aspect ratio.
  // At scale=1 the image exactly covers the preview; at scale>1 it's proportionally larger.
  const nat = natSize ?? { w: previewW, h: previewH }
  const coverScale = Math.max(previewW / nat.w, previewH / nat.h)
  const baseW = nat.w * coverScale
  const baseH = nat.h * coverScale
  const renderedW = baseW * scale
  const renderedH = baseH * scale

  // Per-axis pan limits: image must always fully cover the preview in both dimensions.
  const maxOffX = Math.max(0, (renderedW - previewW) / (2 * previewW))
  const maxOffY = Math.max(0, (renderedH - previewH) / (2 * previewH))
  const cx = Math.max(-maxOffX, Math.min(maxOffX, pos.x))
  const cy = Math.max(-maxOffY, Math.min(maxOffY, pos.y))

  const imgLeft = (previewW - renderedW) / 2 + cx * previewW
  const imgTop  = (previewH - renderedH) / 2 + cy * previewH

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: cx, py: cy }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = (e.clientX - dragRef.current.sx) / previewW
    const dy = (e.clientY - dragRef.current.sy) / previewH
    setPos({ x: dragRef.current.px + dx, y: dragRef.current.py + dy })
  }
  const onUp = () => { dragRef.current = null; setDragging(false) }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.max(1, Math.min(3, s - e.deltaY * 0.001)))
  }

  // Hint text that adapts to image orientation
  const hint = !natSize ? '加载中…'
    : baseH > previewH + 1 && baseW > previewW + 1 ? '拖拽移动 · 滚轮或滑块缩放'
    : baseH > previewH + 1 ? '上下拖拽调整位置 · 缩放查看更多'
    : baseW > previewW + 1 ? '左右拖拽调整位置 · 缩放查看更多'
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

      {/* Shape selector */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {([
          { key: 'circle' as const, label: '圆形', swatchW: 32, swatchH: 32, radius: '50%' },
          { key: 'rounded' as const, label: '证件照', swatchW: 24, swatchH: 32, radius: '3px' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setShape(opt.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
              border: `2px solid ${shape === opt.key ? '#6366f1' : '#e2e8f0'}`,
              background: shape === opt.key ? '#f5f3ff' : 'white',
              transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
            }}
          >
            <div style={{
              width: `${opt.swatchW}px`, height: `${opt.swatchH}px`, borderRadius: opt.radius,
              background: shape === opt.key ? '#6366f1' : '#e2e8f0',
              transition: 'all 0.15s',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: shape === opt.key ? '#6366f1' : '#64748b' }}>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Crop preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onWheel={onWheel}
          style={{
            width: previewW, height: previewH,
            borderRadius: shape === 'rounded' ? `${Math.round(previewW * 0.15)}px` : '50%',
            overflow: 'hidden', position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none', touchAction: 'none',
            boxShadow: '0 0 0 3px #6366f130, 0 4px 20px rgba(0,0,0,0.12)',
            transition: 'width 0.2s, height 0.2s, border-radius 0.2s',
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
          onClick={() => natSize && onConfirm({ x: cx, y: cy, scale, natW: natSize.w, natH: natSize.h, shape })}
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
  | 'ai_analyze'      // job match analysis locked
  | 'ai_translate'    // Chinese→English resume generation locked
  | 'import_limit'    // daily import quota hit
  | 'compress'        // one-page compress locked
  | 'upgrade'         // direct upgrade from pricing page

export interface PaywallModalProps {
  trigger: PaywallTrigger
  resumeId?: string           // current resume ID (for single purchase binding)
  templateId?: string         // current template ID (for single purchase binding)
  hideSingle?: boolean        // hide the single-unlock tab (e.g. landing page)
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
  ai_translate:   { title: '一键生成英文简历',          sub: '订阅 Pro 会员，将中文简历智能翻译为英文版' },
  ai_analyze:     { title: '解锁岗位匹配分析',            sub: '分析简历与目标职位的匹配度，获得针对性建议' },
  compress:       { title: '一键压缩至 1 页',              sub: '订阅 Pro 会员，AI 自动精简描述 · 智能字号缩放' },
  import_limit:   { title: '今日导入次数已用完',           sub: '免费用户每天可导入 2 份，升级 Pro 每天 10 份' },
  upgrade:        { title: '升级 Pro 会员',               sub: '解锁全部功能 · 无水印下载 · AI 分析每日 20 次' },
}

const PLAN_META = {
  monthly:   { label: '月卡', period: '月', badge: '',         saving: '' },
  quarterly: { label: '季卡', period: '季', badge: '最受欢迎', saving: '省21%' },
  yearly:    { label: '年卡', period: '年', badge: '',         saving: '省52%' },
}

const SUB_BENEFITS = [
  '全部精美模板随心用',
  '无水印 PDF 下载',
  'AI 简历优化 20 次/天',
  '岗位匹配分析 & 面试题预测',
  '一键生成英文简历（5 次/天）',
  '一键 AI 压缩至 1 页',
  '简历智能导入（10 次/天）',
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
  trigger, resumeId, templateId, hideSingle = false, deviceId,
  isStudent, isFirstOrder,
  onClose, onSuccess, onFreeDownload, onOpenStudent,
}: PaywallModalProps) {
  const [tab, setTab]             = useState<ActiveTab>('sub')
  const [phase, setPhase]         = useState<PaywallPhase>('plans')
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly')
  const [pendingType, setPendingType] = useState<PlanType | null>(null)
  const [pendingOrder, setPendingOrder] = useState('')
  const [qrDataUrl, setQrDataUrl]   = useState<string | null>(null)
  const [qrLoading, setQrLoading]   = useState(false)
  const [qrError, setQrError]       = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [promoExpanded, setPromoExpanded] = useState(false)
  const [promoCode, setPromoCode]   = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoOk, setPromoOk]       = useState('')

  const copy           = TRIGGER_COPY[trigger]
  const showFreeOption = trigger === 'download_free' && !!onFreeDownload

  const singlePrice = isFirstOrder
    ? PRICES.singleFirst.normal
    : isStudent ? PRICES.single.student : PRICES.single.normal

  const subPrice = (p: 'monthly' | 'quarterly' | 'yearly') =>
    isStudent ? PRICES[p].student : PRICES[p].normal

  const PLAN_TITLE: Record<string, string> = { trial7: '7天体验卡', monthly: '月卡', quarterly: '季卡', yearly: '年卡', single: '单次解锁' }

  function confirmPaid(planType: PlanType, orderId: string, amountFen: number) {
    const now       = Date.now()
    const expiresAt = planType !== 'single' ? now + PLAN_DURATION_MS[planType] : undefined
    addPayment({
      orderId, deviceId, planType, amount: amountFen, isStudent,
      resumeId:   planType === 'single' ? resumeId   : undefined,
      templateId: planType === 'single' ? templateId : undefined,
      paidAt: now, expiresAt, payMethod: 'wechat',
      aiAnalyzeUsed: 0,
    })
    setPhase('success')
    setTimeout(() => { onSuccess(planType, orderId); onClose() }, 1200)
  }

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  function startPoll(orderId: string, planType: PlanType, amountFen: number) {
    stopPoll()
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payment/query?orderId=${orderId}`)
        const data = await res.json()
        if (data.paid) {
          stopPoll()
          confirmPaid(planType, orderId, amountFen)
        }
      } catch { /* network hiccup, keep polling */ }
    }, 2500)
  }

  async function startPay(planType: PlanType) {
    const orderId   = generateOrderId()
    const amountFen = planType === 'single'    ? singlePrice
                    : planType === 'monthly'   ? subPrice('monthly')
                    : planType === 'quarterly' ? subPrice('quarterly')
                    :                            subPrice('yearly')
    setPendingType(planType)
    setPendingOrder(orderId)
    setQrError('')
    setQrDataUrl(null)
    setQrLoading(true)
    setPhase('paying')

    try {
      const res  = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId, planType, amountFen, isStudent, deviceId, resumeId, templateId,
          title: `简力全开 ${PLAN_TITLE[planType]}`,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setQrError(data.error ?? '创建支付失败'); setQrLoading(false); return }
      setQrDataUrl(data.qrDataUrl)
      setQrLoading(false)
      startPoll(orderId, planType, amountFen)
    } catch {
      setQrError('网络错误，请重试')
      setQrLoading(false)
    }
  }

  // Clean up polling when modal unmounts
  useEffect(() => () => stopPoll(), [])

  async function redeemPromo() {
    const trimmed = promoCode.trim()
    if (!trimmed) return
    if (hasRedeemedCode(trimmed)) { setPromoError('此兑换码已使用过'); return }
    setPromoLoading(true)
    setPromoError('')
    try {
      const res  = await fetch('/api/redeem-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: trimmed }) })
      const data = await res.json()
      if (!data.valid) { setPromoError(data.error ?? '兑换码无效'); return }
      const planType = data.plan as PlanType
      const now      = Date.now()
      const orderId  = generateOrderId()
      const expiresAt = PLAN_DURATION_MS[planType] ? now + PLAN_DURATION_MS[planType] : undefined
      addPayment({
        orderId, deviceId, planType, amount: 0, isStudent,
        paidAt: now, expiresAt, payMethod: 'wechat',
        aiAnalyzeUsed: 0,
      })
      markCodeRedeemed(trimmed)
      const PLAN_ZH: Record<string, string> = { trial7: '7天体验卡', monthly: '月卡', quarterly: '季卡', yearly: '年卡' }
      setPromoOk(`🎉 ${data.label ?? PLAN_ZH[planType] ?? planType}已激活！`)
      setTimeout(() => { onSuccess(planType, orderId); onClose() }, 1200)
    } catch {
      setPromoError('网络错误，请重试')
    } finally {
      setPromoLoading(false)
    }
  }

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
    const payingAmount = !pendingType ? 0
      : pendingType === 'single'    ? singlePrice
      : pendingType === 'monthly'   ? subPrice('monthly')
      : pendingType === 'quarterly' ? subPrice('quarterly')
      :                               subPrice('yearly')

    return (
      <ModalWrap onClose={() => { stopPoll(); onClose() }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => { stopPoll(); setPhase('plans') }} style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            border: '1.5px solid #e2e8f0', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', fontSize: '16px', fontFamily: 'var(--font-sans)',
          }}>←</button>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>微信扫码支付</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            padding: '22px', background: '#f8fafc',
            borderRadius: '12px', border: '1px solid #e2e8f0',
            minWidth: '220px', minHeight: '200px', justifyContent: 'center',
          }}>
            {qrLoading && (
              <>
                <style>{`@keyframes pwSpin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: 'var(--theme-blue)', animation: 'pwSpin 0.8s linear infinite', marginBottom: '12px' }} />
                <div style={{ fontSize: '13px', color: '#64748b' }}>正在生成支付码…</div>
              </>
            )}
            {qrError && (
              <div style={{ color: '#dc2626', fontSize: '13px', padding: '12px' }}>{qrError}</div>
            )}
            {qrDataUrl && !qrLoading && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="微信支付二维码" style={{ width: '180px', height: '180px' }} />
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '12px' }}>
                  {fmtFen(payingAmount)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  {PLAN_TITLE[pendingType!] ?? ''} · 订单 {pendingOrder}
                </div>
              </>
            )}
          </div>
          {qrDataUrl && !qrLoading && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pwSpin 1.5s linear infinite', border: '2px solid #bbf7d0' }} />
              微信扫码 · 支付后自动解锁
            </div>
          )}
        </div>

        <button onClick={() => { stopPoll(); setPhase('plans') }} style={{
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

      {/* Tab bar — hidden on landing page where single-unlock is not applicable */}
      {!hideSingle && (
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
      )}

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
            <button onClick={() => startPay('single')} style={{
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
            <button onClick={() => startPay(selectedPlan)} style={{
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

      {/* ── Promo / gift code section (both tabs) ─────────────── */}
      <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '10px' }}>
        <button
          onClick={() => { setPromoExpanded(v => !v); setPromoError(''); setPromoOk('') }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 0', border: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#64748b', cursor: 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            🎟️ 使用兑换码？
          </span>
          {promoExpanded ? <ChevronUp size={13} color="#94a3b8" /> : <ChevronDown size={13} color="#94a3b8" />}
        </button>

        {promoExpanded && (
          <div style={{ marginTop: '6px' }}>
            {promoOk ? (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
                {promoOk}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
                    placeholder="输入兑换码"
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px',
                      border: `1.5px solid ${promoError ? '#fca5a5' : '#e2e8f0'}`,
                      fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#0f172a',
                      background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
                      letterSpacing: '0.5px',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
                    onBlur={e => { e.target.style.borderColor = promoError ? '#fca5a5' : '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                    onKeyDown={e => e.key === 'Enter' && redeemPromo()}
                  />
                  <button
                    onClick={redeemPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    style={{
                      padding: '9px 16px', borderRadius: '8px', border: 'none', flexShrink: 0,
                      background: promoCode.trim() ? 'var(--theme-blue)' : '#e2e8f0',
                      color: promoCode.trim() ? 'white' : '#94a3b8',
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                      cursor: promoCode.trim() && !promoLoading ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {promoLoading ? '…' : '兑换'}
                  </button>
                </div>
                {promoError && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{promoError}</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
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

      {/* Code — always visible so user sees the full flow upfront */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>验证码</label>
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder={codeSent ? '输入 6 位验证码' : '发送验证码后在此输入'}
          maxLength={6}
          disabled={!codeSent}
          style={{ ...inputStyle, opacity: codeSent ? 1 : 0.5 }}
          onFocus={e => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = codeSent ? '#f8fafc' : '#f1f5f9' }}
        />
        {codeSent && (
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            💡 模拟环境验证码为 <strong style={{ color: '#334155' }}>123456</strong>
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {codeSent && (
        <button onClick={verify} disabled={!code} style={{
          width: '100%', padding: '13px', borderRadius: '10px', border: 'none', marginBottom: '14px',
          background: code ? 'var(--theme-blue)' : '#e2e8f0',
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
