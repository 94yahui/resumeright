'use client'
import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { Menu, Undo2, Redo2 } from 'lucide-react'
import EditorTopbar from './components/EditorTopbar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { DownloadModal, AIPanel, ImportModal, PhotoCropModal, PaywallModal, StudentModal, CoverLetterModal } from './components/Modals'
import type { PaywallTrigger } from './components/Modals'
import PaginatedResume from '../lib/PaginatedResume'
import ResumeRenderer from '../lib/ResumeRenderer'
import { ResumeData, SelectionType, SectionKey, Entry, AISuggestion, SkillCategory, DEMO_DATA, THUMB_DATA, sampleResumeData, parsedToResumeData, hasDiffMarkup, applyDiffBullet } from '../lib/types'
import { takePendingImport } from '../lib/pendingImport'
import { getTemplate, isSingleColumn, AccentStyle, FontPair, VALID_ACCENT_STYLES } from '../lib/templates-config'
import {
  loadDraft, saveDraft, clearDraft,
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
  hasNoWatermark, recordUsage, cleanOldUsage, getDailyCount,
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

// Merge AI-suggested skills into the resume, respecting category mode.
// In category mode the new skills are appended to an "其他 / Additional" category
// (created if absent) so they actually render — the flat `skills` array is ignored
// by the renderer when skillCategories is present. Dedup is case-insensitive.
function addSkillsToResume(prev: ResumeData, rawSkills: string[]): ResumeData {
  const incoming = rawSkills.map(s => s.trim()).filter(Boolean)
  if (incoming.length === 0) return prev
  const cats = prev.skillCategories
  if (cats && cats.length > 0) {
    const existing = new Set(cats.flatMap(c => c.items.map(i => i.toLowerCase().trim())))
    const toAdd: string[] = []
    for (const sk of incoming) {
      const k = sk.toLowerCase().trim()
      if (existing.has(k)) continue
      existing.add(k)
      toAdd.push(sk)
    }
    if (toAdd.length === 0) return { ...prev, hasSkills: true }
    const isEn = prev.resumeLang === 'en'
    const matchNames = isEn
      ? /^(additional|other|others|new skills?|misc)/i
      : /(其他|其它|补充|新增)/
    const idx = cats.findIndex(c => matchNames.test(c.name.trim()))
    const nextCats: SkillCategory[] = idx >= 0
      ? cats.map((c, i) => i === idx ? { ...c, items: [...c.items, ...toAdd] } : c)
      : [...cats, { id: `${Date.now()}-aiskills`, name: isEn ? 'Additional' : '其他', items: toAdd }]
    return { ...prev, skillCategories: nextCats, hasSkills: true }
  }
  const existing = new Set(prev.skills.map(s => s.toLowerCase().trim()))
  const toAdd = incoming.filter(sk => !existing.has(sk.toLowerCase().trim()))
  if (toAdd.length === 0) return { ...prev, hasSkills: true }
  return { ...prev, skills: [...prev.skills, ...toAdd], hasSkills: true }
}

const CJK = /[一-鿿　-〿＀-￯]/
function looksEnglish(d: ResumeData): boolean {
  // Scan the main content fields (not the name — it can be CJK on an otherwise-English resume).
  // English resume → some text, no CJK → true. Chinese resume → CJK present → false.
  const texts = [
    d.jobtitle, d.summary,
    ...(d.exp ?? []).flatMap(e => [e.title, e.sub, ...(e.bullets ?? [])]),
    ...(d.project ?? []).flatMap(e => [e.title, e.sub, ...(e.bullets ?? [])]),
    ...(d.skills ?? []),
  ].filter(Boolean) as string[]
  return texts.length > 0 && !texts.some(t => CJK.test(t))
}


// Deferred guest-clear timer — cancelled if the editor remounts before it fires (React StrictMode).
let _guestClearTimer: ReturnType<typeof setTimeout> | null = null

// Strings that are never real user content — added as defaults when a new entry is created.
// Filtered from the PDF print layer so users don't accidentally export placeholder text.
const PLACEHOLDER_BULLETS = new Set(['Describe your responsibilities and achievements...', 'Project details...'])
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
  return sampleResumeData({ single: isSingleColumn(getTemplate(tplId).layout) })
}

function isBlankData(d: ResumeData): boolean {
  return d.name === DEMO_DATA.name && d.email === DEMO_DATA.email
}

function EditorInner() {
  const searchParams = useSearchParams()
  const initTemplate = searchParams.get('template') || 'classic-pro'
  const auth = useAuth()

  // ============ Undo/Redo history stack ============
  const [history, setHistory] = useState<ResumeData[]>([getInitData(initTemplate)])
  const [historyIdx, setHistoryIdx] = useState(0)
  const data = history[historyIdx]

  // Skills the AI panel should treat as "already in the resume" — includes both the
  // flat skills array AND every category's items, so skills applied in category mode
  // (which only land in skillCategories) are recognized and not re-offered as "new".
  const currentSkillsForAI = useMemo(
    () => [...data.skills, ...(data.skillCategories?.flatMap(c => c.items) ?? [])],
    [data.skills, data.skillCategories],
  )

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
  const [docTitle, setDocTitle] = useState('My Resume')
  // Login removed — keep a no-op setter so legacy call sites compile harmlessly.
  const setShowEditorLogin = (_v?: boolean) => {}
  const [modal, setModal] = useState<'none' | 'download'>('none')
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPanelPhase, setAiPanelPhase] = useState<'entry' | 'analyzing' | 'result' | 'applying'>('entry')
  const [aiAnalysis, setAiAnalysis] = useState<{ hasOfferRate?: boolean; offerRate?: number; overview: string; suggestions: AISuggestion[]; missingSkills?: string[]; jobInfo?: { title: string | null; company: string | null; location: string | null; type: string | null } | null; matchBreakdown?: { experience: number; skills: number; other: number } | null } | null>(null)
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
  const pendingPaywallActionRef = useRef<{ type: 'download' } | { type: 'ai_analyze' } | { type: 'compress' } | null>(null)
  const appliedAtHistoryIdxRef = useRef<Map<string, number>>(new Map())
  const pendingLoginActionRef = useRef<'download' | 'save' | 'compress' | 'unlock_pro' | 'import' | 'ai_analyze' | null>(null)
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
  const preCompressScaleRef = useRef(1)
  // Previous measurement data point used for linear-interpolation correction
  const prevMeasuredScaleRef = useRef(1)
  const prevMeasuredHeightRef = useRef(0)
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
          const planLabel = m.plan as 'day3' | 'weekly' | 'monthly' | 'quarterly'
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

  // For guests with no history: create the initial entry after auth resolves so "Mine" shows it.
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
    const newId = saveToHistory({ name: dt || 'My Resume', data: d, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo, savedAt: Date.now() })
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

    // Quick import: user clicked "Import" on landing page — parse is in-flight in a module-level promise
    const pendingImport = takePendingImport()
    if (pendingImport) {
      // Mark as in-flight so the guest-entry-creation effect doesn't race and create a blank entry
      loadedFromHistoryId.current = 'pending'
      importCancelledRef.current = false
      setImportModalState('loading')
      setImportingFile('Importing resume...')
      pendingImport
        .then(({ data: importedRaw, filename }) => {
          if (importCancelledRef.current) return
          const parsed = parsedToResumeData(importedRaw)
          const currentHistory = loadHistory()
          const mountLimit = getProStatus(getDeviceId(), undefined).kind === 'free' ? 20 : 100
          if (currentHistory.length >= mountLimit) {
            showToast(`Resume limit reached (${mountLimit}). Please delete an old resume first.`)
            setImportModalState('none')
            setImportingFile('')
            return
          }
          const uniqueName = uniqueHistoryName(filename || 'Uploaded resume', currentHistory)
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
          setImportModalState('none')
          setImportingFile('')
          setLeftPanelTab('tpl')
        })
        .catch((e: Error) => {
          if (importCancelledRef.current) return
          setImportModalState('none')
          setImportingFile('')
          showToast(e?.message === 'empty' ? 'No resume content detected, please upload a valid resume file' : 'Import failed, please re-upload in the editor')
        })
      return
    }

    // Landing-page import: user uploaded/analyzed a resume on the homepage → stored in sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem('resumecraft_landing_import')
      if (raw) {
        sessionStorage.removeItem('resumecraft_landing_import')
        try {
          const { data: importedRaw, filename, analysis } = JSON.parse(raw)
          const parsed = parsedToResumeData(importedRaw ?? {})
          const currentHistory = loadHistory()
          const mountLimit = getProStatus(getDeviceId(), undefined).kind === 'free' ? 20 : 100
          if (currentHistory.length >= mountLimit) {
            showToast(`Resume limit reached (${mountLimit}). Please delete an old resume first.`)
            return
          }
          const uniqueName = uniqueHistoryName(filename || 'Uploaded resume', currentHistory)
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
          setLeftPanelTab('tpl')

          if (analysis) {
            setAiAnalysis(analysis)
            setAiPanelOpen(true)
            setAiPanelPhase('result')
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
          const atsEnglish = looksEnglish(resumeData)
          const currentHistory = loadHistory()
          const newName = uniqueHistoryName(filename || raw.name || 'My Resume', currentHistory)
          const newId = saveToHistory({ name: newName, data: resumeData, templateId: 'classic-pro', color: undefined, isEnglish: atsEnglish, savedAt: Date.now() })
          if (newId) {
            loadedFromHistoryId.current = newId
            setCurrentHistoryId(newId)
            try { sessionStorage.setItem('rc_from_ats', newId) } catch {}
          }
          setHistory([resumeData])
          setHistoryIdx(0)
          setTemplateId('classic-pro')
          setIsCurrentEnglish(atsEnglish)
          setDocTitle(newName)
          setNoResumeOpen(false)
          setLeftPanelTab('tpl')
          setAiPanelOpen(true)
          setAiPanelPhase('entry')
          return
        }
      } catch {}
    }

    // Template card (?template=xxx): start fresh with chosen template.
    // Optional ?accent / ?color carry the heading-style and color picked on the landing page.
    if (searchParams.get('template')) {
      const accentParam = searchParams.get('accent')
      const colorParam = searchParams.get('color')
      const accentOverride = accentParam && (VALID_ACCENT_STYLES as readonly string[]).includes(accentParam)
        ? accentParam as AccentStyle : undefined
      const colorOverride = colorParam && /^#[0-9a-fA-F]{6}$/.test(colorParam) ? colorParam : undefined
      const initData = getInitData(initTemplate)
      const initEnglish = looksEnglish(initData)
      const currentHistory = loadHistory()
      const initName = uniqueHistoryName('My Resume', currentHistory)
      const newId = saveToHistory({ name: initName, data: initData, templateId: initTemplate, color: colorOverride, accentStyleOverride: accentOverride, isEnglish: initEnglish, savedAt: Date.now() })
      if (newId) {
        loadedFromHistoryId.current = newId
        setCurrentHistoryId(newId)
        // Mark as intentional so cloud sync won't treat it as an unedited blank and delete it
        try { sessionStorage.setItem('rc_from_template', newId) } catch {}
      }
      if (colorOverride) setColor(colorOverride)
      if (accentOverride) setAccentStyleOverride(accentOverride)
      setIsCurrentEnglish(initEnglish)
      setDocTitle(initName)
      // Strip query params so a page refresh doesn't create another entry
      window.history.replaceState({}, '', '/editor')
      return
    }

    // Logged-in users: skip localStorage — resumes must come from the DB.
    // Cloud sync (which runs after auth resolves) is the authoritative source.
    // hasSessionHint() reads the localStorage auth cache as a proxy for login state
    // since rc_token is httpOnly and unreadable from JS.
    if (hasSessionHint()) {
      setDocTitle('My Resume')
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
    setDocTitle('My Resume')
  }, [])

  // ============ Auto-save draft to localStorage ============
  useEffect(() => {
    if (!initialized.current) return
    const hid = loadedFromHistoryId.current
    const now = Date.now()
    // Persist historyId in the draft so "Continue editing" can restore the correct association
    try {
      saveDraft({ data, templateId, color, accentStyleOverride, fontPairOverride, docTitle, savedAt: now, historyId: hid ?? undefined })
      // Keep the history entry in sync — includes name so renaming the doc updates the list
      if (hid && hid !== 'draft' && hid !== 'pending') {
        updateHistoryEntry(hid, { data, templateId, color, accentStyleOverride, fontPairOverride, name: docTitle, savedAt: now })
      }
    } catch {
      showToast('⚠️ Save failed: not enough local storage. Remove photos or clear history.')
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
      saveToHistory({ name: dt || 'My Resume', data: d, templateId: tid, color: c, accentStyleOverride: aso, fontPairOverride: fpo, savedAt: Date.now() })
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
    showToast('Deleted')
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
      exp:       { id: Date.now()+'-exp', title: 'New Position', sub: 'Company', date: 'Start — End', bullets: ['Describe your responsibilities and achievements...'] },
      edu:       { id: Date.now()+'-edu', title: 'Major', sub: 'School', date: 'Start — End', bullets: [] },
      project:   { id: Date.now()+'-prj', title: 'Project Name', sub: 'Your Role', date: 'Start — End', bullets: ['Project details...'] },
      award:     { id: Date.now()+'-awd', title: 'Award Name', sub: 'Issuer', date: 'Year', bullets: [] },
      cert:      { id: Date.now()+'-crt', title: 'Certificate Name', sub: 'Issuer', date: 'Year', bullets: [] },
      volunteer: { id: Date.now()+'-vol', title: 'Volunteer Activity', sub: 'Organization', date: 'Start — End', bullets: [] },
      interest:  { id: Date.now()+'-itr', title: 'Interest', sub: 'Short description', date: '', bullets: [] },
      language:  { id: Date.now()+'-lng', title: 'English', sub: 'Fluent', date: '', bullets: [] },
    }
    setData(prev => ({
      ...prev,
      ...(flagPatch || {}),
      [sec]: [...(prev[sec] as Entry[]), defaults[sec]],
    }))
    showToast(`✓ Added ${({ exp:'Work Experience', edu:'Education', language:'Languages', award:'Awards', project:'Projects', cert:'Certifications', volunteer:'Volunteering', interest:'Interests' } as Record<string,string>)[sec]}`)
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
    if (key === 'photo-clear') { updateData({ photo: '', photoMeta: undefined }); showToast('Photo removed'); return }

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
      if (!data.summary) summaryPatch.summary = 'Write a short professional summary here — your background, core skills, and career goals in 2–4 sentences, highlighting your biggest strengths.'
      updateData(summaryPatch)
      showToast('✓ Summary added')
      if (isMobileRef.current) { setLeftOpen(false) } else { setSelection({ kind: 'field', field: 'summary' }) }
    } else if (key === 'skills') {
      const patch: Partial<ResumeData> = { hasSkills: true }
      if (data.skills.length === 0) {
        patch.skills = ['Communication', 'Project Management', 'Fast Learner', 'Teamwork', 'Problem Solving']
      }
      updateData(patch)
      showToast('✓ Skills section shown')
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
      showToast(`Resume limit reached (${resumeLimit}). Please delete an old resume first.`)
      return
    }
    const newName = uniqueHistoryName('My Resume', currentHistory)
    const newId = saveToHistory({ name: newName, data: THUMB_DATA, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
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
    setTemplateId('classic-pro')
    setColor(undefined)
    setDocTitle(newName)
    setIsCurrentEnglish(false)
    setLeftPanelTab('tpl')
  }, [auth.loggedIn])

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
      showToast('✓ Saved')
    } catch {
      showToast('⚠️ Save failed: not enough local storage. Remove photos or clear history.')
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
        showToast('Photo conversion failed, please use JPG or PNG')
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
      const title = docTitle || 'My Resume'
      w.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=794, initial-scale=1">
<title>${title}${autoprint ? '' : ' — Preview'}</title>
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
        a.download = `${docTitle || 'My Resume'}.pdf`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
      } catch {
        showToast('PDF generation failed, please try again')
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
    a.download = `${docTitle || 'My Resume'}.doc`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
    showToast('✓ Word file downloaded')
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
        a.download = `${docTitle || 'My Resume'}.png`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
        showToast('✓ Image downloaded')
      } catch {
        showToast('Image generation failed, please try again')
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
      setAiAnalysis(null)
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
          showToast('Daily limit reached, resets at midnight')
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
    setAiAnalysis(null)
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
        showToast(errJson?.error || 'Usage limit reached, please try again later')
        setAiPanelPhase('entry')
        if (loggedInRef.current) void authRefreshRef.current()
      } else if (res.status === 413) {
        showToast('The work details are too long, please shorten and retry (max 6000 chars)')
        setAiPanelPhase('entry')
      } else {
        showToast('Something went wrong, please try again later')
        setAiPanelPhase('entry')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('analyze error:', e)
      showToast('Something went wrong, please try again later')
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
    setAiAnalysis(null)
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
        setData(prev => addSkillsToResume(prev, skills))
      }
      setPendingSkills([])
    }
    setAppliedSuggestions(prev => new Set([...prev, s.id]))
    showToast('✓ AI suggestion applied')
  }, [historyIdx, updateData, updateEntry, setData])

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
        }
        // skills are handled once, below — not per suggestion
      }
      // Skills: gather every suggested skill (from all skills suggestions, applied or
      // not) plus the "Skills needed" gaps, then add in one deduped pass.
      // addSkillsToResume dedups against what's already in the resume, so Apply All
      // never double-adds and also finishes any partial "Add selected skills".
      const suggestedSkills = aiAnalysis.suggestions
        .filter(s => s.section === 'skills' && s.field === 'skills' && Array.isArray(s.optimizedContent))
        .flatMap(s => s.optimizedContent as string[])
        .map(stripDot).filter(Boolean)
      const missing = (aiAnalysis.missingSkills ?? [])
        .map(sk => stripDot(sk.replace(/^\s*需要?\s*/, '')))
        .filter(Boolean)
      const allSkills = [...suggestedSkills, ...missing]
      if (allSkills.length) next = addSkillsToResume(next, allSkills)
      return next
    })
    setAppliedSuggestions(prev => new Set([...prev, ...pending.map(s => s.id)]))
    setBulletDiffs({})
    setPendingSkills([])
    showToast(`✓ Applied ${pending.length} AI suggestions`)
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
    setAiAnalysis(null)
    setAppliedSuggestions(new Set())
    appliedAtHistoryIdxRef.current.clear()
    aiAnalyzedDataSnapshot.current = null
    setIsCurrentEnglish(entry.isEnglish === true || looksEnglish(entry.data))
    showToast(`Loaded "${entry.name}"`)
  }, [])

  const handleDuplicateHistory = useCallback((entry: HistoryEntry) => {
    const currentHistory = loadHistory()
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (currentHistory.length >= resumeLimit) {
      showToast(`Resume limit reached (${resumeLimit}). Please delete an old resume first.`)
      return
    }
    const copyName = uniqueHistoryName(entry.name + ' Copy', currentHistory)
    let newId: string
    try {
      newId = saveToHistory({ name: copyName, data: entry.data, templateId: entry.templateId, color: entry.color, savedAt: Date.now(), isEnglish: entry.isEnglish })
    } catch {
      showToast('⚠️ Duplicate failed: not enough local storage. Remove photos or clear history.')
      return
    }
    if (auth.loggedIn && newId) {
      const saved = loadHistory().find(h => h.id === newId)
      if (saved) upsertCloudResume(saved)
    }
    setHistoryRefreshKey(k => k + 1)
    showToast(`Duplicated "${copyName}"`)
  }, [auth.loggedIn])

  // ============ Create new resume / Import resume ============
  const createResumeFromData = useCallback((starterData: ResumeData) => {
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
        saveToHistory({ name: docTitle || 'My Resume', data, templateId, color, savedAt: Date.now() })
      }
    }
    const newHistorySnap = loadHistory()
    const newName = uniqueHistoryName('My Resume', newHistorySnap)
    const starterIsEnglish = looksEnglish(starterData)
    const newId = saveToHistory({ name: newName, data: starterData, templateId: 'classic-pro', color: undefined, isEnglish: starterIsEnglish, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    if (auth.loggedIn && newId) {
      const entry = loadHistory().find(h => h.id === newId)
      if (entry) upsertCloudResume(entry)
    }
    setHistory([starterData])
    setHistoryIdx(0)
    setTemplateId('classic-pro')
    setAccentStyleOverride(undefined)
    setFontPairOverride(undefined)
    setColor(undefined)
    setIsCurrentEnglish(starterIsEnglish)
    setDocTitle(newName)
    setSelection({ kind: 'none' })
    setNoResumeOpen(false)
    setHistoryRefreshKey(k => k + 1)
    setLeftPanelTab('tpl')
    showToast('✓ New resume created')
  }, [data, templateId, color, docTitle, noResumeOpen, auth.loggedIn])

  const handleCreateNewResume = useCallback(() => {
    const resumeLimit = proStatusRef.current.kind === 'free' ? 20 : 100
    if (loadHistory().length >= resumeLimit) {
      showToast(`Resume limit reached (${resumeLimit}). Please delete an old resume first.`)
      return
    }
    // Skip the student/grad wizard — create a default resume directly.
    createResumeFromData(structuredClone(DEMO_DATA))
  }, [createResumeFromData])

  const handleImportAttempt = useCallback(() => {
    if (loggedInRef.current) {
      const isSub = proStatusRef.current.kind === 'subscription'
      const limit = isSub ? 10 : 2
      if (authDailyImportUsedRef.current >= limit) {
        showToast(`Daily import limit reached (${limit}/day), resets at midnight`)
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

  // Initialize from the initial sample data's language so the first paint matches the
  // chosen template (the mount effect refines this per flow). Avoids a Chinese-title flash
  // before the ?template effect runs.
  const [isCurrentEnglish, setIsCurrentEnglish] = useState(() => looksEnglish(getInitData(initTemplate)))
  const [compressPhase, setCompressPhase] = useState<'idle' | 'loading'>('idle')
  const [compressWarningDismissed, setCompressWarningDismissed] = useState(false)
  const [postScaleCheck, setPostScaleCheck] = useState(0)

  // ============ One-page compress ============
  const PAGE_H = 1123
  const overflowPx = pageCount > 1 ? Math.max(0, canvasTotalHeightRef.current - PAGE_H) : 0
  const overflowLines = Math.ceil(overflowPx / 20)

  // Auto-show banner again when content starts overflowing again after being fixed
  useEffect(() => { if (pageCount <= 1) setCompressWarningDismissed(false) }, [pageCount])

  // Post-render correction: linear interpolation between two known (scale, height) data points
  // to predict the ideal scale in one shot. Text reflow is non-linear so the initial formula
  // often over-compresses, leaving blank space at the bottom. The off-screen measurer uses
  // skipMinHeight, so canvasTotalHeightRef reports the true content height (not PAGE_HEIGHT-pinned).
  // Maximum 2 correction passes; uses replaceCurrentData so all passes share one undo step.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!postScaleCheck) return
    const id = setTimeout(() => {
      const totalH = canvasTotalHeightRef.current
      const cs = data.fontScale ?? 1
      const isOver = totalH > PAGE_H
      const isUnder = totalH < PAGE_H - 20
      if ((isOver || isUnder) && postScaleIterRef.current < 3) {
        const s0 = prevMeasuredScaleRef.current
        const h0 = prevMeasuredHeightRef.current
        const targetH = PAGE_H - 10  // aim ~10px from page bottom
        let adj: number
        if (isOver) {
          // Overflowing: simple proportional scale-down is reliable
          adj = cs * (PAGE_H - 10) / totalH
        } else {
          // Under-filling: linearly interpolate between (s0,h0) and (cs,totalH) to hit targetH
          const dh = totalH - h0
          const ds = cs - s0
          if (Math.abs(dh) > 20 && Math.abs(ds) > 0.001) {
            adj = cs + ds * (targetH - totalH) / dh
          } else {
            adj = cs * targetH / totalH  // single-point fallback
          }
          // Never exceed the pre-compress scale (it was already overflowing)
          adj = Math.min(adj, preCompressScaleRef.current * 0.999)
        }
        adj = parseFloat(adj.toFixed(4))
        if (adj > 0.3 && adj !== cs) {
          prevMeasuredScaleRef.current = cs
          prevMeasuredHeightRef.current = totalH
          postScaleIterRef.current += 1
          replaceCurrentData({ fontScale: adj })
          setPostScaleCheck(n => n + 1)
          return
        }
      }
      setCompressPhase('idle')
      showToast('✓ Compressed to 1 page (undoable)')
    }, 500)
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

    if (pct <= 100) {
      const scale = parseFloat((currentScale * (PAGE_H - 5) / totalH).toFixed(4))
      preCompressScaleRef.current = currentScale
      prevMeasuredScaleRef.current = currentScale
      prevMeasuredHeightRef.current = totalH
      postScaleIterRef.current = 0
      setCompressPhase('loading')
      updateData({ fontScale: scale })
      setPostScaleCheck(n => n + 1)
    } else {
      showToast('Content exceeds 2 pages — trim some entries or shorten descriptions before compressing')
    }
  }, [data.fontScale, updateData, compressPhase, auth.loggedIn])


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
        saveToHistory({ name: docTitle || 'My Resume', data, templateId, color, savedAt: Date.now() })
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
          showToast(errJson?.error || 'Daily import limit reached, try again tomorrow')
          setImportModalState('none')
          return
        }
        if (res.ok) {
          const json = await res.json()
          importedData = parsedToResumeData(json.data ?? {})
        } else {
          showToast('Import failed, please try again')
          setImportModalState('none')
          return
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return  // cancelled
        console.error('import parse error:', e)
        showToast('Import failed, please try again')
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
      showToast(`Resume limit reached (${resumeLimit}). Please delete an old resume first.`)
      setImportModalState('none')
      return
    }
    const uniqueName = uniqueHistoryName(name, currentHistory)
    const newId = saveToHistory({ name: uniqueName, data: importedData, templateId: 'classic-pro', color: undefined, savedAt: Date.now() })
    loadedFromHistoryId.current = newId || null
    setCurrentHistoryId(newId || null)
    setHistory([importedData])
    setHistoryIdx(0)
    setTemplateId('classic-pro')
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
    showToast(`✓ Imported "${uniqueName}"`)
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
          onCoverLetter={() => setCoverLetterOpen(true)}
          onDownload={handleDownloadAttempt}
          onUndo={undo} onRedo={redo}
          canUndo={historyIdx > 0}
          canRedo={historyIdx < history.length - 1}
          isMobile={isMobile}
          onNewResume={handleCreateNewResume}
          onImportFile={handleImportAttempt}
          disabled={noResumeOpen}
        />
      </div>

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
            onTemplateChange={(id) => { setTemplateId(id); setAccentStyleOverride(undefined); setFontPairOverride(undefined); if (data.fontScale) updateData({ fontScale: undefined }); showToast('Template switched'); if (isMobile) setLeftOpen(false) }}
            currentColor={effectiveColor}
            onColorChange={(c) => { setColor(c); showToast('Color applied') }}
            currentAccentStyle={effectiveTemplate.accentStyle}
            onAccentStyleChange={(s) => { setAccentStyleOverride(s); showToast('Heading style updated') }}
            currentFontPair={effectiveTemplate.fontPair}
            onFontPairChange={(f) => { setFontPairOverride(f); showToast('Font updated') }}
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
            onForceTabConsumed={() => setLeftPanelTab(null)}
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
              title={isMobile ? 'Open menu' : (leftCollapsed ? 'Expand panel' : 'Collapse panel')}
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
                  { icon: <Undo2 size={14} />, onClick: undo, disabled: historyIdx <= 0, title: 'Undo' },
                  { icon: <Redo2 size={14} />, onClick: redo, disabled: historyIdx >= history.length - 1, title: 'Redo' },
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
            {!isMobile && <span style={{ fontSize: '12px', color: '#64748b' }}>{pageCount} pages</span>}
            {showWatermark && !isMobile && (
              <span style={{
                fontSize: '11px', color: '#92400e', background: '#fef3c7',
                padding: '2px 8px', borderRadius: '10px', fontWeight: 500,
              }}>Watermark</span>
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
              >Fit to 1 page</button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span ref={zoomDisplayRef} style={{ fontSize: '12px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom)}%</span>
              {([['－', -10], ['＋', 10]] as [string, number][]).map(([l, d]) => (
                <button key={l} onClick={() => commitZoom(zoomRef.current + d)} style={{
                  padding: '4px 10px', borderRadius: '10px', fontSize: '13px', lineHeight: '16px',
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
                padding: '4px 10px', borderRadius: '10px', fontSize: '11px', lineHeight: '16px',
                cursor: 'pointer', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontFamily: 'var(--font-sans)',
              }}>Reset</button>
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
                      ⚠ Content exceeds page 1 by about {overflowLines} lines
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#92400e', opacity: 0.75 }}>
                      One-page resumes are 40% more likely to pass
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
                      >Reset font size</button>
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
                    Fit to 1 page
                    </button>
                    <button
                      onClick={() => setCompressWarningDismissed(true)}
                      title="Dismiss"
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
                <span style={{ fontWeight: 700 }}>Guest mode</span>
                {' · '}Your resume is stored locally in this browser
              </span>
              <button
                onClick={() => setShowEditorLogin(true)}
                style={{
                  padding: '5px 14px', borderRadius: '10px', border: 'none',
                  background: 'var(--highlight)', color: 'white',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                }}
              >Got it</button>
            </div>
          )}


          {/* Empty state — shown when the active resume was deleted */}
          {noResumeOpen && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '14px', backgroundColor: '#e2e8f0', backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <img src="/logo.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', opacity: 0.35 }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>Load a resume from Mine on the left</div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>or create or import a new one here</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={handleCreateNewResume} style={{
                  padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid transparent', background: '#0f172a', color: 'white',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>Create new resume</button>
                <button onClick={handleImportAttempt} style={{
                  padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid white', background: 'white', color: '#334155',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>Import resume</button>
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
                  currentSkills={currentSkillsForAI}
                  currentSummary={data.summary}
                  onApplySuggestion={handleApplySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onClose={handleAIClose}
                  onSkillChecksChange={setPendingSkills}
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
                currentSkills={currentSkillsForAI}
                currentSummary={data.summary}
                onApplySuggestion={handleApplySuggestion}
                onApplyAll={handleApplyAllSuggestions}
                onClose={handleAIClose}
                onSkillChecksChange={setPendingSkills}
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
      {coverLetterOpen && (
        <CoverLetterModal
          data={data}
          onClose={() => setCoverLetterOpen(false)}
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


      {photoCropOpen && (
        <PhotoCropModal
          src={photoCropSrc ?? data.photo ?? ''}
          loading={photoConverting}
          initialMeta={photoCropSrc ? undefined : data.photoMeta}
          onConfirm={(meta) => {
            updateData({ photo: photoCropSrc ?? data.photo, photoMeta: meta })
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
            showToast('✓ Photo adjusted')
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
            showToast('✓ Photo removed')
          }}
          onClose={() => {
            setPhotoCropOpen(false)
            setPhotoCropSrc(null)
          }}
        />
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
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>Generating image…</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>This usually takes a few seconds</div>
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
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>Generating PDF…</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>This usually takes 5–10 seconds</div>
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
        Loading...
      </div>
    }>
      <EditorInner />
    </Suspense>
  )
}
