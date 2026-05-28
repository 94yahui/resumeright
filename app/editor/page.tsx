'use client'
import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Menu, Undo2, Redo2, Globe, Check } from 'lucide-react'
import EditorTopbar from './components/EditorTopbar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { DownloadModal, AIPanel, ImportModal, ContinueModal, PhotoCropModal, PaywallModal, StudentModal } from './components/Modals'
import ImportLoadingBar from '../components/ImportLoadingBar'
import type { PaywallTrigger } from './components/Modals'
import PaginatedResume from '../lib/PaginatedResume'
import ResumeRenderer from '../lib/ResumeRenderer'
import { ResumeData, SelectionType, SectionKey, Entry, AISuggestion, DEMO_DATA, parsedToResumeData, hasDiffMarkup, applyDiffBullet } from '../lib/types'
import { getTemplate } from '../lib/templates-config'
import {
  loadDraft, saveDraft, clearDraft,
  loadHistory, saveToHistory, deleteHistory, updateHistoryEntry, sortAndSaveHistory,
  loadPaidTemplates, addPaidTemplate, uniqueHistoryName,
  type HistoryEntry, type DraftState,
} from '../lib/storage'
import { generateWordBlob } from '../lib/exportWord'
import {
  getDeviceId, getProStatus, isStudent as isStudentUser, isFirstPurchase,
  hasNoWatermark, checkUsage, recordUsage, cleanOldUsage, getDailyCount,
  type ProStatus,
} from '../lib/payment'
import type { PlanType } from '../lib/payment'

const HISTORY_LIMIT = 30

const CJK = /[一-鿿　-〿＀-￯]/
function looksEnglish(d: ResumeData): boolean {
  const texts = [d.jobtitle, d.summary, ...(d.exp ?? []).flatMap(e => e.bullets ?? []).slice(0, 4)].filter(Boolean)
  return texts.length > 0 && !texts.some(t => CJK.test(t))
}

const TRANSLATE_STAGES = [
  { after: 0,     msg: '正在解析简历结构…' },
  { after: 3000,  msg: '翻译专业术语与描述…' },
  { after: 7000,  msg: '优化英文表达方式…' },
  { after: 12000, msg: '生成英文版本…' },
  { after: 18000, msg: '即将完成，请稍候…' },
]


// Strings that are never real user content — added as defaults when a new entry is created.
// Filtered from the PDF print layer so users don't accidentally export placeholder text.
const PLACEHOLDER_BULLETS = new Set(['描述工作职责和成就...', '项目详情...'])
function cleanDataForPrint(d: ResumeData): ResumeData {
  const clean = (arr: Entry[]) => arr.map(e => ({
    ...e,
    bullets: e.bullets.filter(b => !PLACEHOLDER_BULLETS.has(b.trim())),
  }))
  return {
    ...d,
    exp: clean(d.exp), edu: clean(d.edu), project: clean(d.project),
    award: clean(d.award), cert: clean(d.cert), volunteer: clean(d.volunteer),
    interest: clean(d.interest), language: clean(d.language),
  }
}

function EditorInner() {
  const searchParams = useSearchParams()
  const initTemplate = searchParams.get('template') || 'classic-pro'

  // ============ Undo/Redo history stack ============
  const [history, setHistory] = useState<ResumeData[]>([DEMO_DATA])
  const [historyIdx, setHistoryIdx] = useState(0)
  const data = history[historyIdx]

  const setData = useCallback((updater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setHistory(prev => {
      const cur = prev[historyIdx]
      const next = typeof updater === 'function' ? (updater as (p: ResumeData) => ResumeData)(cur) : updater
      const truncated = prev.slice(0, historyIdx + 1)
      const newHistory = [...truncated, next].slice(-HISTORY_LIMIT)
      setHistoryIdx(newHistory.length - 1)
      return newHistory
    })
  }, [historyIdx])

  const undo = useCallback(() => { if (historyIdx > 0) setHistoryIdx(historyIdx - 1) }, [historyIdx])
  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) setHistoryIdx(historyIdx + 1)
  }, [historyIdx, history.length])

  // ============ Editor state ============
  const [templateId, setTemplateId] = useState(initTemplate)
  const [color, setColor] = useState<string | undefined>(undefined)
  const [selection, setSelection] = useState<SelectionType>({ kind: 'none' })
  const [zoom, setZoom] = useState(70)
  const [docTitle, setDocTitle] = useState('我的简历')
  const [modal, setModal] = useState<'none' | 'download'>('none')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPanelFlow, setAiPanelFlow] = useState<'current' | 'upload'>('current')
  const [aiPanelPhase, setAiPanelPhase] = useState<'entry' | 'analyzing' | 'result' | 'applying'>('entry')
  const [aiUploadFilename, setAiUploadFilename] = useState('')
  const [aiUploadObjectUrl, setAiUploadObjectUrl] = useState<string | null>(null)
  const [aiTemplateApplied, setAiTemplateApplied] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ hasOfferRate?: boolean; offerRate?: number; overview: string; suggestions: AISuggestion[]; interviewQuestions?: string[]; interviewAnswers?: string[]; missingSkills?: string[]; jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null; matchBreakdown?: { experience: number; skills: number; other: number } | null } | null>(null)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [bulletDiffs, setBulletDiffs] = useState<Record<string, string[]>>({})
  const [pendingSkills, setPendingSkills] = useState<string[]>([])
  const [aiParsedData, setAiParsedData] = useState<ResumeData | null>(null)
  const [aiUploadError, setAiUploadError] = useState<string | undefined>(undefined)
  const [aiUploadIsWord, setAiUploadIsWord] = useState(false)
  const [jobDescPersist, setJobDescPersist] = useState('')
  const [noResumeOpen, setNoResumeOpen] = useState(false)
  const [importModalState, setImportModalState] = useState<'none' | 'ready' | 'loading'>('none')
  const [importingFile, setImportingFile] = useState('')
  const importingFileObjRef = useRef<File | null>(null)
  const [toast, setToast] = useState('')
  const [pageCount, setPageCount] = useState(1)
  const [paidTemplates, setPaidTemplates] = useState<string[]>([])
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pngGenerating, setPngGenerating] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [proStatus, setProStatus] = useState<ProStatus>({ kind: 'free' })
  const [isStudentVerified, setIsStudentVerified] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger>('download_free')
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const pendingPaywallActionRef = useRef<{ type: 'download' } | { type: 'ai_analyze' } | { type: 'ai_translate' } | { type: 'compress' } | null>(null)
  const translateAbortRef = useRef<AbortController | null>(null)
  const compressAbortRef = useRef<AbortController | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [leftPanelTab, setLeftPanelTab] = useState<'tpl' | 'mod' | 'color' | 'hist' | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiAnalyzeAbortRef = useRef<AbortController | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const importFileRef = useRef<HTMLInputElement>(null)
  const [photoCropOpen, setPhotoCropOpen] = useState(false)
  const [photoCropSrc, setPhotoCropSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasBreakPointsRef = useRef<number[]>([0])
  const canvasTotalHeightRef = useRef(0)
  const scaleWrapperRef = useRef<HTMLDivElement>(null)
  const zoomDisplayRef = useRef<HTMLSpanElement>(null)
  const zoomCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  // Immediately apply a zoom value: cancels any pending gesture debounce, syncs
  // the ref, updates the DOM directly, and commits to React state in one shot.
  // Used by the +/- buttons and reset so they aren't overridden by a late-firing debounce.
  function commitZoom(z: number) {
    const clamped = Math.min(130, Math.max(40, z))
    if (zoomCommitTimerRef.current) { clearTimeout(zoomCommitTimerRef.current); zoomCommitTimerRef.current = null }
    zoomRef.current = clamped
    if (scaleWrapperRef.current) scaleWrapperRef.current.style.transform = `scale(${clamped / 100})`
    if (zoomDisplayRef.current) zoomDisplayRef.current.textContent = `${Math.round(clamped)}%`
    setZoom(clamped)
  }
  // Tracks the JSON snapshot of data at the time of the last successful analysis.
  // Used to restore cached results when reopening the AI panel without editing.
  const aiAnalyzedDataSnapshot = useRef<string | null>(null)
  // When non-null, skip auto-save on exit to avoid duplicates (set when resuming a draft or loading history)
  const loadedFromHistoryId = useRef<string | null>(null)
  // Always reflects the latest editor state for use in cleanup effects
  const latestForAutoSave = useRef({ data, docTitle, templateId, color })
  // Live refs for use inside event handler closures that can't depend on state
  const isMobileRef = useRef(false)
  const zoomRef = useRef(zoom)
  const prevDocTitleRef = useRef<string | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  const template = getTemplate(templateId)
  const effectiveColor = color || template.accentColor
  const isProTemplate = !template.free
  // Watermark: subscription = always off; single = only off for the paid template;
  // old single purchases (no templateId stored) keep the original no-watermark behaviour.
  const showWatermark = proStatus.kind === 'free' ||
    (proStatus.kind === 'single' && !!proStatus.templateId && proStatus.templateId !== templateId)

  // Build the set of section keys that have unapplied AI suggestions (for badges in renderer)
  const aiSuggestionSections = undefined

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2200)
  }

  // Initialize device ID once on mount
  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    cleanOldUsage()
  }, [])

  // Recompute pro status when device or active resume changes
  useEffect(() => {
    if (!deviceId) return
    setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
    setIsStudentVerified(isStudentUser(deviceId))
  }, [deviceId, currentHistoryId])

  // ============ Load draft from localStorage on mount ============
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const paid = loadPaidTemplates()
    setPaidTemplates(paid)

    // Landing-page import: user uploaded/analyzed a resume on the homepage → stored in sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem('resumecraft_landing_import')
      if (raw) {
        sessionStorage.removeItem('resumecraft_landing_import')
        try {
          const { data: importedRaw, filename, analysis } = JSON.parse(raw)
          const parsed = parsedToResumeData(importedRaw ?? {})
          const currentHistory = loadHistory()
          const uniqueName = uniqueHistoryName(filename || '上传简历', currentHistory)
          const newId = saveToHistory({ name: uniqueName, data: parsed, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
          loadedFromHistoryId.current = newId || null
          setCurrentHistoryId(newId || null)
          setDocTitle(uniqueName)
          setHistory([parsed])
          setHistoryIdx(0)
          setTemplateId('classic-pro')
          setColor(undefined)
          setHistoryRefreshKey(k => k + 1)
          setIsCurrentEnglish(looksEnglish(parsed))

          if (analysis) {
            // Diagnosis flow: parsed data goes into canvas, AI panel opens with results immediately clickable
            setAiParsedData(parsed)
            setAiAnalysis(analysis)
            setAiPanelOpen(true)
            setAiPanelFlow('upload')
            setAiPanelPhase('result')
            setAiUploadFilename(uniqueName)
            setAiTemplateApplied(true)
          }
          // Simple upload flow: no AI panel — canvas shows parsed data right away
          return
        } catch (e) {
          console.error('Landing import error:', e)
        }
      }
    }

    // When the user arrives via a template card (?template=xxx) they are explicitly
    // picking a new template — skip the "continue editing" popup.
    // For all other entry points (landing page CTA, direct URL) show the popup
    // whenever there is any saved resume in history.
    if (!searchParams.get('template')) {
      const currentHistory = loadHistory()
      if (currentHistory.length > 0) {
        // Pick the entry with the most recent savedAt (most recently edited, not just most recently created)
        const recent = currentHistory.reduce((best, e) => e.savedAt > best.savedAt ? e : best, currentHistory[0])
        setPendingDraft({
          data: recent.data,
          templateId: recent.templateId,
          color: recent.color,
          docTitle: recent.name,
          savedAt: recent.savedAt,
          historyId: recent.id,
        })
        return  // wait for user choice in ContinueModal
      }
    }
    // Fresh start — use a unique name in case "我的简历" already exists
    const currentHistory = loadHistory()
    const initName = uniqueHistoryName('我的简历', currentHistory)
    const newId = saveToHistory({ name: initName, data: DEMO_DATA, templateId: initTemplate, color: undefined, savedAt: Date.now() })
    if (newId) { loadedFromHistoryId.current = newId; setCurrentHistoryId(newId) }
    setDocTitle(initName)
  }, [])

  // ============ Auto-save draft to localStorage ============
  useEffect(() => {
    if (!initialized.current) return
    const hid = loadedFromHistoryId.current
    // Persist historyId in the draft so "继续编辑" can restore the correct association
    try {
      saveDraft({ data, templateId, color, docTitle, savedAt: Date.now(), historyId: hid ?? undefined })
      // Keep the history entry in sync — includes name so renaming the doc updates the list
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
      }
    } catch {
      showToast('⚠️ 保存失败：本地存储空间不足，请移除照片或清理历史记录')
    }
  }, [data, templateId, color, docTitle])

  // Populate diff preview whenever new AI analysis arrives
  useEffect(() => {
    if (!aiAnalysis?.suggestions) { setBulletDiffs({}); return }
    const diffs: Record<string, string[]> = {}
    for (const s of aiAnalysis.suggestions) {
      if ((s.section === 'exp' || s.section === 'project') && s.field === 'bullets' && s.entryIndex !== undefined && Array.isArray(s.optimizedContent)) {
        const bullets = s.optimizedContent as string[]
        if (bullets.some(hasDiffMarkup)) {
          diffs[`${s.section}:${s.entryIndex}`] = bullets
        }
      }
    }
    setBulletDiffs(diffs)
  }, [aiAnalysis])

  // Keep refs in sync with latest state (for event handlers / cleanup effects that can't depend on state)
  useEffect(() => {
    latestForAutoSave.current = { data, docTitle, templateId, color }
    isMobileRef.current = isMobile
    zoomRef.current = zoom
  })

  // Pinch-to-zoom (mobile) + Ctrl/Cmd+wheel zoom (desktop trackpad)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    function dist(t: TouchList) {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      return Math.hypot(dx, dy)
    }

    // Apply zoom directly to the DOM without triggering a React re-render.
    // React re-renders are expensive here (PaginatedResume is complex), so we
    // bypass them entirely during the gesture and only commit the final value.
    function applyZoomDirect(z: number) {
      zoomRef.current = z
      if (scaleWrapperRef.current) scaleWrapperRef.current.style.transform = `scale(${z / 100})`
      if (zoomDisplayRef.current) zoomDisplayRef.current.textContent = `${Math.round(z)}%`
      // Commit to React state only when the gesture pauses (debounced)
      if (zoomCommitTimerRef.current) clearTimeout(zoomCommitTimerRef.current)
      zoomCommitTimerRef.current = setTimeout(() => { setZoom(z); zoomCommitTimerRef.current = null }, 200)
    }

    // Float accumulator + RAF for smooth trackpad/pinch zoom
    let wheelPending = zoomRef.current
    let wheelRafId: number | null = null
    let pinchPending = zoomRef.current
    let pinchRafId: number | null = null

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      // Sync from committed state at the start of each new batch
      if (wheelRafId === null) wheelPending = zoomRef.current
      const step = e.deltaMode === 1 ? -e.deltaY * 8 : -e.deltaY * 0.3
      wheelPending = Math.min(130, Math.max(40, wheelPending + step))
      if (wheelRafId !== null) return
      wheelRafId = requestAnimationFrame(() => {
        applyZoomDirect(wheelPending)
        wheelRafId = null
      })
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchRef.current = { startDist: dist(e.touches), startZoom: zoomRef.current }
      } else {
        pinchRef.current = null
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinchRef.current) return
      e.preventDefault()
      const ratio = dist(e.touches) / pinchRef.current.startDist
      pinchPending = Math.min(130, Math.max(40, pinchRef.current.startZoom * ratio))
      if (pinchRafId !== null) return
      pinchRafId = requestAnimationFrame(() => {
        applyZoomDirect(pinchPending)
        pinchRafId = null
      })
    }

    function onTouchEnd() {
      pinchRef.current = null
      if (pinchRafId !== null) { cancelAnimationFrame(pinchRafId); pinchRafId = null }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      if (wheelRafId !== null) cancelAnimationFrame(wheelRafId)
      if (pinchRafId !== null) cancelAnimationFrame(pinchRafId)
      if (zoomCommitTimerRef.current) clearTimeout(zoomCommitTimerRef.current)
    }
  }, [])  // stable: uses refs + RAF-local accumulators

  // Auto-save to history when the browser tab is closed or navigated away.
  // Only runs via beforeunload (not cleanup) to avoid false saves on React remounts / refresh.
  // Skipped when the user is editing a resumed draft or history entry to prevent duplicates.
  useEffect(() => {
    const saveOnExit = () => {
      if (!initialized.current) return
      if (loadedFromHistoryId.current) return
      const { data: d, docTitle: dt, templateId: tid, color: c } = latestForAutoSave.current
      saveToHistory({ name: dt || '我的简历', data: d, templateId: tid, color: c, savedAt: Date.now() })
      // Re-sort history by savedAt so the most recently edited resume appears first next session
      sortAndSaveHistory()
    }
    const abortOnExit = () => {
      aiAnalyzeAbortRef.current?.abort()
      translateAbortRef.current?.abort()
    }
    window.addEventListener('beforeunload', saveOnExit)
    window.addEventListener('beforeunload', abortOnExit)
    return () => {
      window.removeEventListener('beforeunload', saveOnExit)
      window.removeEventListener('beforeunload', abortOnExit)
      aiAnalyzeAbortRef.current?.abort()  // client-side navigation (component unmount)
      translateAbortRef.current?.abort()
    }
  }, [])

  // ============ Data updates ============
  const updateData = useCallback((patch: Partial<ResumeData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [setData])

  const updateEntry = useCallback((sec: SectionKey, idx: number, patch: Partial<Entry>) => {
    setData(prev => {
      const arr = [...(prev[sec] as Entry[])]
      arr[idx] = { ...arr[idx], ...patch }
      return { ...prev, [sec]: arr }
    })
  }, [setData])

  const deleteEntry = useCallback((sec: SectionKey, idx: number) => {
    setData(prev => ({ ...prev, [sec]: (prev[sec] as Entry[]).filter((_, i) => i !== idx) }))
    setSelection({ kind: 'none' })
    showToast('已删除')
  }, [setData])

  // Move entry up/down (RightPanel buttons)
  const moveEntry = useCallback((sec: SectionKey, idx: number, dir: 'up' | 'down') => {
    setData(prev => {
      const arr = [...(prev[sec] as Entry[])]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...prev, [sec]: arr }
    })
    setSelection({ kind: 'entry', sec, idx: dir === 'up' ? idx - 1 : idx + 1 })
  }, [setData])

  // Reorder via drag-and-drop in the resume canvas
  const reorderEntries = useCallback((sec: SectionKey, fromIdx: number, toIdx: number) => {
    setData(prev => {
      const arr = [...(prev[sec] as Entry[])]
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, moved)
      return { ...prev, [sec]: arr }
    })
    setSelection(prev => {
      if (prev.kind === 'entry' && prev.sec === sec && prev.idx === fromIdx) {
        return { kind: 'entry', sec, idx: toIdx }
      }
      return prev
    })
  }, [setData])

  const addEntry = useCallback((sec: SectionKey, flagPatch?: Partial<ResumeData>) => {
    const defaults: Record<SectionKey, Entry> = {
      exp:       { id: Date.now()+'-exp', title: '新职位', sub: '公司名称', date: '开始 — 结束', bullets: ['描述工作职责和成就...'] },
      edu:       { id: Date.now()+'-edu', title: '专业名称', sub: '学校名称', date: '入学 — 毕业', bullets: [] },
      project:   { id: Date.now()+'-prj', title: '项目名称', sub: '项目角色', date: '开始 — 结束', bullets: ['项目详情...'] },
      award:     { id: Date.now()+'-awd', title: '奖项名称', sub: '颁奖机构', date: '年份', bullets: [] },
      cert:      { id: Date.now()+'-crt', title: '证书名称', sub: '颁发机构', date: '年份', bullets: [] },
      volunteer: { id: Date.now()+'-vol', title: '志愿活动', sub: '机构名称', date: '开始 — 结束', bullets: [] },
      interest:  { id: Date.now()+'-itr', title: '兴趣爱好', sub: '简短描述', date: '', bullets: [] },
      language:  { id: Date.now()+'-lng', title: '英语', sub: '流利', date: '', bullets: [] },
    }
    setData(prev => ({
      ...prev,
      ...(flagPatch || {}),
      [sec]: [...(prev[sec] as Entry[]), defaults[sec]],
    }))
    showToast(`✓ 已添加${({ exp:'工作经历', edu:'教育背景', language:'语言能力', award:'荣誉奖项', project:'项目经历', cert:'资质证书', volunteer:'志愿服务', interest:'兴趣爱好' } as Record<string,string>)[sec]}`)
    if (!isMobileRef.current) {
      // Desktop: auto-open the right panel so the user can edit right away
      setTimeout(() => {
        setSelection({ kind: 'entry', sec, idx: (data[sec] as Entry[]).length })
      }, 80)
    }
  }, [data, setData])

  const handleAddModule = useCallback((key: string) => {
    if (key === 'name') { setSelection({ kind: 'field', field: 'name' }); return }
    if (key === 'contact') { setSelection({ kind: 'contact' }); return }
    if (key === 'photo') {
      if (data.photo) { setPhotoCropOpen(true) } else { photoInputRef.current?.click() }
      return
    }
    if (key === 'photo-clear') { updateData({ photo: '', photoMeta: undefined }); showToast('已移除照片'); return }

    const flagMap: Record<string, keyof ResumeData> = {
      summary: 'hasSummary', skills: 'hasSkills', project: 'hasProject', language: 'hasLanguage',
      award: 'hasAward', cert: 'hasCert', volunteer: 'hasVolunteer', interest: 'hasInterest',
    }
    const sectionKeys: Record<string, SectionKey> = {
      exp: 'exp', edu: 'edu', project: 'project', award: 'award',
      cert: 'cert', volunteer: 'volunteer', interest: 'interest', language: 'language',
    }

    if (key === 'summary') {
      const summaryPatch: Partial<ResumeData> = { hasSummary: true }
      if (!data.summary) summaryPatch.summary = '请在此输入你的个人简介，简要介绍你的专业背景、核心技能和职业目标，建议 2-4 句话，突出你最大的竞争优势。'
      updateData(summaryPatch)
      showToast('✓ 已添加个人简介')
      if (isMobileRef.current) { setLeftOpen(false) } else { setSelection({ kind: 'field', field: 'summary' }) }
    } else if (key === 'skills') {
      const patch: Partial<ResumeData> = { hasSkills: true }
      if (data.skills.length === 0) {
        patch.skills = ['沟通协作', '项目管理', '学习能力', '团队合作', '问题解决']
      }
      updateData(patch)
      showToast('✓ 已显示技能区块')
      if (isMobileRef.current) { setLeftOpen(false) } else { setSelection({ kind: 'skills' }) }
    } else if (sectionKeys[key]) {
      const sec = sectionKeys[key]
      const flag = flagMap[key]
      if (isMobileRef.current) setLeftOpen(false)  // show resume with new entry
      addEntry(sec, flag ? { [flag]: true } as Partial<ResumeData> : undefined)
    }
  }, [addEntry, updateData, data])

  // ============ Continue / New choice from startup popup ============
  const handleContinueDraft = useCallback(() => {
    if (!pendingDraft) return
    loadedFromHistoryId.current = pendingDraft.historyId ?? 'draft'
    setCurrentHistoryId(pendingDraft.historyId ?? null)
    setHistory([pendingDraft.data])
    setHistoryIdx(0)
    setTemplateId(pendingDraft.templateId)
    setColor(pendingDraft.color)
    setDocTitle(pendingDraft.docTitle)
    setPendingDraft(null)
    setNoResumeOpen(false)
    setIsCurrentEnglish(looksEnglish(pendingDraft.data))
  }, [pendingDraft])

  const handleNewResume = useCallback(() => {
    setPendingDraft(null)
    const currentHistory = loadHistory()
    const newName = uniqueHistoryName('我的简历', currentHistory)
    const newId = saveToHistory({ name: newName, data: DEMO_DATA, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
    if (newId) { loadedFromHistoryId.current = newId; setCurrentHistoryId(newId) }
    setHistory([DEMO_DATA])
    setHistoryIdx(0)
    setTemplateId('classic-pro')
    setColor(undefined)
    setDocTitle(newName)
    setIsCurrentEnglish(false)
  }, [])

  // ============ History (saved drafts) ============
  const handleSaveHistory = useCallback(() => {
    try {
      saveToHistory({ name: docTitle, data, templateId, color, savedAt: Date.now() })
      setHistoryRefreshKey(k => k + 1)
      if (isMobile) setLeftOpen(true)
      showToast('✓ 已保存')
    } catch {
      showToast('⚠️ 保存失败：本地存储空间不足，请移除照片或清理历史记录')
    }
  }, [docTitle, data, templateId, color, isMobile])


  // ============ Photo upload ============
  function compressPhoto(dataUrl: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const targetW = Math.round(img.width * scale)
        const targetH = Math.round(img.height * scale)

        // Multi-step downsampling: reduce by at most 50% per pass to avoid
        // moiré rings that appear when jumping from a large source in one step.
        let srcW = img.width, srcH = img.height
        let currentSrc: CanvasImageSource = img
        while (srcW > targetW * 2 || srcH > targetH * 2) {
          const stepW = Math.max(targetW, Math.round(srcW / 2))
          const stepH = Math.max(targetH, Math.round(srcH / 2))
          const step = document.createElement('canvas')
          step.width = stepW; step.height = stepH
          const sCtx = step.getContext('2d')!
          sCtx.imageSmoothingEnabled = true
          sCtx.imageSmoothingQuality = 'high'
          sCtx.drawImage(currentSrc, 0, 0, stepW, stepH)
          currentSrc = step; srcW = stepW; srcH = stepH
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetW; canvas.height = targetH
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(currentSrc, 0, 0, targetW, targetH)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      img.src = dataUrl
    })
  }

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressPhoto(ev.target?.result as string)
      setPhotoCropSrc(compressed)
      setPhotoCropOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ============ Preview / Print ============
  const openResumeWindow = useCallback((autoprint = false) => {
    setSelection({ kind: 'none' })
    setTimeout(() => {
      const printArea = document.querySelector('.resume-print-area')
      if (!printArea) return
      const pageEls = printArea.querySelectorAll('.resume-page')
      const html = Array.from(pageEls).map(el => (el as HTMLElement).outerHTML).join('')
      const w = window.open('', '_blank', 'width=900,height=1100')
      if (!w) return
      const title = docTitle || '我的简历'
      w.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=794, initial-scale=1">
<title>${title}${autoprint ? '' : ' — 预览'}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: ${autoprint ? 'white' : '#e2e8f0'}; padding: ${autoprint ? '0' : '40px'}; font-family: Inter, 'Noto Sans SC', sans-serif; min-height: 100vh; }
  .preview-wrap { display: flex; flex-direction: column; align-items: center; gap: ${autoprint ? '0' : '24px'}; }
  .resume-page-num { display: none !important; }
  @media print {
    @page { size: A4; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: white; padding: 0; }
    .preview-wrap { gap: 0; }
    .resume-pages-wrapper { gap: 0 !important; }
    .resume-page {
      page-break-after: always; break-after: page;
      box-shadow: none !important;
      width: 210mm !important; height: 297mm !important;
      overflow: hidden !important;
    }
    .resume-page:last-child { page-break-after: auto; break-after: auto; }
  }
</style>
</head>
<body>
<div class="preview-wrap">${html}</div>
${autoprint ? `<script>
  (document.fonts ? document.fonts.ready : Promise.resolve())
    .then(function(){ setTimeout(function(){ window.print(); }, 150); })
    .catch(function(){ setTimeout(function(){ window.print(); }, 1200); });
<\/script>` : ''}
</body>
</html>`)
      w.document.close()
    }, 80)
  }, [docTitle])

  const handlePrintPDF = useCallback(() => {
    setModal('none')
    setSelection({ kind: 'none' })
    setPdfGenerating(true)

    // 80 ms: let React flush the selection-clear re-render so highlighted cells
    // don't appear in the captured HTML.
    setTimeout(async () => {
      const printArea = document.querySelector('.resume-print-area')
      if (!printArea) { setPdfGenerating(false); return }

      // Capture the visible .resume-page elements — their break-point clip heights
      // and translateY values are already baked in as inline styles, so the PDF
      // Puppeteer render matches the canvas exactly. The off-screen measurer div
      // (no .resume-page class) is excluded automatically.
      const pageEls = Array.from(printArea.querySelectorAll('.resume-page')) as HTMLElement[]
      const htmlContent = pageEls.map(el => el.outerHTML).join('')

      try {
        const res = await fetch('/api/pdf/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent, docTitle }),
        })
        if (!res.ok) throw new Error('server error')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${docTitle || '我的简历'}.pdf`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
      } catch {
        showToast('PDF 生成失败，请重试')
      } finally {
        setPdfGenerating(false)
      }
    }, 80)
  }, [docTitle])

  const handleDownloadWord = useCallback(() => {
    setModal('none')
    const blob = generateWordBlob(data)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docTitle || '我的简历'}.doc`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
    showToast('✓ Word 文件已下载')
  }, [data, docTitle])

  const handleDownloadPNG = useCallback(() => {
    setModal('none')
    setSelection({ kind: 'none' })
    setPngGenerating(true)

    setTimeout(async () => {
      const printArea = document.querySelector('.resume-print-area')
      if (!printArea) { setPngGenerating(false); return }
      const pageEls = Array.from(printArea.querySelectorAll('.resume-page')) as HTMLElement[]
      const htmlContent = pageEls.map(el => el.outerHTML).join('')

      try {
        const res = await fetch('/api/pdf/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent, docTitle, format: 'png' }),
        })
        if (!res.ok) throw new Error('server error')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${docTitle || '我的简历'}.png`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
        showToast('✓ 图片已下载')
      } catch {
        showToast('图片生成失败，请重试')
      } finally {
        setPngGenerating(false)
      }
    }, 80)
  }, [docTitle])

  // ============ Payment / paywall ============
  const handlePaywallSuccess = useCallback((_planType: PlanType, _orderId: string) => {
    const status = getProStatus(deviceId, currentHistoryId || undefined)
    setProStatus(status)
    setIsStudentVerified(isStudentUser(deviceId))
    const action = pendingPaywallActionRef.current
    pendingPaywallActionRef.current = null
    if (action?.type === 'download') setTimeout(() => setModal('download'), 80)
    if (action?.type === 'ai_translate') setTimeout(() => handleTranslate(), 80)
    if (action?.type === 'compress') setTimeout(() => handleCompress(), 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, currentHistoryId])

  const handleDownloadAttempt = useCallback(() => {
    if (showWatermark) {
      pendingPaywallActionRef.current = { type: 'download' }
      setPaywallTrigger(isProTemplate ? 'download_pro' : 'download_free')
      setPaywallOpen(true)
      return
    }
    setModal('download')
  }, [isProTemplate, showWatermark])

  // ============ AI Panel ============
  const handleAIAnalyze = useCallback(() => {
    // Abort any in-flight analysis from a previous panel open
    aiAnalyzeAbortRef.current?.abort()
    aiAnalyzeAbortRef.current = null
    setSelection({ kind: 'none' })
    setAiPanelOpen(true)
    setAiPanelFlow('current')
    setAiTemplateApplied(false)
    setAiUploadError(undefined)
    setAiUploadFilename('')
    setAiUploadObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    // If the resume hasn't changed since the last analysis, restore cached results
    const hasCachedAnalysis = aiAnalysis !== null && aiAnalyzedDataSnapshot.current === JSON.stringify(data)
    if (hasCachedAnalysis) {
      setAiPanelPhase('result')
    } else {
      setAiPanelPhase('entry')
      setAiAnalysis(null)
      setAppliedSuggestions(new Set())
    }
  }, [data, aiAnalysis])

  const handleAIAnalyzeCurrent = useCallback(async (jobDesc: string) => {
    const check = checkUsage(deviceId, 'ai_analyze', proStatus)
    if (!check.allowed) {
      if (check.reason === 'not_paid') {
        setPaywallTrigger('ai_analyze')
        setPaywallOpen(true)
      } else {
        showToast(`今日岗位分析次数已用完（${check.used}/${check.limit} 次）`)
      }
      return
    }
    recordUsage(deviceId, 'ai_analyze', proStatus)
    setProStatus(getProStatus(deviceId, currentHistoryId || undefined))

    const dataSnapshot = JSON.stringify(data)  // snapshot before async gap
    setAiPanelFlow('current')
    setAiPanelPhase('analyzing')
    setAiAnalysis(null)
    setAppliedSuggestions(new Set())

    // Abort any previous in-flight request before starting a new one
    aiAnalyzeAbortRef.current?.abort()
    const controller = new AbortController()
    aiAnalyzeAbortRef.current = controller

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: { ...data, photo: '', photoMeta: undefined }, jobDesc, deviceId }),
        signal: controller.signal,
      })
      if (res.ok) {
        const result = await res.json()
        setAiAnalysis(result)
        aiAnalyzedDataSnapshot.current = dataSnapshot
        setAiPanelPhase('result')
      } else {
        showToast('AI 开小差了，请稍后重试')
        setAiPanelPhase('entry')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('analyze error:', e)
      showToast('AI 开小差了，请稍后重试')
      setAiPanelPhase('entry')
    } finally {
      if (aiAnalyzeAbortRef.current === controller) aiAnalyzeAbortRef.current = null
    }
  }, [data, deviceId, proStatus, currentHistoryId])

  const jobDescRef = useRef(jobDescPersist)
  useEffect(() => { jobDescRef.current = jobDescPersist }, [jobDescPersist])

  const handleAIFileSelect = useCallback(async (file: File) => {
    // Check shared AI-analyze quota (free: 2 lifetime, shared with landing page and analyze-current)
    const analyzeCheck = checkUsage(deviceId, 'ai_analyze', proStatus)
    if (!analyzeCheck.allowed) {
      setPaywallTrigger('ai_analyze')
      setPaywallOpen(true)
      return
    }
    // Check import quota for paid tiers (rate limiting for parse API)
    if (proStatus.kind !== 'free') {
      const importCheck = checkUsage(deviceId, 'import', proStatus)
      if (!importCheck.allowed) {
        setPaywallTrigger('import_limit')
        setPaywallOpen(true)
        return
      }
    }

    const filename = file.name.replace(/\.[^.]+$/, '')
    const isWord = /\.(doc|docx)$/i.test(file.name)
    prevDocTitleRef.current = latestForAutoSave.current.docTitle
    setAiUploadFilename(filename)
    setDocTitle(filename)
    setAiPanelFlow('upload')
    setAiUploadIsWord(isWord)
    if (isWord) {
      // Word files can't be previewed in an iframe — skip object URL to avoid auto-download
      setAiUploadObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    } else {
      setAiUploadObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
    }
    setAiPanelPhase('analyzing')
    setAiAnalysis(null)
    setAiParsedData(null)
    setAiUploadError(undefined)
    setAppliedSuggestions(new Set())
    aiAnalyzedDataSnapshot.current = null  // clear current-resume cache when switching to upload flow

    // Abort any previous in-flight request before starting new ones
    aiAnalyzeAbortRef.current?.abort()
    const controller = new AbortController()
    aiAnalyzeAbortRef.current = controller

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('deviceId', deviceId)
      const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData, signal: controller.signal })
      if (res.status === 422) {
        // Not a resume — show error state
        const json = await res.json()
        setAiUploadError(json.error ?? 'not_resume')
        setAiPanelPhase('result')
        return
      }
      if (!res.ok) {
        showToast('AI 开小差了，请稍后重试')
        setAiPanelPhase('entry')
        return
      }
      const json = await res.json()
      const parsed = parsedToResumeData(json.data ?? {})
      // Deduct from ai_analyze quota (shared free counter) after successful parse
      recordUsage(deviceId, 'ai_analyze', proStatus)
      setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
      // Also deduct import quota for paid tiers
      if (proStatus.kind !== 'free') recordUsage(deviceId, 'import', proStatus)
      setAiParsedData(parsed)
      // Also run analyze on the parsed data, pass current JD if present
      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: parsed, jobDesc: jobDescRef.current, deviceId }),
        signal: controller.signal,
      })
      if (analyzeRes.ok) setAiAnalysis(await analyzeRes.json())
      else showToast('AI 分析遇到问题，请稍后重试')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('parse-resume error:', e)
      showToast('AI 开小差了，请稍后重试')
      setAiPanelPhase('entry')
      return
    } finally {
      if (aiAnalyzeAbortRef.current === controller) aiAnalyzeAbortRef.current = null
    }

    setAiPanelPhase('result')
  }, [deviceId, proStatus])

  const handleAIApplyTemplate = useCallback(() => {
    prevDocTitleRef.current = null  // title is being replaced by upload name; don't restore on close
    // 1. Save the current resume to history
    const hid = loadedFromHistoryId.current
    if (hid && hid !== 'draft') {
      updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
    } else {
      saveToHistory({ name: docTitle || '我的简历', data, templateId, color, savedAt: Date.now() })
    }
    // 2. Compute a unique name for the new resume (dedup against current history)
    const currentHistory = loadHistory()
    const uniqueName = uniqueHistoryName(aiUploadFilename || '上传简历', currentHistory)
    // 3. Determine the new resume data (parsed or current)
    const newData = aiParsedData ?? data
    // 4. Create the new history entry immediately and track it
    const newId = saveToHistory({ name: uniqueName, data: newData, templateId, color, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    setDocTitle(uniqueName)
    // 5. Refresh history panel immediately so the new entry appears
    setHistoryRefreshKey(k => k + 1)
    // 6. Start loading animation
    setAiPanelPhase('applying')
    setTimeout(() => {
      // Apply parsed data into the editor and reveal the canvas
      if (aiParsedData) {
        setHistory([aiParsedData])
        setHistoryIdx(0)
      }
      setAiUploadObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      setAiUploadIsWord(false)
      setAiTemplateApplied(true)
      setAiPanelPhase('result')
      setLeftPanelTab('tpl')
      if (aiParsedData) setIsCurrentEnglish(looksEnglish(aiParsedData))
    }, 1800)
  }, [data, templateId, color, docTitle, aiUploadFilename, aiParsedData])


  const handleCanvasSelect = useCallback((sel: SelectionType) => {
    if (sel.kind !== 'none') setAiPanelOpen(false)
    setSelection(sel)
  }, [setSelection])

  const handleAIClose = useCallback(() => {
    aiAnalyzeAbortRef.current?.abort()
    aiAnalyzeAbortRef.current = null
    if (prevDocTitleRef.current !== null) {
      setDocTitle(prevDocTitleRef.current)
      prevDocTitleRef.current = null
    }
    setAiPanelOpen(false)
    setAiUploadObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setAiUploadIsWord(false)
    setAiPanelPhase('entry')
    setAiPanelFlow('current')
    setAiUploadFilename('')
    setAiTemplateApplied(false)
    setAiAnalysis(null)
    setAppliedSuggestions(new Set())
    setPendingSkills([])
    setAiParsedData(null)
    setAiUploadError(undefined)
    aiAnalyzedDataSnapshot.current = null
  }, [])

  // ============ AI suggestion apply ============
  const handleApplySuggestion = useCallback((s: AISuggestion, checkedSkills?: string[]) => {
    const stripDot = (t: string) => t.replace(/[。.！!？?]+$/, '').trim()
    if (s.section === 'summary' && s.field === 'summary') {
      const raw = s.optimizedContent
      const content = Array.isArray(raw)
        ? (raw as string[]).map(stripDot).filter(Boolean).join(' ')
        : typeof raw === 'string' ? stripDot(raw) : ''
      if (content) updateData({ summary: content, hasSummary: true })
    } else if ((s.section === 'exp' || s.section === 'project') && s.field === 'bullets' && s.entryIndex !== undefined) {
      // Strip diff markup, then clean trailing punctuation
      const bullets = Array.isArray(s.optimizedContent)
        ? (s.optimizedContent as string[]).map(b => stripDot(applyDiffBullet(b))).filter(Boolean)
        : []
      if (bullets.length) updateEntry(s.section as SectionKey, s.entryIndex, { bullets })
      // Clear diff preview for this entry
      setBulletDiffs(prev => {
        const next = { ...prev }
        delete next[`${s.section}:${s.entryIndex}`]
        return next
      })
    } else if (s.section === 'skills' && s.field === 'skills') {
      const skills = (checkedSkills ?? []).map(stripDot).filter(Boolean)
      if (skills.length) {
        setData(prev => ({ ...prev, skills: [...new Set([...prev.skills, ...skills])], hasSkills: true }))
      }
      setPendingSkills([])
    }
    setAppliedSuggestions(prev => new Set([...prev, s.id]))
    showToast('✓ AI 建议已应用')
  }, [updateData, updateEntry, setData])

  const handleApplyAllSuggestions = useCallback(() => {
    if (!aiAnalysis?.suggestions?.length) return
    const stripDot = (t: string) => t.replace(/[。.！!？?]+$/, '').trim()
    const pending = aiAnalysis.suggestions.filter(s => !appliedSuggestions.has(s.id))

    setData(prev => {
      let next = { ...prev }
      for (const s of pending) {
        if (s.section === 'summary' && s.field === 'summary') {
          const rawC = s.optimizedContent
          const content = Array.isArray(rawC)
            ? (rawC as string[]).map(stripDot).filter(Boolean).join(' ')
            : typeof rawC === 'string' ? stripDot(rawC) : ''
          if (content) next = { ...next, summary: content, hasSummary: true }
        } else if ((s.section === 'exp' || s.section === 'project') && s.field === 'bullets' && s.entryIndex !== undefined) {
          const bullets = Array.isArray(s.optimizedContent)
            ? (s.optimizedContent as string[]).map(b => stripDot(applyDiffBullet(b))).filter(Boolean)
            : []
          if (bullets.length) {
            const arr = [...(next[s.section as SectionKey] as Entry[])]
            if (arr[s.entryIndex]) { arr[s.entryIndex] = { ...arr[s.entryIndex], bullets }; next = { ...next, [s.section]: arr } }
          }
        } else if (s.section === 'skills' && s.field === 'skills') {
          const skills = Array.isArray(s.optimizedContent)
            ? (s.optimizedContent as string[]).map(stripDot).filter(Boolean)
            : []
          if (skills.length) {
            next = { ...next, skills: [...new Set([...next.skills, ...skills])], hasSkills: true }
          }
        }
      }
      return next
    })
    setAppliedSuggestions(prev => new Set([...prev, ...pending.map(s => s.id)]))
    setBulletDiffs({})
    setPendingSkills([])
    showToast(`✓ 已应用 ${pending.length} 条 AI 建议`)
  }, [aiAnalysis, appliedSuggestions, setData])

  // ============ History delete ============
  const handleHistoryDelete = useCallback((id: string) => {
    if (id === currentHistoryId) {
      setNoResumeOpen(true)
      setCurrentHistoryId(null)
      loadedFromHistoryId.current = null
      setDocTitle('')
      setSelection({ kind: 'none' })
      setIsCurrentEnglish(false)
      clearDraft()
    }
  }, [currentHistoryId])

  // Loading a history entry clears the empty state, closes right panel, and resets AI panel
  const handleLoadHistoryWithClear = useCallback((entry: HistoryEntry) => {
    setNoResumeOpen(false)
    loadedFromHistoryId.current = entry.id
    setCurrentHistoryId(entry.id)
    setHistory([entry.data])
    setHistoryIdx(0)
    setTemplateId(entry.templateId)
    setColor(entry.color)
    setDocTitle(entry.name)
    setSelection({ kind: 'none' })
    // Close AI panel and discard analysis — it belongs to the previous resume
    setAiPanelOpen(false)
    setAiPanelPhase('entry')
    setAiPanelFlow('current')
    setAiAnalysis(null)
    setAppliedSuggestions(new Set())
    setAiUploadObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setAiUploadFilename('')
    setAiTemplateApplied(false)
    setAiParsedData(null)
    setAiUploadError(undefined)
    aiAnalyzedDataSnapshot.current = null
    setIsCurrentEnglish(entry.isEnglish === true || looksEnglish(entry.data))
    showToast(`✓ 已加载「${entry.name}」`)
  }, [])

  // ============ Create new resume / Import resume ============
  const handleCreateNewResume = useCallback(() => {
    if (!noResumeOpen) {
      // Persist current state before switching (skip if no resume is open)
      const hid = loadedFromHistoryId.current
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
      } else {
        saveToHistory({ name: docTitle || '我的简历', data, templateId, color, savedAt: Date.now() })
      }
    }
    // Create fresh resume with default free template
    const newHistorySnap = loadHistory()
    const newName = uniqueHistoryName('我的简历', newHistorySnap)
    const newId = saveToHistory({ name: newName, data: DEMO_DATA, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    setHistory([DEMO_DATA])
    setHistoryIdx(0)
    setTemplateId('classic-pro')
    setColor(undefined)
    setDocTitle(newName)
    setSelection({ kind: 'none' })
    setNoResumeOpen(false)
    setHistoryRefreshKey(k => k + 1)
    showToast('✓ 新简历已创建')
  }, [data, templateId, color, docTitle, noResumeOpen])

  const handleImportAttempt = useCallback(() => {
    const check = checkUsage(deviceId, 'import', proStatus)
    if (!check.allowed) {
      setPaywallTrigger('import_limit')
      setPaywallOpen(true)
      return
    }
    importFileRef.current?.click()
  }, [deviceId, proStatus])

  const [translateLoading, setTranslateLoading] = useState(false)
  const [isCurrentEnglish, setIsCurrentEnglish] = useState(false)
  const [compressPhase, setCompressPhase] = useState<'idle' | 'loading' | 'ai-review'>('idle')
  const [compressBulletDiffs, setCompressBulletDiffs] = useState<Record<string, string[]>>({})
  const [compressSummaryInfo, setCompressSummaryInfo] = useState<{ oldText: string; newText: string } | null>(null)
  const pendingCompressCleanRef = useRef<ResumeData | null>(null)
  const [compressWarningDismissed, setCompressWarningDismissed] = useState(false)
  const [postCompressCheck, setPostCompressCheck] = useState(0)
  const postCompressDataRef = useRef<ResumeData | null>(null)

  // ============ One-page compress ============
  const PAGE_H = 1123
  const overflowPx = pageCount > 1 ? Math.max(0, canvasTotalHeightRef.current - PAGE_H) : 0
  const overflowLines = Math.ceil(overflowPx / 20)

  // Auto-show banner again when content starts overflowing again after being fixed
  useEffect(() => { if (pageCount <= 1) setCompressWarningDismissed(false) }, [pageCount])

  // When template is applied from upload flow, skip overflow banner and show compact toolbar button instead
  useEffect(() => { if (aiTemplateApplied) setCompressWarningDismissed(true) }, [aiTemplateApplied])

  const handleCompress = useCallback(async () => {
    const freshStatus = getProStatus(deviceId, currentHistoryId || undefined)
    if (freshStatus.kind !== 'subscription') {
      pendingPaywallActionRef.current = { type: 'compress' }
      setPaywallTrigger('compress')
      setPaywallOpen(true)
      return
    }
    if (compressPhase !== 'idle') return

    setCompressPhase('loading')
    try {
      const totalH = canvasTotalHeightRef.current
      const pct = totalH > 0 ? (totalH - PAGE_H) / PAGE_H * 100 : 0
      const currentScale = data.fontScale ?? 1

      if (pct <= 35) {
        // Pure font scale — one-shot, no AI needed
        const scale = parseFloat((currentScale * (PAGE_H - 5) / totalH).toFixed(4))
        updateData({ fontScale: scale })
        setCompressPhase('idle')
        showToast('✓ 已压缩至 1 页（可撤销）')
        return
      }

      // AI text trim path (overflow >35%)
      const abortCtrl = new AbortController()
      compressAbortRef.current = abortCtrl
      const res = await fetch('/api/ai/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: { ...data, photo: '', photoMeta: undefined }, deviceId }),
        signal: abortCtrl.signal,
      })
      compressAbortRef.current = null
      if (!res.ok) { showToast('AI 压缩失败，请稍后重试'); setCompressPhase('idle'); return }
      const json = await res.json()
      if (!json.data) { showToast('AI 压缩失败，请稍后重试'); setCompressPhase('idle'); return }

      // Estimate font scale after AI trim (~18% text reduction)
      const estimatedBaseH = (totalH / currentScale) * 0.82
      const rawScale = estimatedBaseH > PAGE_H ? PAGE_H / estimatedBaseH : 1
      const scale = parseFloat(Math.min(0.97, rawScale).toFixed(4))
      const newData: ResumeData = { ...json.data, fontScale: scale < 1 ? scale : undefined }
      const hasDiffs = Object.keys(json.bulletDiffs ?? {}).length > 0 || json.summaryChanged

      if (!hasDiffs) {
        postCompressDataRef.current = newData
        setData(newData)
        setCompressPhase('idle')
        setPostCompressCheck(n => n + 1)
      } else {
        // Show diffs for user review before applying
        pendingCompressCleanRef.current = newData
        setCompressBulletDiffs(json.bulletDiffs ?? {})
        setCompressSummaryInfo(json.summaryChanged ? { oldText: json.summaryOld ?? '', newText: json.summaryNew ?? '' } : null)
        setCompressPhase('ai-review')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') { setCompressPhase('idle'); return }
      showToast('压缩失败，请稍后重试')
      setCompressPhase('idle')
    }
  }, [data, deviceId, currentHistoryId, updateData, setData, compressPhase])

  const handleConfirmCompressDiffs = useCallback(() => {
    const pending = pendingCompressCleanRef.current
    if (!pending) return
    pendingCompressCleanRef.current = null
    setData(pending)
    setCompressBulletDiffs({})
    setCompressSummaryInfo(null)
    setCompressPhase('idle')
    postCompressDataRef.current = pending
    setPostCompressCheck(n => n + 1)
  }, [setData])

  const handleRejectCompressDiffs = useCallback(() => {
    pendingCompressCleanRef.current = null
    setCompressBulletDiffs({})
    setCompressSummaryInfo(null)
    setCompressPhase('idle')
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const pending = postCompressDataRef.current
    if (!pending) return
    postCompressDataRef.current = null
    const totalH = canvasTotalHeightRef.current
    if (totalH > PAGE_H) {
      const cs = pending.fontScale ?? 1
      const adjusted = parseFloat((cs * (PAGE_H - 5) / totalH).toFixed(4))
      if (adjusted < 1) {
        updateData({ fontScale: adjusted })
      }
    }
    showToast('✓ 已压缩至 1 页（可撤销）')
  }, [postCompressCheck])

  const handleTranslate = useCallback(async () => {
    // Always read fresh status from storage so post-paywall calls see the new plan
    const freshStatus = getProStatus(deviceId, currentHistoryId || undefined)
    const check = checkUsage(deviceId, 'ai_translate', freshStatus)
    if (!check.allowed) {
      if (check.reason === 'daily_limit') {
        showToast(`今日生成英文简历次数已用完（${check.used}/${check.limit} 次）`)
      } else {
        pendingPaywallActionRef.current = { type: 'ai_translate' }
        setPaywallTrigger('ai_translate')
        setPaywallOpen(true)
      }
      return
    }
    translateAbortRef.current?.abort()
    const controller = new AbortController()
    translateAbortRef.current = controller
    setTranslateLoading(true)
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: { ...data, photo: '', photoMeta: undefined }, deviceId, docTitle }),
        signal: controller.signal,
      })
      if (!res.ok) { showToast('翻译失败，请稍后重试'); return }
      const json = await res.json()
      if (!json.data) { showToast('翻译失败，请稍后重试'); return }

      const hid = loadedFromHistoryId.current
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
      }

      const currentHistory = loadHistory()
      const rawName = json.translatedTitle || `${docTitle} (English)`
      const engName = uniqueHistoryName(rawName, currentHistory)
      const newId = saveToHistory({ name: engName, data: { ...json.data, photo: data.photo, photoMeta: data.photoMeta }, templateId, color, savedAt: Date.now(), isEnglish: true })
      loadedFromHistoryId.current = newId || null
      setCurrentHistoryId(newId || null)
      setHistory([json.data])
      setHistoryIdx(0)
      setDocTitle(engName)
      setSelection({ kind: 'none' })
      setNoResumeOpen(false)
      setHistoryRefreshKey(k => k + 1)
      setIsCurrentEnglish(true)
      recordUsage(deviceId, 'ai_translate', freshStatus)
      setProStatus(getProStatus(deviceId, newId || undefined))
      const usedToday = getDailyCount(deviceId, 'ai_translate')
      const remaining = Math.max(0, 5 - usedToday)
      showToast(`✓ 英文版已生成（今日剩余 ${remaining} 次）`)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      showToast('翻译失败，请稍后重试')
    } finally {
      if (translateAbortRef.current === controller) translateAbortRef.current = null
      setTranslateLoading(false)
    }
  }, [data, deviceId, currentHistoryId, templateId, color, docTitle])

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importingFileObjRef.current = file
    setImportingFile(file.name.replace(/\.[^.]+$/, ''))
    setImportModalState('ready')
    e.target.value = ''
  }

  const handleImportStart = async () => {
    const name = importingFile
    setImportModalState('loading')

    // Persist current state (skip if no resume is open)
    if (!noResumeOpen) {
      const hid = loadedFromHistoryId.current
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
      } else {
        saveToHistory({ name: docTitle || '我的简历', data, templateId, color, savedAt: Date.now() })
      }
    }

    let importedData: ResumeData = DEMO_DATA
    const fileObj = importingFileObjRef.current
    if (fileObj) {
      try {
        const formData = new FormData()
        formData.append('file', fileObj)
        formData.append('deviceId', deviceId)
        const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData })
        if (res.ok) {
          const json = await res.json()
          importedData = parsedToResumeData(json.data ?? {})
        }
      } catch (e) {
        console.error('import parse error:', e)
      }
    }

    const currentHistory = loadHistory()
    const uniqueName = uniqueHistoryName(name, currentHistory)
    const newId = saveToHistory({ name: uniqueName, data: importedData, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    setHistory([importedData])
    setHistoryIdx(0)
    setTemplateId('classic-pro')
    setColor(undefined)
    setDocTitle(uniqueName)
    recordUsage(deviceId, 'import', proStatus)
    setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
    importingFileObjRef.current = null
    setImportModalState('none')
    setSelection({ kind: 'none' })
    setNoResumeOpen(false)
    setHistoryRefreshKey(k => k + 1)
    showToast(`✓ 已导入「${uniqueName}」`)
  }

  // ============ Keyboard shortcuts ============
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ============ Responsive breakpoint ============
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      setZoom(z => z === 70 && mobile ? 55 : z)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <>
    <div className="editor-outer" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: 'none' }} />
      <input ref={importFileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleImportFileChange} style={{ display: 'none' }} />

      <div className="no-print">
        <EditorTopbar
          docTitle={docTitle} setDocTitle={setDocTitle}
          onPreview={() => openResumeWindow(false)}
          onAIAnalyze={handleAIAnalyze}
          onDownload={handleDownloadAttempt}
          onUndo={undo} onRedo={redo}
          canUndo={historyIdx > 0}
          canRedo={historyIdx < history.length - 1}
          onSave={handleSaveHistory}
          isMobile={isMobile}
          onNewResume={handleCreateNewResume}
          onImportFile={handleImportAttempt}
          onTranslate={handleTranslate}
          translateLoading={translateLoading}
          disabled={noResumeOpen}
        />
      </div>

      {/* Pro-template preview banner — free users can see the template but need Pro to download */}
      {isProTemplate && showWatermark && !noResumeOpen && (
        <div className="no-print" style={{
          background: 'linear-gradient(90deg, #0f172a, #1e3a5f)',
          padding: '7px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.82)' }}>
            <span style={{
              display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
              background: '#f59e0b', color: 'white', fontSize: '10px', fontWeight: 700,
              marginRight: '8px', verticalAlign: 'middle',
            }}>Pro 模板预览</span>
            当前为预览模式 · 升级后可下载无水印 PDF
          </span>
          <button onClick={() => { setPaywallTrigger('download_pro'); setPaywallOpen(true) }} style={{
            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
            background: 'linear-gradient(135deg, #ef4444, #ff6b35)', color: 'white', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
          }}>解锁 Pro →</button>
        </div>
      )}

      <div className="editor-content" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Mobile backdrop */}
        {isMobile && (leftOpen || selection.kind !== 'none' || aiPanelOpen) && (
          <div
            className="no-print"
            style={{ position: 'fixed', inset: 0, top: 52, zIndex: 55, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => { setLeftOpen(false); setSelection({ kind: 'none' }); handleAIClose() }}
          />
        )}

        {/* Left panel — fixed drawer on mobile, collapsible flex child on desktop */}
        <div className="no-print" style={isMobile ? {
          position: 'fixed', left: 0, top: 52, bottom: 0, zIndex: 60,
          transform: `translateX(${leftOpen ? '0' : '-100%'})`,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: leftOpen ? '4px 0 24px rgba(0,0,0,0.18)' : 'none',
          willChange: 'transform',
        } : {
          width: leftCollapsed ? '0' : '264px',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <LeftPanel
            templateId={templateId}
            onTemplateChange={(id) => { setTemplateId(id); if (data.fontScale) updateData({ fontScale: undefined }); showToast('✓ 模板已切换'); if (isMobile) setLeftOpen(false) }}
            currentColor={effectiveColor}
            onColorChange={(c) => { setColor(c); showToast('✓ 颜色已应用') }}
            onAddModule={handleAddModule}
            data={data}
            onUpdate={updateData}
            onSaveHistory={handleSaveHistory}
            onLoadHistory={handleLoadHistoryWithClear}
            onHistoryDelete={handleHistoryDelete}
            historyRefreshKey={historyRefreshKey}
            currentHistoryId={currentHistoryId}
            currentDocTitle={docTitle}
            isMobile={isMobile}
            onClose={() => setLeftOpen(false)}
            forceTab={leftPanelTab ?? undefined}
            disabled={noResumeOpen}
            canUseProTemplate={proStatus.kind === 'subscription' || (proStatus.kind === 'single' && !proStatus.templateId)}
            unlockedProTemplateId={proStatus.kind === 'single' && !!proStatus.templateId ? proStatus.templateId : undefined}
            onProTemplateLocked={() => { setPaywallTrigger('download_pro'); setPaywallOpen(true) }}
          />
        </div>

        <div className="editor-canvas-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#e2e8f0' }}>
          {/* Toolbar */}
          <div className="no-print" style={{
            height: '44px', background: 'white', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: '6px', flexShrink: 0,
          }}>
            {/* Menu / left panel toggle */}
            <button
              onClick={() => isMobile ? setLeftOpen(v => !v) : setLeftCollapsed(v => !v)}
              title={isMobile ? '打开菜单' : (leftCollapsed ? '展开左栏' : '收起左栏')}
              style={{
                width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b' }}
            >
              <Menu size={15} />
            </button>

            {/* Mobile: undo/redo */}
            {isMobile && (
              <>
                {([
                  { icon: <Undo2 size={14} />, onClick: undo, disabled: historyIdx <= 0, title: '撤销' },
                  { icon: <Redo2 size={14} />, onClick: redo, disabled: historyIdx >= history.length - 1, title: '重做' },
                ] as const).map((btn, i) => (
                  <button key={i} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} style={{
                    width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0',
                    background: 'white', cursor: btn.disabled ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: btn.disabled ? '#cbd5e1' : '#64748b', flexShrink: 0,
                  }}>
                    {btn.icon}
                  </button>
                ))}
              </>
            )}

            {/* Desktop: page count */}
            {!isMobile && <span style={{ fontSize: '12px', color: '#64748b' }}>共 {pageCount} 页</span>}
            {showWatermark && !isMobile && (
              <span style={{
                fontSize: '11px', color: '#92400e', background: '#fef3c7',
                padding: '2px 8px', borderRadius: '4px', fontWeight: 500,
              }}>含水印</span>
            )}
            {/* Compact compress button — visible when overflow banner was dismissed */}
            {compressWarningDismissed && pageCount > 1 && compressPhase === 'idle' && !noResumeOpen && !aiUploadObjectUrl && (
              <button
                onClick={handleCompress}
                style={{
                  padding: '3px 10px', borderRadius: '5px', border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  color: 'white', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  boxShadow: '0 0 6px rgba(249,115,22,0.35)',
                  transition: 'box-shadow 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 10px rgba(249,115,22,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 6px rgba(249,115,22,0.35)' }}
              >✨ 压缩至1页</button>
            )}
            {/* Translate shortcut — shown for all users to prompt upgrade; hidden when already English */}
            {!noResumeOpen && !aiUploadObjectUrl && !isCurrentEnglish && (
              <button
                onClick={handleTranslate}
                disabled={translateLoading}
                style={{
                  padding: '3px 10px', borderRadius: '5px',
                  background: translateLoading ? '#94a3b8' : 'linear-gradient(135deg, #34d399, #059669)',
                  color: 'white',
                  fontSize: '11px', fontWeight: 700,
                  cursor: translateLoading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0, transition: 'all 0.2s',
                  border: 'none',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={11} strokeWidth={2} />{translateLoading ? (isMobile ? '…' : '翻译中…') : (isMobile ? 'EN' : '生成英文版')}
                </span>
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span ref={zoomDisplayRef} style={{ fontSize: '12px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom)}%</span>
              {([['－', -10], ['＋', 10]] as [string, number][]).map(([l, d]) => (
                <button key={l} onClick={() => commitZoom(zoomRef.current + d)} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '13px',
                  cursor: 'pointer', border: '1px solid #e2e8f0',
                  background: 'white', color: '#334155', fontFamily: 'var(--font-sans)',
                }}>{l}</button>
              ))}
              <button onClick={() => {
                commitZoom(isMobile ? 55 : 70)
                if (isMobile && canvasRef.current) {
                  canvasRef.current.scrollTop = 0
                  canvasRef.current.scrollLeft = 0
                }
              }} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                cursor: 'pointer', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontFamily: 'var(--font-sans)',
              }}>重置</button>
            </div>
          </div>

          {/* AI compress banner — animates in when loading or reviewing diffs */}
          {(() => {
            const shown = (compressPhase === 'loading' || compressPhase === 'ai-review') && !noResumeOpen
            return (
              <div style={{
                overflow: 'hidden',
                maxHeight: shown ? '140px' : '0',
                flexShrink: 0,
                pointerEvents: shown ? 'auto' : 'none',
                transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div className="no-print" style={{
                  background: '#f0f9ff', borderBottom: '2px solid #bae6fd',
                  padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(-8px)',
                  transition: 'opacity 0.22s ease, transform 0.26s ease',
                }}>
                  <style>{`@keyframes cmpSpin{to{transform:rotate(360deg)}}`}</style>
                  {compressPhase === 'loading' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '28px' }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        border: '2px solid rgba(3,105,161,0.22)',
                        borderTopColor: '#0369a1', flexShrink: 0,
                        animation: 'cmpSpin 0.75s linear infinite',
                      }} />
                      <span style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: 600 }}>
                        AI 正在分析并精简内容，请稍候…
                      </span>
                      <button
                        onClick={() => { compressAbortRef.current?.abort(); setCompressPhase('idle') }}
                        title="停止 AI 精简"
                        style={{
                          marginLeft: 'auto', width: '22px', height: '22px', borderRadius: '50%',
                          border: '1px solid #bae6fd', background: 'transparent',
                          color: '#0369a1', fontSize: '13px', lineHeight: 1,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, opacity: 0.8,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
                      >×</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: 600 }}>
                          ✨ AI 建议精简以下内容（划线 = 删除，橙色 = 修改后）
                        </span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={handleRejectCompressDiffs}
                            style={{
                              padding: '5px 12px', borderRadius: '6px',
                              border: '1px solid #bae6fd', background: 'white',
                              color: '#0369a1', fontSize: '12px', cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >取消</button>
                          <button
                            onClick={handleConfirmCompressDiffs}
                            style={{
                              padding: '5px 14px', borderRadius: '6px', border: 'none',
                              background: '#0284c7', color: 'white',
                              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >应用精简</button>
                        </div>
                      </div>
                      {compressSummaryInfo && (
                        <div style={{ fontSize: '11.5px', color: '#0c4a6e', background: '#e0f2fe', borderRadius: '6px', padding: '6px 10px', lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600 }}>个人简介：</span>
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '6px' }}>{compressSummaryInfo.oldText}</span>
                          <span style={{ color: '#0369a1' }}>{compressSummaryInfo.newText}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Overflow warning banner — animates out when compress starts */}
          {(() => {
            const shown = pageCount > 1 && !noResumeOpen && !aiUploadObjectUrl && !compressWarningDismissed && compressPhase === 'idle'
            return (
              <div style={{
                overflow: 'hidden',
                maxHeight: shown ? '80px' : '0',
                flexShrink: 0,
                pointerEvents: shown ? 'auto' : 'none',
                transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <style>{`@media(max-width:640px){.compress-text-group{flex-direction:column!important;align-items:flex-start!important;gap:1px!important}}`}</style>
                <div className="no-print" style={{
                  background: '#fff7ed', borderBottom: '1px solid #fed7aa',
                  padding: '7px 16px', display: 'flex', alignItems: 'center',
                  gap: '10px',
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(-8px)',
                  transition: 'opacity 0.22s ease, transform 0.26s ease',
                }}>
                  <div className="compress-text-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '12.5px', color: '#c2410c', fontWeight: 600, flexShrink: 0 }}>
                      ⚠ 内容超出第 1 页，约 {overflowLines} 行
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#92400e', opacity: 0.75 }}>
                      一页简历通过率高出 40%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {data.fontScale && data.fontScale < 1 && (
                      <button
                        onClick={() => updateData({ fontScale: undefined })}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', border: '1px solid #fed7aa',
                          background: 'transparent', color: '#92400e', fontSize: '11.5px',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >重置字号</button>
                    )}
                    <button
                      onClick={handleCompress}
                      style={{
                        padding: '5px 14px', borderRadius: '7px', border: 'none',
                        background: 'linear-gradient(135deg, #f97316, #ef4444)',
                        color: 'white', fontSize: '12.5px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                        boxShadow: '0 0 8px rgba(249,115,22,0.4)',
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(249,115,22,0.6)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 8px rgba(249,115,22,0.4)' }}
                    >
                      ✨ 一键压缩至 1 页
                    </button>
                    <button
                      onClick={() => setCompressWarningDismissed(true)}
                      title="关闭提示"
                      style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        border: '1px solid #fed7aa', background: 'transparent',
                        color: '#92400e', fontSize: '13px', lineHeight: 1,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, opacity: 0.7,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
                    >×</button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Empty state — shown when the active resume was deleted */}
          {noResumeOpen && !aiUploadObjectUrl && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '14px', backgroundColor: '#e2e8f0', backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <img src="/logo-black.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', opacity: 0.35 }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>从左侧-我的-加载历史简历</div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>或者在此新建、导入一份简历</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={handleCreateNewResume} style={{
                  padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  border: 'none', background: '#0f172a', color: 'white',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>创建新简历</button>
                <button onClick={handleImportAttempt} style={{
                  padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid #e2e8f0', background: 'white', color: '#334155',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>导入简历</button>
              </div>
            </div>
          )}

          {/* Canvas — hidden when showing uploaded file or empty state */}
          <div
            ref={canvasRef}
            className="print-canvas"
            style={{
              flex: 1, overflow: 'auto', display: (aiUploadObjectUrl || aiUploadIsWord || noResumeOpen) ? 'none' : 'flex',
              justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px',
              backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            onClick={() => {
              setSelection({ kind: 'none' })
              if (aiPanelOpen && (aiPanelPhase === 'entry' || (isMobile && aiPanelPhase === 'result'))) setAiPanelOpen(false)
            }}
          >
            <div ref={scaleWrapperRef} className="print-scale-wrapper" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', willChange: 'transform' }}>
              <div className="resume-print-area">
                <PaginatedResume
                  data={data}
                  template={template}
                  color={effectiveColor}
                  interactive={!aiPanelOpen || aiPanelPhase === 'entry'}
                  selection={selection}
                  onSelect={handleCanvasSelect}
                  onPhotoUpload={() => {
                    if (data.photo) { setPhotoCropOpen(true) } else { photoInputRef.current?.click() }
                  }}
                  onPagesChange={setPageCount}
                  onBreakPointsChange={(bp) => { canvasBreakPointsRef.current = bp }}
                  onMeasure={(h) => { canvasTotalHeightRef.current = h }}
                  onReorderSection={reorderEntries}
                  showWatermark={showWatermark}
                  aiSuggestionSections={aiSuggestionSections}
                  bulletDiffs={compressPhase === 'ai-review' ? compressBulletDiffs : bulletDiffs}
                  pendingSkills={pendingSkills}
                />
              </div>
            </div>
          </div>

          {/* PDF viewer — shown when an uploaded PDF is being analyzed */}
          {aiUploadObjectUrl && (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px' }}>
              <iframe
                src={aiUploadObjectUrl}
                title="上传简历预览"
                style={{ width: '794px', height: '1123px', border: 'none', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', flexShrink: 0 }}
              />
            </div>
          )}

          {/* Word file placeholder — shown when an uploaded Word doc can't be previewed */}
          {aiUploadIsWord && !aiUploadObjectUrl && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '32px 24px', backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <style>{`@keyframes wordSpin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ fontSize: '48px', lineHeight: 1 }}>📄</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>Word 文档无法直接预览</div>
              <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', lineHeight: 1.7, maxWidth: '260px' }}>
                AI 正在解析您的简历内容<br />解析完成后可使用当前模板填入简历
              </div>
              {aiPanelPhase === 'result' && !aiTemplateApplied && (
                <button
                  onClick={handleAIApplyTemplate}
                  style={{
                    marginTop: '8px', padding: '13px 28px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 20px rgba(15,23,42,0.35)',
                  }}
                >
                  使用当前模板
                </button>
              )}
              {aiPanelPhase === 'analyzing' && (
                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(7,137,236,0.22)', borderTopColor: 'var(--theme-blue)', flexShrink: 0, animation: 'wordSpin 0.75s linear infinite' }} />
                  AI 解析中，请稍候…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop: right panel slot — flex child that pushes the canvas */}
        {!isMobile && (
          <div className="no-print" style={{
            width: (selection.kind !== 'none' || aiPanelOpen) ? '288px' : '0',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <div style={{ width: '288px', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* AI Panel — slides in from right */}
              <div style={{
                position: 'absolute', inset: 0,
                transform: `translateX(${aiPanelOpen ? '0' : '100%'})`,
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                willChange: 'transform',
              }}>
                <AIPanel
                  flow={aiPanelFlow}
                  phase={aiPanelPhase}
                  uploadFilename={aiUploadFilename}
                  templateApplied={aiTemplateApplied}
                  optimizeEnabled={aiPanelFlow === 'current' || (aiPanelFlow === 'upload' && aiTemplateApplied)}
                  analysis={aiAnalysis}
                  appliedSuggestionIds={appliedSuggestions}
                  uploadError={aiUploadError}
                  jobDesc={jobDescPersist}
                  onJobDescChange={setJobDescPersist}
                  onAnalyzeCurrent={handleAIAnalyzeCurrent}
                  onSelectFile={handleAIFileSelect}
                  onApplyTemplate={handleAIApplyTemplate}
                  currentSkills={data.skills}
                  onApplySuggestion={handleApplySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onClose={handleAIClose}
                  onSkillChecksChange={setPendingSkills}
                />
              </div>
              {/* Edit Panel — slides in from right */}
              <div style={{
                position: 'absolute', inset: 0,
                transform: `translateX(${(selection.kind !== 'none' && !aiPanelOpen) ? '0' : '100%'})`,
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                willChange: 'transform',
              }}>
                <RightPanel
                  selection={selection}
                  data={data}
                  onUpdate={updateData}
                  onUpdateEntry={updateEntry}
                  onDeleteEntry={deleteEntry}
                  onAddEntry={addEntry}
                  onClose={() => setSelection({ kind: 'none' })}
                  onMoveEntry={moveEntry}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile: fixed drawers for right panels */}
        {isMobile && (
          <>
            <div className="no-print" style={{
              position: 'fixed', right: 0, top: 52, bottom: 0, zIndex: 60,
              transform: `translateX(${(selection.kind !== 'none' && !aiPanelOpen) ? '0' : '100%'})`,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: (selection.kind !== 'none' && !aiPanelOpen) ? '-4px 0 24px rgba(0,0,0,0.18)' : 'none',
              willChange: 'transform',
            }}>
              <RightPanel
                selection={selection}
                data={data}
                onUpdate={updateData}
                onUpdateEntry={updateEntry}
                onDeleteEntry={deleteEntry}
                onAddEntry={addEntry}
                onClose={() => setSelection({ kind: 'none' })}
                onMoveEntry={moveEntry}
              />
            </div>
            <div className="no-print" style={{
              position: 'fixed', right: 0, top: 52, bottom: 0, zIndex: 65,
              width: '288px',
              transform: `translateX(${aiPanelOpen ? '0' : '100%'})`,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: aiPanelOpen ? '-4px 0 24px rgba(0,0,0,0.18)' : 'none',
              willChange: 'transform',
            }}>
              <AIPanel
                flow={aiPanelFlow}
                phase={aiPanelPhase}
                uploadFilename={aiUploadFilename}
                templateApplied={aiTemplateApplied}
                optimizeEnabled={aiPanelFlow === 'current' || (aiPanelFlow === 'upload' && aiTemplateApplied)}
                analysis={aiAnalysis}
                appliedSuggestionIds={appliedSuggestions}
                uploadError={aiUploadError}
                jobDesc={jobDescPersist}
                onJobDescChange={setJobDescPersist}
                onAnalyzeCurrent={handleAIAnalyzeCurrent}
                onSelectFile={handleAIFileSelect}
                onApplyTemplate={handleAIApplyTemplate}
                onApplySuggestion={handleApplySuggestion}
                onApplyAll={handleApplyAllSuggestions}
                onClose={handleAIClose}
                onSkillChecksChange={setPendingSkills}
              />
            </div>
          </>
        )}
      </div>

      {pendingDraft && (
        <ContinueModal
          docTitle={pendingDraft.docTitle}
          savedAt={pendingDraft.savedAt}
          onContinue={handleContinueDraft}
          onNew={handleNewResume}
        />
      )}

      {modal === 'download' && (
        <DownloadModal
          onClose={() => setModal('none')}
          onPrintPDF={handlePrintPDF}
          onDownloadPNG={handleDownloadPNG}
          isPro={isProTemplate}
          isPaid={proStatus.kind !== 'free'}
          onUnlockPro={() => { setModal('none'); setPaywallTrigger('download_pro'); setPaywallOpen(true) }}
        />
      )}
      {importModalState !== 'none' && (
        <ImportModal
          filename={importingFile}
          loading={importModalState === 'loading'}
          onStart={handleImportStart}
          onClose={() => setImportModalState('none')}
        />
      )}
      {paywallOpen && (
        <PaywallModal
          trigger={paywallTrigger}
          resumeId={currentHistoryId || undefined}
          templateId={templateId}
          deviceId={deviceId}
          isStudent={isStudentVerified}
          isFirstOrder={isFirstPurchase(deviceId)}
          onClose={() => { pendingPaywallActionRef.current = null; setPaywallOpen(false) }}
          onSuccess={handlePaywallSuccess}
          onFreeDownload={paywallTrigger === 'download_free' ? () => { setPaywallOpen(false); setModal('download') } : undefined}
          onOpenStudent={() => { setPaywallOpen(false); setStudentModalOpen(true) }}
        />
      )}

      {studentModalOpen && (
        <StudentModal
          deviceId={deviceId}
          onClose={() => setStudentModalOpen(false)}
          onSuccess={() => {
            setIsStudentVerified(true)
            setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
          }}
        />
      )}

      {photoCropOpen && (
        <PhotoCropModal
          src={photoCropSrc ?? data.photo}
          initialMeta={photoCropSrc ? undefined : data.photoMeta}
          onConfirm={(meta) => {
            updateData({ photo: photoCropSrc ?? data.photo, photoMeta: meta })
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
            showToast('✓ 照片已调整')
          }}
          onReplace={() => {
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
            photoInputRef.current?.click()
          }}
          onRemove={() => {
            updateData({ photo: '', photoMeta: undefined })
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
            showToast('✓ 已移除照片')
          }}
          onClose={() => {
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
          }}
        />
      )}

      {/* Translation loading overlay */}
      {translateLoading && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '36px 40px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(15,23,42,0.22)',
            minWidth: '280px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '28px' }}>
              AI 正在生成英文简历
            </div>
            <ImportLoadingBar stages={TRANSLATE_STAGES} />
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="no-print" style={{
        position: 'fixed', bottom: '24px', left: '50%',
        transform: `translateX(-50%) translateY(${toast ? '0' : '60px'})`,
        background: '#0f172a', color: '#fff',
        padding: '11px 22px', borderRadius: '10px',
        fontSize: '13px', fontWeight: 500, zIndex: 300,
        transition: 'transform 0.3s', pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.25)',
      }}>{toast}</div>

      {/* PNG generating overlay */}
      {pngGenerating && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <style>{`@keyframes pngSpin{to{transform:rotate(360deg)}}`}</style>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: 'white',
            animation: 'pngSpin 0.8s linear infinite',
          }} />
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>正在生成图片…</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>通常需要几秒钟</div>
        </div>
      )}

      {/* PDF generating overlay (mobile server-side PDF) */}
      {pdfGenerating && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <style>{`@keyframes pdfSpin{to{transform:rotate(360deg)}}`}</style>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: 'white',
            animation: 'pdfSpin 0.8s linear infinite',
          }} />
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>正在生成 PDF…</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>通常需要 5–10 秒</div>
        </div>
      )}

    </div>

    {/* Mobile print layer — hidden on screen, revealed by @media print CSS.
        Lives outside .editor-outer so it isn't hidden when that element is display:none during print. */}
    <div className="resume-print-layer" style={{ display: 'none' }}>
      <PaginatedResume
        data={data}
        template={template}
        color={effectiveColor}
        showWatermark={showWatermark}
      />
    </div>
    </>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-sans)', color:'#64748b' }}>
        加载中...
      </div>
    }>
      <EditorInner />
    </Suspense>
  )
}
