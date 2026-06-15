'use client'
import { useState, useCallback, useRef, useEffect, useLayoutEffect, Suspense } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { Menu, Undo2, Redo2, Globe, Check } from 'lucide-react'
import EditorTopbar from './components/EditorTopbar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { DownloadModal, AIPanel, ImportModal, ContinueModal, PhotoCropModal, PaywallModal, StudentModal, NewResumeWizardModal } from './components/Modals'
import WechatLoginModal from '../components/WechatLoginModal'
import ImportLoadingBar from '../components/ImportLoadingBar'
import { KickedOutModal } from '../components/UserProfile'
import PaymentSuccessToast from '../components/PaymentSuccessToast'
import type { PaywallTrigger } from './components/Modals'
import PaginatedResume from '../lib/PaginatedResume'
import ResumeRenderer from '../lib/ResumeRenderer'
import { ResumeData, SelectionType, SectionKey, Entry, AISuggestion, DEMO_DATA, THUMB_DATA, CATEGORY_THUMB_DATA, parsedToResumeData, hasDiffMarkup, applyDiffBullet } from '../lib/types'
import { takePendingImport } from '../lib/pendingImport'
import { getTemplate, TEMPLATES, AccentStyle, FontPair } from '../lib/templates-config'
import {
  loadDraft, saveDraft, clearDraft, clearLocalResumeData,
  loadHistory, saveToHistory, deleteHistory, updateHistoryEntry, sortAndSaveHistory,
  loadPaidTemplates, addPaidTemplate, uniqueHistoryName,
  upsertCloudResume, deleteCloudResume, syncResumesWithCloud,
  syncFreeAnalyzeOnLogin, syncOrdersFromServer,
  clearGuestResumesNow,
  type HistoryEntry, type DraftState,
} from '../lib/storage'
import { generateWordBlob } from '../lib/exportWord'
import {
  getDeviceId, getProStatus, isStudent as isStudentUser, isFirstPurchase,
  hasNoWatermark, checkUsage, recordUsage, cleanOldUsage, getDailyCount,
  FREE_ANALYZE_LIMIT,
  type ProStatus,
} from '../lib/payment'
import type { PlanType } from '../lib/payment'
import { useAuth, hasSessionHint } from '../hooks/useAuth'

const HISTORY_LIMIT = 30

/** Read the rc_mem_hint cookie (set by auth/me) to get optimistic subscription state. */
function hasSubHintCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('rc_mem_hint=1'))
}

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


// Deferred guest-clear timer — cancelled if the editor remounts before it fires (React StrictMode).
let _guestClearTimer: ReturnType<typeof setTimeout> | null = null

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

function getInitData(tplId: string): ResumeData {
  const tpl = TEMPLATES.find(t => t.id === tplId)
  for (const cat of tpl?.categories ?? []) {
    if (CATEGORY_THUMB_DATA[cat]) return CATEGORY_THUMB_DATA[cat]
  }
  return THUMB_DATA
}

function isBlankData(d: ResumeData): boolean {
  return d.name === DEMO_DATA.name && d.email === DEMO_DATA.email
}

function EditorInner() {
  const searchParams = useSearchParams()
  const initTemplate = searchParams.get('template') || 'banner-warm'
  const auth = useAuth()

  // ============ Undo/Redo history stack ============
  const [history, setHistory] = useState<ResumeData[]>([getInitData(initTemplate)])
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

  // ============ Editor state ============
  const [templateId, setTemplateId] = useState(initTemplate)
  const [color, setColor] = useState<string | undefined>(undefined)
  const [accentStyleOverride, setAccentStyleOverride] = useState<AccentStyle | undefined>(undefined)
  const [fontPairOverride, setFontPairOverride] = useState<FontPair | undefined>(undefined)
  const [selection, setSelection] = useState<SelectionType>({ kind: 'none' })
  const [zoom, setZoom] = useState(70)
  const [docTitle, setDocTitle] = useState('我的简历')
  const [showEditorLogin, setShowEditorLogin] = useState(false)
  const [modal, setModal] = useState<'none' | 'download'>('none')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPanelPhase, setAiPanelPhase] = useState<'entry' | 'analyzing' | 'result' | 'applying'>('entry')
  const [aiAnalysis, setAiAnalysis] = useState<{ hasOfferRate?: boolean; offerRate?: number; overview: string; suggestions: AISuggestion[]; missingSkills?: string[]; jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null; matchBreakdown?: { experience: number; skills: number; other: number } | null } | null>(null)
  const [interviewData, setInterviewData] = useState<{ questions: string[]; answers: string[] } | null>(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [bulletDiffs, setBulletDiffs] = useState<Record<string, string[]>>({})

  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const prevIdx = historyIdx - 1
    const toUnapply = [...appliedSuggestions].filter(
      id => appliedAtHistoryIdxRef.current.get(id) === prevIdx
    )
    if (toUnapply.length > 0) {
      setAppliedSuggestions(prev => {
        const next = new Set(prev)
        toUnapply.forEach(id => next.delete(id))
        return next
      })
      if (aiAnalysis?.suggestions) {
        setBulletDiffs(prev => {
          const next = { ...prev }
          for (const id of toUnapply) {
            const s = aiAnalysis.suggestions.find(s => s.id === id)
            // Skip action cards — their optimizedContent is [] and would wipe bullets on undo
            if (s && !s.action && (s.section === 'exp' || s.section === 'project') && s.entryIndex !== undefined && Array.isArray(s.optimizedContent)) {
              next[`${s.section}:${s.entryIndex}`] = s.optimizedContent as string[]
            }
          }
          return next
        })
      }
    }
    setHistoryIdx(prevIdx)
  }, [historyIdx, appliedSuggestions, aiAnalysis])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const toReapply = [...appliedAtHistoryIdxRef.current.entries()]
      .filter(([_, fromIdx]) => fromIdx === historyIdx)
      .map(([id]) => id)
      .filter(id => !appliedSuggestions.has(id))
    if (toReapply.length > 0) {
      setAppliedSuggestions(prev => new Set([...prev, ...toReapply]))
      if (aiAnalysis?.suggestions) {
        setBulletDiffs(prev => {
          const next = { ...prev }
          for (const id of toReapply) {
            const s = aiAnalysis.suggestions.find(s => s.id === id)
            if (s && (s.section === 'exp' || s.section === 'project') && s.entryIndex !== undefined) {
              delete next[`${s.section}:${s.entryIndex}`]
            }
          }
          return next
        })
      }
    }
    setHistoryIdx(historyIdx + 1)
  }, [historyIdx, history.length, appliedSuggestions, aiAnalysis])

  const [pendingSkills, setPendingSkills] = useState<string[]>([])
  const [jobDescPersist, setJobDescPersist] = useState('')
  const [noResumeOpen, setNoResumeOpen] = useState(false)
  const [importModalState, setImportModalState] = useState<'none' | 'ready' | 'loading'>('none')
  const [importingFile, setImportingFile] = useState('')
  const [importBanner, setImportBanner] = useState<'free_exhausted' | 'sub_exhausted' | null>(null)
  const importingFileObjRef = useRef<File | null>(null)
  const importAbortRef = useRef<AbortController | null>(null)
  const importCancelledRef = useRef(false)
  const [toast, setToast] = useState('')
  const [toastLabel, setToastLabel] = useState('')
  const toastHideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const appliedAtHistoryIdxRef = useRef<Map<string, number>>(new Map())
  const pendingLoginActionRef = useRef<'download' | 'save' | 'translate' | 'compress' | 'unlock_pro' | 'import' | 'ai_analyze' | null>(null)
  const translateAbortRef = useRef<AbortController | null>(null)
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
  const [photoConverting, setPhotoConverting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasBreakPointsRef = useRef<number[]>([0])
  const canvasTotalHeightRef = useRef(0)
  const postScaleIterRef = useRef(0)
  const scaleWrapperRef = useRef<HTMLDivElement>(null)
  const zoomDisplayRef = useRef<HTMLSpanElement>(null)
  const zoomCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)
  const cloudSyncDone = useRef(false)
  // True once the canvas is safe to reveal; starts false for logged-in users so DEMO_DATA never flashes.
  // Initialize to true (SSR-safe) then immediately correct on client before first paint.
  const [canvasReady, setCanvasReady] = useState(true)
  useLayoutEffect(() => { if (hasSessionHint()) setCanvasReady(false) }, [])
  const loggingOutRef = useRef(false)
  const loggedInRef = useRef(false)  // mirrors auth.loggedIn for use inside event handler closures
  const authRefreshRef = useRef<() => void>(() => {})
  const authFreeAnalyzeUsedRef = useRef(0)
  const authDailyAnalyzeUsedRef = useRef(0)
  const authDailyImportUsedRef = useRef(0)
  const authDailyTranslateUsedRef = useRef(0)
  const cloudPushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const guestNoResumeRef = useRef(false)  // set synchronously in init to block auto-entry-creation
  // Always reflects the latest editor state for use in cleanup effects
  const latestForAutoSave = useRef({ data, docTitle, templateId, color, accentStyleOverride, fontPairOverride })
  // Live refs for use inside event handler closures that can't depend on state
  const isMobileRef = useRef(false)
  const zoomRef = useRef(zoom)
  const proStatusRef = useRef<ProStatus>(proStatus)
  const prevDocTitleRef = useRef<string | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  const template = getTemplate(templateId)
  const effectiveTemplate = {
    ...template,
    accentStyle: accentStyleOverride ?? template.accentStyle,
    fontPair: fontPairOverride ?? template.fontPair,
  }
  const effectiveColor = color || template.accentColor
  // Watermark: shown for free users on all templates; hidden for any paid plan.
  const showWatermark = proStatus.kind === 'free'
  const [watermarkBannerDismissed, setWatermarkBannerDismissed] = useState(false)

  // Build the set of section keys that have unapplied AI suggestions (for badges in renderer)
  const aiSuggestionSections = undefined

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    if (toastHideRef.current) clearTimeout(toastHideRef.current)
    setToastLabel(msg)
    setToast(msg)
    toastRef.current = setTimeout(() => {
      setToast('')  // triggers slide-out animation
      toastHideRef.current = setTimeout(() => setToastLabel(''), 300)  // clear text after animation
    }, 2200)
  }

  // Initialize device ID once on mount
  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    cleanOldUsage()
  }, [])

  // Safety valve: unblock canvas if cloud sync never fires (e.g. network error, expired token).
  useEffect(() => {
    const t = setTimeout(() => setCanvasReady(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Recompute pro status when device, active resume, or server membership changes.
  // Server is authoritative for all logged-in users; localStorage is only the fallback for guests.
  useEffect(() => {
    if (!deviceId) return
    const m = auth.membership
    const now = Date.now()
    if (!auth.loading && auth.loggedIn && m) {
      if (m.plan !== 'single') {
        // Subscription confirmed by server
        if (!m.expires_at || m.expires_at > now) {
          const planLabel = (m.plan === 'trial7' ? 'monthly' : m.plan) as 'monthly' | 'quarterly' | 'yearly'
          setProStatus({ kind: 'subscription', plan: planLabel, expiresAt: m.expires_at ?? now + 365 * 86_400_000 })
        } else {
          setProStatus({ kind: 'free' })
        }
      } else {
        // Single purchase — use server-stored resumeId and DB usage counter
        const singleResumeId = m.single_resume_id ?? null
        if (singleResumeId && currentHistoryId && singleResumeId === currentHistoryId) {
          setProStatus({
            kind: 'single',
            orderId: '',  // server tracks usage; orderId only needed for legacy localStorage path
            resumeId: singleResumeId,
            templateId: m.single_template_id ?? '',
            aiAnalyzeLeft: Math.max(0, 5 - auth.singleAnalyzeUsed),
          })
        } else {
          // Not viewing the unlocked resume — fall back to localStorage in case there's
          // a local-only single purchase for this resume (e.g. purchased before login)
          setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
        }
      }
    } else if (auth.loading && hasSubHintCookie()) {
      // Auth still loading but hint cookie says subscriber — show member UI immediately
      // to avoid the free-user flash while waiting for the API round-trip.
      // The real state will overwrite this once auth/me responds.
      setProStatus({ kind: 'subscription', plan: 'monthly', expiresAt: now + 365 * 86_400_000 })
    } else {
      setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
    }
    // For logged-in users, server is the source of truth for student status
    setIsStudentVerified(auth.loggedIn && !auth.loading ? auth.isStudent : isStudentUser(deviceId))
  }, [deviceId, currentHistoryId, auth.loggedIn, auth.loading, auth.membership, auth.isStudent, auth.singleAnalyzeUsed])

  // ============ Cloud sync — pull on login / first auth resolve ============
  useEffect(() => {
    if (auth.loading || !auth.loggedIn || cloudSyncDone.current) return
    cloudSyncDone.current = true

    // Sync free AI-analyze count (max(local, server))
    syncFreeAnalyzeOnLogin(auth.freeAnalyzeUsed)
    // Sync paid orders into localStorage so getProStatus works cross-device.
    // After syncing, only fall back to localStorage-derived status if the server
    // hasn't already confirmed an active subscription — avoids overriding the
    // server-authoritative state with stale or device-mismatched local data.
    const membershipAtSync = auth.membership
    syncOrdersFromServer().then(() => {
      const isServerSub = !!(membershipAtSync && membershipAtSync.plan !== 'single' &&
        (!membershipAtSync.expires_at || membershipAtSync.expires_at > Date.now()))
      if (!isServerSub) {
        setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
      }
    })
    // Sync resume history; auto-load most recent entry when nothing is currently open,
    // or when the current entry is an unedited blank (DEMO_DATA, user logged in without making edits)
    syncResumesWithCloud().then(changed => {
      if (changed) setHistoryRefreshKey(k => k + 1)
      const currentId = loadedFromHistoryId.current
      // Read and immediately clear intentional-entry flags so they only protect once
      const fromTemplateId = (() => { try { return sessionStorage.getItem('rc_from_template') || '' } catch { return '' } })()
      try { sessionStorage.removeItem('rc_from_template') } catch {}
      const fromAtsId = (() => { try { return sessionStorage.getItem('rc_from_ats') || '' } catch { return '' } })()
      try { sessionStorage.removeItem('rc_from_ats') } catch {}
      const isBlankEntry = currentId
          && isBlankData(latestForAutoSave.current.data)
          && currentId !== fromTemplateId
          && currentId !== fromAtsId
      if (!currentId || isBlankEntry) {
        const hist = loadHistory()
        const candidates = isBlankEntry ? hist.filter(e => e.id !== currentId) : hist
        if (candidates.length > 0) {
          const recent = candidates.reduce((best, e) => e.savedAt > best.savedAt ? e : best, candidates[0])
          if (isBlankEntry) {
            deleteHistory(currentId!)
            deleteCloudResume(currentId!)
          }
          loadedFromHistoryId.current = recent.id
          setCurrentHistoryId(recent.id)
          setHistory([recent.data])
          setHistoryIdx(0)
          setTemplateId(recent.templateId)
          setColor(recent.color)
          setAccentStyleOverride(recent.accentStyleOverride)
          setFontPairOverride(recent.fontPairOverride)
          setDocTitle(recent.name)
          setIsCurrentEnglish(recent.isEnglish === true || looksEnglish(recent.data))
          setHistoryRefreshKey(k => k + 1)
        } else {
          // No resumes in cloud or local — show empty state (don't auto-create)
          if (isBlankEntry && currentId) {
            deleteHistory(currentId)
            deleteCloudResume(currentId)
          }
          loadedFromHistoryId.current = null
          setCurrentHistoryId(null)
          setDocTitle('')
          setNoResumeOpen(true)
          setHistoryRefreshKey(k => k + 1)
        }
      }
    }).finally(() => setCanvasReady(true))
  }, [auth.loading, auth.loggedIn])

  // Reset cloudSyncDone so a re-login re-pulls from cloud.
  useEffect(() => {
    if (!auth.loading && !auth.loggedIn) {
      cloudSyncDone.current = false
      setCanvasReady(true)  // session hint expired or no session — reveal canvas immediately
    }
  }, [auth.loading, auth.loggedIn])

  // For guests with no history: create the initial entry after auth resolves so "我的" shows it.
  // Skip if the user just logged out (they want a clean slate, not a new blank entry).
  // This must run AFTER auth, not during init, to avoid uploading a blank entry to logged-in users' cloud.
  useEffect(() => {
    if (auth.loading || auth.loggedIn) return               // skip for logged-in users
    if (!initialized.current) return                        // wait for init
    if (guestNoResumeRef.current || noResumeOpen) return   // user is in empty state, don't auto-create
    if (loadedFromHistoryId.current) return                 // already tracking an entry
    const hist = loadHistory()
    if (hist.length > 0) return                             // history appeared from somewhere else
    // Skip if we just did an editor logout — the user expects an empty state, not a new blank entry
    try {
      if (sessionStorage.getItem('rc_just_logged_out')) {
        sessionStorage.removeItem('rc_just_logged_out')
        return
      }
    } catch {}
    const { data: d, docTitle: dt, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo } = latestForAutoSave.current
    const newId = saveToHistory({ name: dt || '我的简历', data: d, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo, savedAt: Date.now() })
    if (newId) {
      loadedFromHistoryId.current = newId
      setCurrentHistoryId(newId)
      setHistoryRefreshKey(k => k + 1)
    }
  }, [auth.loading, auth.loggedIn, noResumeOpen])

  // ============ Load draft from localStorage on mount ============
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const paid = loadPaidTemplates()
    setPaidTemplates(paid)

    // Quick import: user clicked "直接导入" on landing page — parse is in-flight in a module-level promise
    const pendingImport = takePendingImport()
    if (pendingImport) {
      // Mark as in-flight so the guest-entry-creation effect doesn't race and create a blank entry
      loadedFromHistoryId.current = 'pending'
      importCancelledRef.current = false
      setImportModalState('loading')
      setImportingFile('正在导入简历...')
      pendingImport
        .then(({ data: importedRaw, filename }) => {
          if (importCancelledRef.current) return
          const parsed = parsedToResumeData(importedRaw)
          const currentHistory = loadHistory()
          const mountLimit = getProStatus(getDeviceId(), undefined).kind === 'free' ? 20 : 100
          if (currentHistory.length >= mountLimit) {
            showToast(`简历数量已达上限（${mountLimit} 份），请先删除旧简历`)
            setImportModalState('none')
            setImportingFile('')
            return
          }
          const uniqueName = uniqueHistoryName(filename || '上传简历', currentHistory)
          const newId = saveToHistory({ name: uniqueName, data: parsed, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
          loadedFromHistoryId.current = newId || null
          setCurrentHistoryId(newId || null)
          setDocTitle(uniqueName)
          setHistory([parsed])
          setHistoryIdx(0)
          setTemplateId('banner-warm')
          setColor(undefined)
          setHistoryRefreshKey(k => k + 1)
          setIsCurrentEnglish(looksEnglish(parsed))
          setImportModalState('none')
          setImportingFile('')
          setLeftPanelTab('tpl')
        })
        .catch((e: Error) => {
          if (importCancelledRef.current) return
          setImportModalState('none')
          setImportingFile('')
          showToast(e?.message === 'empty' ? '未检测到简历内容，请上传有效的简历文件' : '导入失败，请在编辑器中重新上传')
        })
      return
    }

    // Landing-page import: user uploaded/analyzed a resume on the homepage → stored in sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem('resumecraft_landing_import')
      if (raw) {
        sessionStorage.removeItem('resumecraft_landing_import')
        try {
          const { data: importedRaw, filename, analysis, interviewData: importedInterviewData } = JSON.parse(raw)
          const parsed = parsedToResumeData(importedRaw ?? {})
          const currentHistory = loadHistory()
          const mountLimit = getProStatus(getDeviceId(), undefined).kind === 'free' ? 20 : 100
          if (currentHistory.length >= mountLimit) {
            showToast(`简历数量已达上限（${mountLimit} 份），请先删除旧简历`)
            return
          }
          const uniqueName = uniqueHistoryName(filename || '上传简历', currentHistory)
          const newId = saveToHistory({ name: uniqueName, data: parsed, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
          loadedFromHistoryId.current = newId || null
          setCurrentHistoryId(newId || null)
          setDocTitle(uniqueName)
          setHistory([parsed])
          setHistoryIdx(0)
          setTemplateId('banner-warm')
          setColor(undefined)
          setHistoryRefreshKey(k => k + 1)
          setIsCurrentEnglish(looksEnglish(parsed))
          setLeftPanelTab('tpl')

          if (analysis) {
            setAiAnalysis(analysis)
            setAiPanelOpen(true)
            setAiPanelPhase('result')
            if (importedInterviewData?.questions?.length) {
              setInterviewData(importedInterviewData)
            }
          }
          // Simple upload flow: no AI panel — canvas shows parsed data right away
          return
        } catch (e) {
          console.error('Landing import error:', e)
        }
      }
    }

    // ATS import: came from landing page ATS analysis — load pre-parsed resume + open AI panel
    if (searchParams.get('from_ats')) {
      window.history.replaceState({}, '', '/editor')
      try {
        const stored = sessionStorage.getItem('rc_ats_import')
        sessionStorage.removeItem('rc_ats_import')
        console.log('[ATS import] stored value:', stored ? JSON.parse(stored) : null)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Support both new format { filename, resume: {...} } and old direct-parsedData format
          const hasNewFormat = parsed && typeof parsed === 'object' && 'resume' in parsed
          const raw = (hasNewFormat ? parsed.resume : parsed) ?? {}
          const filename: string | undefined = hasNewFormat ? parsed.filename : undefined
          console.log('[ATS import] raw resume data:', raw)
          const resumeData = parsedToResumeData(raw)
          console.log('[ATS import] parsed ResumeData:', { name: resumeData.name, expCount: resumeData.exp?.length, eduCount: resumeData.edu?.length })
          const currentHistory = loadHistory()
          const newName = uniqueHistoryName(filename || raw.name || '我的简历', currentHistory)
          const newId = saveToHistory({ name: newName, data: resumeData, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
          if (newId) {
            loadedFromHistoryId.current = newId
            setCurrentHistoryId(newId)
            try { sessionStorage.setItem('rc_from_ats', newId) } catch {}
          }
          setHistory([resumeData])
          setHistoryIdx(0)
          setTemplateId('banner-warm')
          setDocTitle(newName)
          setNoResumeOpen(false)
          setLeftPanelTab('tpl')
          setAiPanelOpen(true)
          setAiPanelPhase('entry')
          return
        }
      } catch {}
    }

    // Template card (?template=xxx): start fresh with chosen template
    if (searchParams.get('template')) {
      const currentHistory = loadHistory()
      const initName = uniqueHistoryName('我的简历', currentHistory)
      const newId = saveToHistory({ name: initName, data: getInitData(initTemplate), templateId: initTemplate, color: undefined, savedAt: Date.now() })
      if (newId) {
        loadedFromHistoryId.current = newId
        setCurrentHistoryId(newId)
        // Mark as intentional so cloud sync won't treat it as an unedited blank and delete it
        try { sessionStorage.setItem('rc_from_template', newId) } catch {}
      }
      setDocTitle(initName)
      // Strip ?template param so a page refresh doesn't create another entry
      window.history.replaceState({}, '', '/editor')
      return
    }

    // Logged-in users: skip localStorage — resumes must come from the DB.
    // Cloud sync (which runs after auth resolves) is the authoritative source.
    // hasSessionHint() reads the localStorage auth cache as a proxy for login state
    // since rc_token is httpOnly and unreadable from JS.
    if (hasSessionHint()) {
      setDocTitle('我的简历')
      return
    }

    // Guest: load the most recent history entry from localStorage directly.
    const currentHistory = loadHistory()
    if (currentHistory.length > 0) {
      const recent = currentHistory.reduce((best, e) => e.savedAt > best.savedAt ? e : best, currentHistory[0])
      loadedFromHistoryId.current = recent.id
      setCurrentHistoryId(recent.id)
      setHistory([recent.data])
      setHistoryIdx(0)
      setTemplateId(recent.templateId)
      setColor(recent.color)
      setAccentStyleOverride(recent.accentStyleOverride)
      setFontPairOverride(recent.fontPairOverride)
      setDocTitle(recent.name)
      setIsCurrentEnglish(recent.isEnglish === true || looksEnglish(recent.data))
      return
    }

    // Completely fresh guest (no history): show empty state, don't pre-fill with demo data.
    guestNoResumeRef.current = true
    setNoResumeOpen(true)
    setDocTitle('我的简历')
  }, [])

  // ============ Auto-save draft to localStorage ============
  useEffect(() => {
    if (!initialized.current) return
    const hid = loadedFromHistoryId.current
    const now = Date.now()
    // Persist historyId in the draft so "继续编辑" can restore the correct association
    try {
      saveDraft({ data, templateId, color, accentStyleOverride, fontPairOverride, docTitle, savedAt: now, historyId: hid ?? undefined })
      // Keep the history entry in sync — includes name so renaming the doc updates the list
      if (hid && hid !== 'draft' && hid !== 'pending') {
        updateHistoryEntry(hid, { data, templateId, color, accentStyleOverride, fontPairOverride, name: docTitle, savedAt: now })
      }
    } catch {
      showToast('⚠️ 保存失败：本地存储空间不足，请移除照片或清理历史记录')
    }
    // Debounced cloud push: 3 s after the last edit, push the current resume to cloud
    if (auth.loggedIn && hid && hid !== 'draft' && hid !== 'pending') {
      if (cloudPushTimer.current) clearTimeout(cloudPushTimer.current)
      cloudPushTimer.current = setTimeout(() => {
        const entry = loadHistory().find(h => h.id === hid)
        if (entry) upsertCloudResume(entry)
      }, 3000)
    }
  }, [data, templateId, color, accentStyleOverride, fontPairOverride, docTitle])

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
    latestForAutoSave.current = { data, docTitle, templateId, color, accentStyleOverride, fontPairOverride }
    isMobileRef.current = isMobile
    zoomRef.current = zoom
    loggedInRef.current = auth.loggedIn
    authRefreshRef.current = auth.refresh
    authFreeAnalyzeUsedRef.current = auth.freeAnalyzeUsed ?? 0
    authDailyAnalyzeUsedRef.current = auth.dailyAnalyzeUsed ?? 0
    authDailyImportUsedRef.current = auth.dailyImportUsed ?? 0
    authDailyTranslateUsedRef.current = auth.dailyTranslateUsed ?? 0
    proStatusRef.current = proStatus
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
    // Cancel any pending guest-clear from a previous unmount (React StrictMode double-invoke).
    if (_guestClearTimer !== null) {
      clearTimeout(_guestClearTimer)
      _guestClearTimer = null
    }

    const saveOnExit = () => {
      if (!initialized.current) return
      if (loggingOutRef.current) return
      if (loadedFromHistoryId.current) return
      const { data: d, docTitle: dt, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo } = latestForAutoSave.current
      saveToHistory({ name: dt || '我的简历', data: d, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo, savedAt: Date.now() })
      // Re-sort history by savedAt so the most recently edited resume appears first next session
      sortAndSaveHistory()
    }
    const guestExitOnUnload = () => {
      // Immediately wipe guest resumes when leaving the editor.
      // Logged-in users' data lives in the cloud; guests get a clean slate on every session.
      if (!loggingOutRef.current && !loggedInRef.current) {
        clearGuestResumesNow()
      }
    }
    const abortOnExit = () => {
      aiAnalyzeAbortRef.current?.abort()
      translateAbortRef.current?.abort()
    }
    window.addEventListener('beforeunload', saveOnExit)
    window.addEventListener('beforeunload', guestExitOnUnload)
    window.addEventListener('beforeunload', abortOnExit)
    return () => {
      window.removeEventListener('beforeunload', saveOnExit)
      window.removeEventListener('beforeunload', guestExitOnUnload)
      window.removeEventListener('beforeunload', abortOnExit)
      // Client-side navigation (Next.js router) triggers unmount, not beforeunload.
      // Defer the clear so React StrictMode's simulated unmount/remount doesn't wipe data.
      // The timer is cancelled above if the editor remounts within 200ms.
      if (!loggingOutRef.current && !loggedInRef.current) {
        _guestClearTimer = setTimeout(() => {
          _guestClearTimer = null
          clearGuestResumesNow()
        }, 200)
      }
      aiAnalyzeAbortRef.current?.abort()
      translateAbortRef.current?.abort()
    }
  }, [])

  // ============ Data updates ============
  const updateData = useCallback((patch: Partial<ResumeData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [setData])

  // Patch the current history entry in-place — does NOT add a new undo step.
  // Used by the post-compress correction so that undo always reverts to pre-compress state.
  const replaceCurrentData = useCallback((patch: Partial<ResumeData>) => {
    setHistory(prev => {
      const updated = [...prev]
      updated[historyIdx] = { ...updated[historyIdx], ...patch }
      return updated
    })
  }, [historyIdx])

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
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (currentHistory.length >= resumeLimit) {
      showToast(`简历数量已达上限（${resumeLimit} 份），请先删除旧简历`)
      return
    }
    const newName = uniqueHistoryName('我的简历', currentHistory)
    const newId = saveToHistory({ name: newName, data: THUMB_DATA, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
    if (newId) {
      loadedFromHistoryId.current = newId
      setCurrentHistoryId(newId)
      if (auth.loggedIn) {
        // Immediately push to cloud so it persists across navigation
        const entry = loadHistory().find(h => h.id === newId)
        if (entry) upsertCloudResume(entry)
      }
    }
    setHistory([THUMB_DATA])
    setHistoryIdx(0)
    setTemplateId('banner-warm')
    setColor(undefined)
    setDocTitle(newName)
    setIsCurrentEnglish(false)
    setLeftPanelTab('tpl')
  }, [auth.loggedIn])

  // ============ Editor logout ============
  const handleEditorLogout = useCallback(async () => {
    loggingOutRef.current = true   // 阻止 beforeunload 重写已清除的数据
    // Signal that we just logged out so the blank-entry creation effect skips on reload
    try { sessionStorage.setItem('rc_just_logged_out', '1') } catch {}
    clearLocalResumeData()
    await auth.logout()
    window.location.reload()
  }, [auth])

  // ============ History (saved drafts) ============
  const handleSaveHistory = useCallback(() => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'save'
      setShowEditorLogin(true)
      return
    }
    try {
      saveToHistory({ name: docTitle, data, templateId, color, savedAt: Date.now() })
      setHistoryRefreshKey(k => k + 1)
      if (isMobile) setLeftOpen(true)
      showToast('✓ 已保存')
    } catch {
      showToast('⚠️ 保存失败：本地存储空间不足，请移除照片或清理历史记录')
    }
  }, [docTitle, data, templateId, color, isMobile, auth.loggedIn])


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

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
      || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

    if (isHeic) {
      setPhotoConverting(true)
      setPhotoCropSrc(null)
      setPhotoCropOpen(true)
      try {
        const heic2any = (await import('heic2any')).default
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }) as Blob
        file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
      } catch {
        setPhotoConverting(false)
        setPhotoCropOpen(false)
        showToast('照片格式转换失败，请改用 JPG 或 PNG 格式')
        return
      }
    }

    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressPhoto(ev.target?.result as string)
      setPhotoCropSrc(compressed)
      setPhotoConverting(false)
      if (!isHeic) setPhotoCropOpen(true)
    }
    reader.readAsDataURL(file)
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
    // Refresh server auth so membership is up to date across devices
    auth.refresh()
    const action = pendingPaywallActionRef.current
    pendingPaywallActionRef.current = null
    if (action?.type === 'download') setTimeout(() => setModal('download'), 80)
    if (action?.type === 'ai_translate') setTimeout(() => handleTranslate(), 80)
    if (action?.type === 'compress') setTimeout(() => handleCompress(), 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, currentHistoryId, auth.refresh])

  // After login, automatically retry the action that triggered the login prompt
  useEffect(() => {
    if (auth.loading || !auth.loggedIn) return
    const action = pendingLoginActionRef.current
    if (!action) return
    pendingLoginActionRef.current = null
    if (action === 'download')   setTimeout(() => handleDownloadAttempt(), 80)
    if (action === 'save')       setTimeout(() => handleSaveHistory(), 80)
    if (action === 'translate')  setTimeout(() => handleTranslate(), 80)
    if (action === 'compress')   setTimeout(() => handleCompress(), 80)
    if (action === 'unlock_pro') setTimeout(() => handleUnlockPro(), 80)
    if (action === 'import')     setTimeout(() => importFileRef.current?.click(), 80)
    if (action === 'ai_analyze') setTimeout(() => handleAIAnalyze(), 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loggedIn, auth.loading])

  const handleDownloadAttempt = useCallback(() => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'download'
      setShowEditorLogin(true)
      return
    }
    if (showWatermark) {
      pendingPaywallActionRef.current = { type: 'download' }
      setPaywallTrigger('download_free')
      setPaywallOpen(true)
      return
    }
    setModal('download')
  }, [showWatermark, auth.loggedIn])

  const handleUnlockPro = useCallback(() => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'unlock_pro'
      setShowEditorLogin(true)
      return
    }
    setPaywallTrigger('download_free')
    setPaywallOpen(true)
  }, [auth.loggedIn])

  // ============ AI Panel ============
  const handleAIAnalyze = useCallback(() => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'ai_analyze'
      setShowEditorLogin(true)
      return
    }
    // Abort any in-flight analysis from a previous panel open
    aiAnalyzeAbortRef.current?.abort()
    aiAnalyzeAbortRef.current = null
    setSelection({ kind: 'none' })
    setAiPanelOpen(true)
    // If the resume hasn't changed since the last analysis, restore cached results
    const hasCachedAnalysis = aiAnalysis !== null && aiAnalyzedDataSnapshot.current === JSON.stringify(data)
    if (hasCachedAnalysis) {
      setAiPanelPhase('result')
    } else {
      setAiPanelPhase('entry')
      setAiAnalysis(null); setInterviewData(null); setInterviewLoading(false)
      setAppliedSuggestions(new Set())
    }
  }, [data, aiAnalysis])

  const handleAIAnalyzeCurrent = useCallback(async (jobDesc: string) => {
    if (loggedInRef.current) {
      const currentStatus = proStatusRef.current
      const isSub    = currentStatus.kind === 'subscription'
      const isSingle = currentStatus.kind === 'single'
      const exhausted = isSub
        ? authDailyAnalyzeUsedRef.current >= 20
        : isSingle
          ? currentStatus.aiAnalyzeLeft <= 0
          : authFreeAnalyzeUsedRef.current >= FREE_ANALYZE_LIMIT
      if (exhausted) {
        if (isSub) {
          showToast('今日 20 次已用完，明日 00:00 自动重置')
        } else {
          setPaywallTrigger('ai_analyze')
          setPaywallOpen(true)
        }
        return
      }
    } else {
      pendingLoginActionRef.current = 'ai_analyze'
      setShowEditorLogin(true)
      return
    }
    const dataSnapshot = JSON.stringify(data)  // snapshot before async gap
    setAiPanelPhase('analyzing')
    setAiAnalysis(null); setInterviewData(null); setInterviewLoading(false)
    setAppliedSuggestions(new Set())
    appliedAtHistoryIdxRef.current.clear()

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
        recordUsage(deviceId, 'ai_analyze', proStatus)
        setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
        // For logged-in users, refresh from server so dailyAnalyzeUsed / freeAnalyzeUsed are up to date
        if (loggedInRef.current) void authRefreshRef.current()
        setAiAnalysis(result)
        aiAnalyzedDataSnapshot.current = dataSnapshot
        setAiPanelPhase('result')
      } else if (res.status === 429) {
        const errJson = await res.json().catch(() => null)
        showToast(errJson?.error || '使用次数已达上限，请升级 Pro')
        setAiPanelPhase('entry')
        if (loggedInRef.current) void authRefreshRef.current()
      } else if (res.status === 413) {
        showToast('工作详情太长了，请精简后重试（最多 6000 字）')
        setAiPanelPhase('entry')
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
    setAiPanelPhase('entry')
    setAiAnalysis(null); setInterviewData(null); setInterviewLoading(false)
    setAppliedSuggestions(new Set())
    setPendingSkills([])
    setJobDescPersist('')
    aiAnalyzedDataSnapshot.current = null
  }, [])

  // ============ AI suggestion apply ============
  const handleApplySuggestion = useCallback((s: AISuggestion, checkedSkills?: string[]) => {
    appliedAtHistoryIdxRef.current.set(s.id, historyIdx)
    const stripDot = (t: string) => t.replace(/[。.！!？?]+$/, '').trim()
    const sec = s.section as SectionKey

    if (s.action === 'remove' && (s.section === 'exp' || s.section === 'project')) {
      setData(prev => {
        const arr = [...(prev[sec] as Entry[])]
        // Prefer stable entryId lookup; fall back to index only if id not found
        const idx = s.entryId
          ? arr.findIndex(e => e.id === s.entryId)
          : s.entryIndex ?? -1
        if (idx >= 0) arr.splice(idx, 1)
        return { ...prev, [sec]: arr }
      })
    } else if ((s.action === 'add' || s.action === 'fill') && s.newEntry && (s.section === 'exp' || s.section === 'project')) {
      const entry: Entry = {
        id: `${Date.now()}-ai`,
        title: s.newEntry.title,
        sub: s.newEntry.sub,
        date: s.newEntry.date,
        bullets: s.newEntry.bullets.map(stripDot),
      }
      setData(prev => ({
        ...prev,
        [sec]: [...(prev[sec] as Entry[]), entry],
        ...(sec === 'project' ? { hasProject: true } : {}),
      }))
    } else if (s.section === 'summary' && s.field === 'summary') {
      const raw = s.optimizedContent
      const content = Array.isArray(raw)
        ? (raw as string[]).map(stripDot).filter(Boolean).join(' ')
        : typeof raw === 'string' ? stripDot(raw) : ''
      if (content) updateData({ summary: content, hasSummary: true })
    } else if ((s.section === 'exp' || s.section === 'project') && s.field === 'bullets' && s.entryIndex !== undefined) {
      const bullets = Array.isArray(s.optimizedContent)
        ? (s.optimizedContent as string[]).map(b => stripDot(applyDiffBullet(b))).filter(Boolean)
        : []
      if (bullets.length) updateEntry(sec, s.entryIndex, { bullets })
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
  }, [historyIdx, updateData, updateEntry, setData])

  const handleGenerateInterview = useCallback(async () => {
    if (interviewLoading || !aiAnalysis) return
    setInterviewLoading(true)
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: { ...data, photo: '', photoMeta: undefined }, jobDesc: jobDescPersist, deviceId }),
      })
      if (res.ok) {
        const json = await res.json()
        setInterviewData({ questions: json.interviewQuestions ?? [], answers: json.interviewAnswers ?? [] })
      }
    } catch { /* silent */ } finally {
      setInterviewLoading(false)
    }
  }, [interviewLoading, aiAnalysis, data, jobDescPersist, deviceId])

  const handleApplyAllSuggestions = useCallback(() => {
    if (!aiAnalysis?.suggestions?.length) return
    const stripDot = (t: string) => t.replace(/[。.！!？?]+$/, '').trim()
    const pending = aiAnalysis.suggestions.filter(s => !appliedSuggestions.has(s.id))
    for (const s of pending) { appliedAtHistoryIdxRef.current.set(s.id, historyIdx) }

    setData(prev => {
      let next = { ...prev }
      // Process removes first (descending index to avoid shift)
      const removes = pending.filter(s => s.action === 'remove' && s.entryIndex !== undefined)
        .sort((a, b) => (b.entryIndex ?? 0) - (a.entryIndex ?? 0))
      for (const s of removes) {
        const sec = s.section as SectionKey
        const arr = [...(next[sec] as Entry[])]
        arr.splice(s.entryIndex!, 1)
        next = { ...next, [sec]: arr }
      }
      for (const s of pending) {
        const sec = s.section as SectionKey
        if (s.action === 'remove') continue
        if ((s.action === 'add' || s.action === 'fill') && s.newEntry && (s.section === 'exp' || s.section === 'project')) {
          const entry: Entry = {
            id: `${Date.now()}-${s.id}`,
            title: s.newEntry.title,
            sub: s.newEntry.sub,
            date: s.newEntry.date,
            bullets: s.newEntry.bullets.map(stripDot),
          }
          next = { ...next, [sec]: [...(next[sec] as Entry[]), entry], ...(sec === 'project' ? { hasProject: true } : {}) }
        } else if (s.section === 'summary' && s.field === 'summary') {
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
            const arr = [...(next[sec] as Entry[])]
            if (arr[s.entryIndex]) { arr[s.entryIndex] = { ...arr[s.entryIndex], bullets }; next = { ...next, [sec]: arr } }
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
  }, [historyIdx, aiAnalysis, appliedSuggestions, setData])

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
    if (auth.loggedIn) deleteCloudResume(id)
  }, [currentHistoryId, auth.loggedIn])

  // Loading a history entry clears the empty state, closes right panel, and resets AI panel
  const handleLoadHistoryWithClear = useCallback((entry: HistoryEntry) => {
    setNoResumeOpen(false)
    loadedFromHistoryId.current = entry.id
    setCurrentHistoryId(entry.id)
    setHistory([entry.data])
    setHistoryIdx(0)
    setTemplateId(entry.templateId)
    setColor(entry.color)
    setAccentStyleOverride(entry.accentStyleOverride)
    setFontPairOverride(entry.fontPairOverride)
    setDocTitle(entry.name)
    setSelection({ kind: 'none' })
    // Close AI panel and discard analysis — it belongs to the previous resume
    setAiPanelOpen(false)
    setAiPanelPhase('entry')
    setAiAnalysis(null); setInterviewData(null); setInterviewLoading(false)
    setAppliedSuggestions(new Set())
    appliedAtHistoryIdxRef.current.clear()
    aiAnalyzedDataSnapshot.current = null
    setIsCurrentEnglish(entry.isEnglish === true || looksEnglish(entry.data))
    showToast(`已加载「${entry.name}」`)
  }, [])

  const handleDuplicateHistory = useCallback((entry: HistoryEntry) => {
    const currentHistory = loadHistory()
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (currentHistory.length >= resumeLimit) {
      showToast(`简历数量已达上限（${resumeLimit} 份），请先删除旧简历`)
      return
    }
    const copyName = uniqueHistoryName(entry.name + ' 副本', currentHistory)
    let newId: string
    try {
      newId = saveToHistory({ name: copyName, data: entry.data, templateId: entry.templateId, color: entry.color, savedAt: Date.now(), isEnglish: entry.isEnglish })
    } catch {
      showToast('⚠️ 复制失败：本地存储空间不足，请移除照片或清理历史记录')
      return
    }
    if (auth.loggedIn && newId) {
      const saved = loadHistory().find(h => h.id === newId)
      if (saved) upsertCloudResume(saved)
    }
    setHistoryRefreshKey(k => k + 1)
    showToast(`已复制「${copyName}」`)
  }, [auth.loggedIn])

  // ============ Create new resume / Import resume ============
  const [showNewResumeWizard, setShowNewResumeWizard] = useState(false)

  const handleCreateNewResume = useCallback(() => {
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (loadHistory().length >= resumeLimit) {
      showToast(`简历数量已达上限（${resumeLimit} 份），请先删除旧简历`)
      return
    }
    setShowNewResumeWizard(true)
  }, [])

  const handleWizardConfirm = useCallback((starterData: ResumeData) => {
    setShowNewResumeWizard(false)
    // flushSync resets forceTab to undefined first so the useEffect in LeftPanel
    // always fires even if the previous value was already 'tpl'
    flushSync(() => setLeftPanelTab(null))
    setLeftPanelTab('tpl')
    if (!noResumeOpen) {
      const hid = loadedFromHistoryId.current
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
        if (auth.loggedIn) {
          const prev = loadHistory().find(h => h.id === hid)
          if (prev) upsertCloudResume(prev)
        }
      } else {
        saveToHistory({ name: docTitle || '我的简历', data, templateId, color, savedAt: Date.now() })
      }
    }
    const newHistorySnap = loadHistory()
    const newName = uniqueHistoryName('我的简历', newHistorySnap)
    const newId = saveToHistory({ name: newName, data: starterData, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    if (auth.loggedIn && newId) {
      const entry = loadHistory().find(h => h.id === newId)
      if (entry) upsertCloudResume(entry)
    }
    setHistory([starterData])
    setHistoryIdx(0)
    setTemplateId('banner-warm')
    setAccentStyleOverride(undefined)
    setFontPairOverride(undefined)
    setColor(undefined)
    setDocTitle(newName)
    setSelection({ kind: 'none' })
    setNoResumeOpen(false)
    setHistoryRefreshKey(k => k + 1)
    setLeftPanelTab('tpl')
    showToast('✓ 新简历已创建')
  }, [data, templateId, color, docTitle, noResumeOpen, auth.loggedIn])

  const handleImportAttempt = useCallback(() => {
    if (loggedInRef.current) {
      const isSub = proStatusRef.current.kind === 'subscription'
      const limit = isSub ? 10 : 2
      if (authDailyImportUsedRef.current >= limit) {
        showToast(`今日导入次数已用完（${limit} 次/天），明日 00:00 自动重置`)
        if (!isSub) { setPaywallTrigger('import_limit'); setPaywallOpen(true) }
        return
      }
    } else {
      pendingLoginActionRef.current = 'import'
      setShowEditorLogin(true)
      return
    }
    importFileRef.current?.click()
  }, [deviceId, proStatus])

  const [translateLoading, setTranslateLoading] = useState(false)
  const [isCurrentEnglish, setIsCurrentEnglish] = useState(false)
  const [compressPhase, setCompressPhase] = useState<'idle' | 'loading'>('idle')
  const [compressWarningDismissed, setCompressWarningDismissed] = useState(false)
  const [postScaleCheck, setPostScaleCheck] = useState(0)

  // ============ One-page compress ============
  const PAGE_H = 1123
  const overflowPx = pageCount > 1 ? Math.max(0, canvasTotalHeightRef.current - PAGE_H) : 0
  const overflowLines = Math.ceil(overflowPx / 20)

  // Auto-show banner again when content starts overflowing again after being fixed
  useEffect(() => { if (pageCount <= 1) setCompressWarningDismissed(false) }, [pageCount])

  // Post-render correction: after font scale is applied and layout reflows,
  // re-measure and tighten if still overflowing (text reflow is non-linear).
  // Uses replaceCurrentData so the correction shares one undo step with the initial compress.
  // Iterates up to 2 extra times to handle layouts with unscaled fixed elements (e.g. photos
  // in bottom-strip) where a single pass leaves residual overflow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!postScaleCheck) return
    const id = setTimeout(() => {
      const totalH = canvasTotalHeightRef.current
      if (totalH > PAGE_H) {
        const cs = data.fontScale ?? 1
        const adj = parseFloat((cs * (PAGE_H - 5) / totalH).toFixed(4))
        if (adj < cs && postScaleIterRef.current < 2) {
          postScaleIterRef.current += 1
          replaceCurrentData({ fontScale: adj })
          setPostScaleCheck(n => n + 1)
          return
        }
      }
      showToast('✓ 已压缩至 1 页（可撤销）')
    }, 350)
    return () => clearTimeout(id)
  }, [postScaleCheck])

  const handleCompress = useCallback(() => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'compress'
      setShowEditorLogin(true)
      return
    }
    const freshStatus = proStatusRef.current
    if (freshStatus.kind !== 'subscription') {
      pendingPaywallActionRef.current = { type: 'compress' }
      setPaywallTrigger('compress')
      setPaywallOpen(true)
      return
    }
    if (compressPhase !== 'idle') return

    const totalH = canvasTotalHeightRef.current
    const pct = totalH > 0 ? (totalH - PAGE_H) / PAGE_H * 100 : 0
    const currentScale = data.fontScale ?? 1

    if (pct <= 35) {
      const scale = parseFloat((currentScale * (PAGE_H - 5) / totalH).toFixed(4))
      postScaleIterRef.current = 0
      updateData({ fontScale: scale })
      setPostScaleCheck(n => n + 1)
    } else {
      showToast('内容超出较多，建议删减部分经历条目或缩短描述后再压缩')
    }
  }, [data.fontScale, updateData, compressPhase, auth.loggedIn])


  const handleTranslate = useCallback(async () => {
    if (!auth.loggedIn) {
      pendingLoginActionRef.current = 'translate'
      setShowEditorLogin(true)
      return
    }
    // proStatusRef always reflects the latest proStatus (server-confirmed for subscribers,
    // localStorage-based for local purchases) without stale-closure issues.
    const freshStatus = proStatusRef.current
    if (freshStatus.kind === 'subscription' && authDailyTranslateUsedRef.current >= 5) {
      showToast(`今日生成英文简历次数已用完（5/5 次）`)
      return
    }
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
      if (res.status === 429) {
        showToast(`今日生成英文简历次数已用完`)
        return
      }
      if (!res.ok) { showToast('翻译失败，请稍后重试'); return }
      const json = await res.json()
      if (!json.data) { showToast('翻译失败，请稍后重试'); return }

      const hid = loadedFromHistoryId.current
      if (hid && hid !== 'draft') {
        updateHistoryEntry(hid, { data, templateId, color, name: docTitle, savedAt: Date.now() })
      }

      const currentHistory = loadHistory()
      const rawName = `${docTitle}_en`
      const engName = uniqueHistoryName(rawName, currentHistory)
      const newId = saveToHistory({ name: engName, data: { ...json.data, photo: data.photo, photoMeta: data.photoMeta }, templateId, color, savedAt: Date.now(), isEnglish: true })
      loadedFromHistoryId.current = newId || null
      setCurrentHistoryId(newId || null)
      setHistory([{ ...json.data, photo: data.photo, photoMeta: data.photoMeta }])
      setHistoryIdx(0)
      setDocTitle(engName)
      setSelection({ kind: 'none' })
      setNoResumeOpen(false)
      setHistoryRefreshKey(k => k + 1)
      setIsCurrentEnglish(true)
      recordUsage(deviceId, 'ai_translate', freshStatus)
      void authRefreshRef.current()
      setProStatus(getProStatus(deviceId, newId || undefined))
      const remaining = Math.max(0, 5 - (authDailyTranslateUsedRef.current + 1))
      showToast(`✓ 英文版已生成（今日剩余 ${remaining} 次）`)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      showToast('翻译失败，请稍后重试')
    } finally {
      if (translateAbortRef.current === controller) translateAbortRef.current = null
      setTranslateLoading(false)
    }
  }, [data, deviceId, currentHistoryId, templateId, color, docTitle, auth.loggedIn])

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importingFileObjRef.current = file
    setImportingFile(file.name.replace(/\.[^.]+$/, ''))
    setImportModalState('ready')
    e.target.value = ''
  }

  const handleImportCancel = useCallback(() => {
    importCancelledRef.current = true
    importAbortRef.current?.abort()
    importAbortRef.current = null
    if (loadedFromHistoryId.current === 'pending') loadedFromHistoryId.current = null
    setImportModalState('none')
    setImportingFile('')
  }, [])

  const handleImportStart = async () => {
    const name = importingFile
    importCancelledRef.current = false
    const controller = new AbortController()
    importAbortRef.current = controller
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

    let importedData: ResumeData | null = null
    const fileObj = importingFileObjRef.current
    if (fileObj) {
      try {
        const formData = new FormData()
        formData.append('file', fileObj)
        formData.append('deviceId', deviceId)
        const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData, signal: controller.signal })
        if (res.status === 429) {
          const errJson = await res.json().catch(() => ({}))
          showToast(errJson?.error || '今日导入次数已用完，登录后次数重置')
          setImportModalState('none')
          return
        }
        if (res.ok) {
          const json = await res.json()
          importedData = parsedToResumeData(json.data ?? {})
        } else {
          showToast('导入失败，请重试')
          setImportModalState('none')
          return
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return  // cancelled
        console.error('import parse error:', e)
        showToast('导入失败，请重试')
        setImportModalState('none')
        return
      }
    }
    if (!importedData) {
      setImportModalState('none')
      return
    }
    if (importCancelledRef.current) return

    const currentHistory = loadHistory()
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (currentHistory.length >= resumeLimit) {
      showToast(`简历数量已达上限（${resumeLimit} 份），请先删除旧简历`)
      setImportModalState('none')
      return
    }
    const uniqueName = uniqueHistoryName(name, currentHistory)
    const newId = saveToHistory({ name: uniqueName, data: importedData, templateId: 'banner-warm', color: undefined, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    setHistory([importedData])
    setHistoryIdx(0)
    setTemplateId('banner-warm')
    setColor(undefined)
    setDocTitle(uniqueName)
    setIsCurrentEnglish(looksEnglish(importedData))
    setLeftPanelTab('tpl')
    if (loggedInRef.current) {
      void authRefreshRef.current()
    } else {
      recordUsage(deviceId, 'import', proStatus)
      setProStatus(getProStatus(deviceId, currentHistoryId || undefined))
    }
    importingFileObjRef.current = null
    setAiAnalysis(null)
    setAiPanelPhase('entry')
    setAiPanelOpen(false)
    setPendingSkills([])
    setBulletDiffs({})
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
          isMobile={isMobile}
          onNewResume={handleCreateNewResume}
          onImportFile={handleImportAttempt}
          onTranslate={handleTranslate}
          translateLoading={translateLoading}
          disabled={noResumeOpen}
          userInfo={{
            loading: auth.loading,
            loggedIn: auth.loggedIn,
            avatar: auth.avatar,
            openid: auth.openid,
            nickname: auth.nickname,
            membership: auth.membership,
            isStudent: auth.isStudent,
            freeAnalyzeUsed: auth.freeAnalyzeUsed,
            dailyAnalyzeUsed: auth.dailyAnalyzeUsed,
            dailyTranslateUsed: auth.dailyTranslateUsed,
            dailyImportUsed: auth.dailyImportUsed,
            onShowLogin: () => setShowEditorLogin(true),
            onLogout: handleEditorLogout,
            onUpgrade: () => { setPaywallTrigger('upgrade'); setPaywallOpen(true) },
            onRefreshAuth: auth.refresh,
          }}
        />
      </div>

      {/* Watermark banner — shown for free users */}
      {showWatermark && !watermarkBannerDismissed && !noResumeOpen && !auth.loading && (
        <div className="no-print" style={{
          background: 'linear-gradient(90deg, #0f172a, #1e3a5f)',
          padding: '7px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.82)' }}>
            当前下载将含水印 · 升级 Pro 即可无水印导出
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={handleUnlockPro} style={{
              padding: '5px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, #ef4444, #ff6b35)', color: 'white', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>升级 Pro</button>
            <button onClick={() => setWatermarkBannerDismissed(true)} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px 4px',
              fontFamily: 'var(--font-sans)',
            }}>✕</button>
          </div>
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
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <LeftPanel
            templateId={templateId}
            onTemplateChange={(id) => { setTemplateId(id); setAccentStyleOverride(undefined); setFontPairOverride(undefined); if (data.fontScale) updateData({ fontScale: undefined }); showToast('模板已切换'); if (isMobile) setLeftOpen(false) }}
            currentColor={effectiveColor}
            onColorChange={(c) => { setColor(c); showToast('颜色已应用') }}
            currentAccentStyle={effectiveTemplate.accentStyle}
            onAccentStyleChange={(s) => { setAccentStyleOverride(s); showToast('标题样式已更新') }}
            currentFontPair={effectiveTemplate.fontPair}
            onFontPairChange={(f) => { setFontPairOverride(f); showToast('字体已更新') }}
            onAddModule={handleAddModule}
            data={data}
            onUpdate={updateData}
            onLoadHistory={handleLoadHistoryWithClear}
            onDuplicateHistory={handleDuplicateHistory}
            onHistoryDelete={handleHistoryDelete}
            historyRefreshKey={historyRefreshKey}
            currentHistoryId={currentHistoryId}
            currentDocTitle={docTitle}
            isMobile={isMobile}
            onClose={() => setLeftOpen(false)}
            forceTab={leftPanelTab ?? undefined}
            disabled={noResumeOpen}
            loggedIn={auth.loggedIn}
            onShowLogin={() => setShowEditorLogin(true)}
          />
        </div>

        <div className="editor-canvas-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
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
                width: '28px', height: '28px', borderRadius: '10px', border: '1px solid #e2e8f0',
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
                    width: '28px', height: '28px', borderRadius: '10px', border: '1px solid #e2e8f0',
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
                padding: '2px 8px', borderRadius: '10px', fontWeight: 500,
              }}>含水印</span>
            )}
            {/* Compact compress button — visible when overflow banner was dismissed */}
            {compressWarningDismissed && pageCount > 1 && compressPhase === 'idle' && !noResumeOpen && (
              <button
                onClick={handleCompress}
                style={{
                  padding: '3px 10px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  color: 'white', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  boxShadow: '0 0 6px rgba(249,115,22,0.35)',
                  transition: 'box-shadow 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 10px rgba(249,115,22,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 6px rgba(249,115,22,0.35)' }}
              >压缩至1页</button>
            )}
            {/* Translate shortcut — shown for all users to prompt upgrade; hidden when already English */}
            {!noResumeOpen && !isCurrentEnglish && (
              <button
                onClick={handleTranslate}
                disabled={translateLoading}
                style={{
                  padding: '3px 10px', borderRadius: '8px',
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
                  padding: '4px 10px', borderRadius: '10px', fontSize: '13px',
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
                padding: '4px 10px', borderRadius: '10px', fontSize: '11px',
                cursor: 'pointer', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontFamily: 'var(--font-sans)',
              }}>重置</button>
            </div>
          </div>


          {/* Overflow warning banner — animates out when compress starts */}
          {(() => {
            const shown = pageCount > 1 && !noResumeOpen && !compressWarningDismissed && compressPhase === 'idle'
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
                          padding: '4px 10px', borderRadius: '10px', border: '1px solid #fed7aa',
                          background: 'transparent', color: '#92400e', fontSize: '11.5px',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >重置字号</button>
                    )}
                    <button
                      onClick={handleCompress}
                      style={{
                        padding: '5px 14px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #f97316, #ef4444)',
                        color: 'white', fontSize: '12.5px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                        boxShadow: '0 0 8px rgba(249,115,22,0.4)',
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(249,115,22,0.6)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 8px rgba(249,115,22,0.4)' }}
                    >
                    压缩至 1 页
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

          {/* Guest mode banner — shown when not logged in */}
          {!auth.loading && !auth.loggedIn && (
            <div className="no-print" style={{
              background: '#fffbeb', borderBottom: '1px solid #fde68a',
              padding: '8px 16px', display: 'flex', alignItems: 'center',
              gap: '10px', flexShrink: 0,
            }}>
              <span style={{ fontSize: '12.5px', color: '#92400e', flex: 1, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>游客模式</span>
                {' · '}退出编辑器后简历将自动清除，永久保存请登录账号
              </span>
              <button
                onClick={() => setShowEditorLogin(true)}
                style={{
                  padding: '5px 14px', borderRadius: '10px', border: 'none',
                  background: 'var(--highlight)', color: 'white',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                }}
              >立即登录</button>
            </div>
          )}


          {/* Empty state — shown when the active resume was deleted */}
          {noResumeOpen && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '14px', backgroundColor: '#e2e8f0', backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <img src="/logo-black.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', opacity: 0.35 }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>从左侧-我的-加载简历</div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>或者在此新建、导入一份简历</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={handleCreateNewResume} style={{
                  padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid transparent', background: '#0f172a', color: 'white',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>创建新简历</button>
                <button onClick={handleImportAttempt} style={{
                  padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid white', background: 'white', color: '#334155',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>导入简历</button>
              </div>
            </div>
          )}

          {/* Canvas — hidden when showing empty state */}
          <div
            ref={canvasRef}
            className="print-canvas"
            style={{
              flex: 1, overflow: 'auto', display: noResumeOpen ? 'none' : 'flex',
              justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px',
              backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            onClick={() => {
              setSelection({ kind: 'none' })
              if (aiPanelOpen && aiPanelPhase === 'entry') setAiPanelOpen(false)
            }}
          >
            <div ref={scaleWrapperRef} className="print-scale-wrapper" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', willChange: 'transform' }}>
              <div className="resume-print-area">
                <PaginatedResume
                  data={data}
                  template={effectiveTemplate}
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
                  bulletDiffs={bulletDiffs}
                  pendingSkills={pendingSkills}
                  isEnglish={isCurrentEnglish}
                />
              </div>
            </div>
          </div>

          {/* Canvas loading overlay — hides DEMO_DATA flash while cloud sync is in-flight */}
          <div
            className="no-print"
            style={{
              position: 'absolute', inset: 0,
              background: '#e2e8f0',
              zIndex: 20,
              opacity: canvasReady ? 0 : 1,
              pointerEvents: canvasReady ? 'none' : 'all',
              transition: 'opacity 0.35s ease',
            }}
          />

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
                  phase={aiPanelPhase}
                  analysis={aiAnalysis}
                  appliedSuggestionIds={appliedSuggestions}
                  jobDesc={jobDescPersist}
                  onJobDescChange={setJobDescPersist}
                  onAnalyzeCurrent={handleAIAnalyzeCurrent}
                  currentSkills={data.skills}
                  currentSummary={data.summary}
                  onApplySuggestion={handleApplySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onClose={handleAIClose}
                  onSkillChecksChange={setPendingSkills}
                  interviewData={interviewData}
                  interviewLoading={interviewLoading}
                  onGenerateInterview={handleGenerateInterview}
                  analyzeExhausted={
                    proStatus.kind === 'free'
                      ? auth.freeAnalyzeUsed >= FREE_ANALYZE_LIMIT
                      : proStatus.kind === 'single' ? proStatus.aiAnalyzeLeft <= 0
                      : auth.dailyAnalyzeUsed >= 20
                  }
                  analyzeExhaustedKind={proStatus.kind === 'subscription' ? 'daily_reset' : 'upgrade'}
                  analyzeLoggedIn={auth.loggedIn}
                  onAnalyzeExhaustedCTA={auth.loggedIn
                    ? () => { setPaywallTrigger('ai_analyze'); setPaywallOpen(true) }
                    : () => setShowEditorLogin(true)}
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
                phase={aiPanelPhase}
                analysis={aiAnalysis}
                appliedSuggestionIds={appliedSuggestions}
                jobDesc={jobDescPersist}
                onJobDescChange={setJobDescPersist}
                onAnalyzeCurrent={handleAIAnalyzeCurrent}
                currentSkills={data.skills}
                currentSummary={data.summary}
                onApplySuggestion={handleApplySuggestion}
                onApplyAll={handleApplyAllSuggestions}
                onClose={handleAIClose}
                onSkillChecksChange={setPendingSkills}
                interviewData={interviewData}
                interviewLoading={interviewLoading}
                onGenerateInterview={handleGenerateInterview}
                analyzeExhausted={
                  proStatus.kind === 'free'
                    ? auth.freeAnalyzeUsed >= FREE_ANALYZE_LIMIT
                    : proStatus.kind === 'single' ? proStatus.aiAnalyzeLeft <= 0
                    : auth.dailyAnalyzeUsed >= 20
                }
                analyzeExhaustedKind={proStatus.kind === 'subscription' ? 'daily_reset' : 'upgrade'}
                analyzeLoggedIn={auth.loggedIn}
                onAnalyzeExhaustedCTA={auth.loggedIn
                  ? () => { setPaywallTrigger('ai_analyze'); setPaywallOpen(true) }
                  : () => setShowEditorLogin(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* ContinueModal removed — editor loads most recent resume directly */}

      {modal === 'download' && (
        <DownloadModal
          onClose={() => setModal('none')}
          onPrintPDF={handlePrintPDF}
          onDownloadPNG={handleDownloadPNG}
          isPaid={proStatus.kind !== 'free'}
          onUnlockPro={() => { setModal('none'); setPaywallTrigger('download_free'); setPaywallOpen(true) }}
        />
      )}
      {importModalState !== 'none' && (
        <ImportModal
          filename={importingFile}
          loading={importModalState === 'loading'}
          onStart={handleImportStart}
          onClose={() => setImportModalState('none')}
          onCancel={handleImportCancel}
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
            auth.refresh()
          }}
        />
      )}

      {showNewResumeWizard && (
        <NewResumeWizardModal
          onConfirm={handleWizardConfirm}
          onClose={() => setShowNewResumeWizard(false)}
        />
      )}

      {photoCropOpen && (
        <PhotoCropModal
          src={photoCropSrc ?? data.photo ?? ''}
          loading={photoConverting}
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

      {showEditorLogin && (
        <WechatLoginModal
          onClose={() => setShowEditorLogin(false)}
          onSuccess={() => {
            setShowEditorLogin(false)
            auth.refresh()
          }}
        />
      )}

      {auth.kickedOut && <KickedOutModal />}
      <PaymentSuccessToast />

      {/* Translation loading overlay */}
      {translateLoading && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '36px 40px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(15,23,42,0.22)',
            minWidth: '280px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '28px' }}>
              AI 正在生成英文简历
            </div>
            <ImportLoadingBar stages={TRANSLATE_STAGES} />
            <button
              onClick={() => translateAbortRef.current?.abort()}
              style={{
                marginTop: '24px', padding: '7px 24px',
                borderRadius: '12px', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >取消</button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="no-print" style={{
        position: 'fixed', bottom: '24px', left: '50%',
        transform: `translateX(-50%) translateY(${toast ? '0' : '60px'})`,
        opacity: toast ? 1 : 0,
        background: 'var(--teal)', color: '#fff',
        padding: '11px 22px', borderRadius: '14px',
        fontSize: '13px', fontWeight: 500, zIndex: 300,
        transition: 'transform 0.3s, opacity 0.3s', pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.25)',
      }}>{toastLabel}</div>

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
        template={effectiveTemplate}
        color={effectiveColor}
        showWatermark={showWatermark}
        isEnglish={isCurrentEnglish}
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
