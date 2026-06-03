// localStorage keys
const DRAFT_KEY = 'resumecraft_draft'
const HISTORY_KEY = 'resumecraft_history'
const PAID_KEY = 'resumecraft_paid'
const GUEST_IDS_KEY = 'rc_guest_ids'
const DELETED_KEY = 'resumecraft_deleted'  // tombstone: IDs deleted locally, pending cloud delete

// ── Tombstone helpers ─────────────────────────────────────────────────────────
function getTombstones(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '{}') } catch { return {} }
}

export function addTombstone(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const t = getTombstones()
    t[id] = Date.now()
    localStorage.setItem(DELETED_KEY, JSON.stringify(t))
  } catch {}
}

function cleanTombstones(t: Record<string, number>): Record<string, number> {
  const cutoff = Date.now() - 7 * 24 * 3600_000
  const cleaned: Record<string, number> = {}
  for (const [id, ts] of Object.entries(t)) {
    if (ts > cutoff) cleaned[id] = ts
  }
  return cleaned
}

import type { ResumeData } from './types'
import { getFreeAnalyzeUsed, setFreeAnalyzeUsed, getPayments, setPayments, PLAN_DURATION_MS, type PaymentRecord } from './payment'

export interface DraftState {
  data: ResumeData
  templateId: string
  color: string | undefined
  docTitle: string
  savedAt: number
  historyId?: string  // id of the history entry being edited when this draft was written
}

export interface HistoryEntry {
  id: string
  name: string
  data: ResumeData
  templateId: string
  color: string | undefined
  savedAt: number
  isEnglish?: boolean
}

export function loadDraft(): DraftState | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
}

export function saveDraft(state: DraftState): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)) } catch (e) {
    console.error('[storage] saveDraft failed:', e)
    throw e
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}

/** Wipe all resume-related local data on logout — history, draft, anonymous work. */
export function clearLocalResumeData(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(HISTORY_KEY)
    localStorage.removeItem(PAID_KEY)
    localStorage.removeItem('anonymous_resume')
    localStorage.removeItem(GUEST_IDS_KEY)
  } catch {}
}

/** Immediately wipe all guest resume data when the guest leaves the editor page. */
export function clearGuestResumesNow(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(HISTORY_KEY)
    localStorage.removeItem(GUEST_IDS_KEY)
  } catch {}
}

// ── Guest resume ID tracking ───────────────────────────────────────────────────

export function getGuestIds(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(GUEST_IDS_KEY) || '[]') } catch { return [] }
}

export function addGuestId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const ids = getGuestIds()
    if (!ids.includes(id)) {
      localStorage.setItem(GUEST_IDS_KEY, JSON.stringify([...ids, id]))
    }
  } catch {}
}

export function clearGuestIds(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(GUEST_IDS_KEY) } catch {}
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

// Re-sort and persist history by savedAt desc. Call on editor exit so the list
// reflects actual edit recency the next time the user opens the editor.
export function sortAndSaveHistory(): void {
  if (typeof window === 'undefined') return
  try {
    const list = loadHistory()
    if (list.length < 2) return
    list.sort((a, b) => b.savedAt - a.savedAt)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {}
}

export function uniqueHistoryName(name: string, list: HistoryEntry[]): string {
  const names = new Set(list.map(e => e.name))
  if (!names.has(name)) return name
  // Strip trailing " N" (space + number) to get the base name
  const match = name.match(/^(.*) (\d+)$/)
  const base = match ? match[1] : name
  let n = match ? parseInt(match[2], 10) + 1 : 2
  while (names.has(`${base} ${n}`)) n++
  return `${base} ${n}`
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id'>): string {
  if (typeof window === 'undefined') return ''
  const list = loadHistory()
  const id = Date.now().toString()
  const name = uniqueHistoryName(entry.name, list)
  const updated = [{ ...entry, id, name }, ...list].slice(0, 20)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('[storage] saveToHistory failed:', e)
    throw e
  }
  return id
}

export function updateHistoryEntry(id: string, patch: Partial<Omit<HistoryEntry, 'id'>>): void {
  if (typeof window === 'undefined') return
  const list = loadHistory()
  const idx = list.findIndex(h => h.id === id)
  if (idx === -1) return
  list[idx] = { ...list[idx], ...patch }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('[storage] updateHistoryEntry failed:', e)
    throw e
  }
}

export function deleteHistory(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = loadHistory().filter(h => h.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {}
  addTombstone(id)
}

export function loadPaidTemplates(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(PAID_KEY) || '[]') } catch { return [] }
}

export function addPaidTemplate(templateId: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = loadPaidTemplates()
    if (!list.includes(templateId)) {
      localStorage.setItem(PAID_KEY, JSON.stringify([...list, templateId]))
    }
  } catch {}
}

export function isTemplatePaid(templateId: string): boolean {
  return loadPaidTemplates().includes(templateId)
}

// ── Cloud resume sync ──────────────────────────────────────────────────────────

export async function fetchCloudResumes(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch('/api/resumes')
    if (!res.ok) return []
    const docs = await res.json()
    if (!Array.isArray(docs)) return []
    return docs as HistoryEntry[]
  } catch {
    return []
  }
}

export async function upsertCloudResume(entry: HistoryEntry): Promise<void> {
  try {
    await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: entry.id,
        name: entry.name,
        data: entry.data,
        templateId: entry.templateId,
        color: entry.color,
        savedAt: entry.savedAt,
        isEnglish: entry.isEnglish,
      }),
    })
  } catch {
    // silently fail — local copy is the source of truth
  }
}

export async function deleteCloudResume(id: string): Promise<void> {
  try {
    await fetch(`/api/resumes?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    // silently fail
  }
}

/**
 * Bidirectional sync: merges local history with cloud.
 * For each resume ID, the version with the higher savedAt wins.
 * Local-only or locally-newer entries are uploaded to cloud.
 * Cloud-only or cloud-newer entries are persisted to localStorage.
 * Returns true if the local list changed (caller should refresh UI).
 */
export async function syncResumesWithCloud(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const cloud = await fetchCloudResumes()
  const local = loadHistory()

  // Clean and get tombstones (locally deleted IDs)
  let tombstones = getTombstones()
  tombstones = cleanTombstones(tombstones)
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(tombstones)) } catch {}
  const deletedIds = new Set(Object.keys(tombstones))

  const merged = new Map<string, HistoryEntry>()
  for (const e of local) merged.set(e.id, e)
  for (const c of cloud) {
    // Skip cloud entries that were deleted locally — don't restore them
    if (deletedIds.has(c.id)) continue
    const existing = merged.get(c.id)
    if (!existing || c.savedAt > existing.savedAt) merged.set(c.id, c)
  }

  const sorted = Array.from(merged.values())
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 20)

  // Determine whether local list actually changed
  const localChanged = sorted.length !== local.length ||
    sorted.some((e, i) => e.id !== local[i]?.id || e.savedAt !== local[i]?.savedAt)

  if (localChanged) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(sorted)) } catch {}
  }

  // Upload local-only or locally-newer entries to cloud,
  // but skip entries still pending a guest-sync decision (user hasn't accepted yet)
  const guestPending = new Set(getGuestIds())
  const cloudMap = new Map(cloud.map(c => [c.id, c]))
  const uploads = sorted.filter(e => {
    if (guestPending.has(e.id)) return false
    const cv = cloudMap.get(e.id)
    return !cv || e.savedAt > cv.savedAt
  })

  // Re-issue delete for tombstoned entries still present in cloud
  const pendingDeletes = cloud.filter(c => deletedIds.has(c.id))

  await Promise.all([
    ...uploads.map(upsertCloudResume),
    ...pendingDeletes.map(c => deleteCloudResume(c.id)),
  ])

  return localChanged
}

// ── Free AI-analyze count sync ─────────────────────────────────────────────────

/**
 * On login: set localStorage to max(local, server) so the stricter limit wins.
 */
export function syncFreeAnalyzeOnLogin(serverCount: number): void {
  if (typeof window === 'undefined') return
  const local = getFreeAnalyzeUsed()
  if (serverCount > local) setFreeAnalyzeUsed(serverCount)
}

/** Fire-and-forget: tell the server the user just used one free AI analyze. */
export function incrementFreeAnalyzeOnServer(): void {
  fetch('/api/auth/free-analyze', { method: 'POST' }).catch(() => {})
}

// ── Order / payment sync ───────────────────────────────────────────────────────

/**
 * On login: fetch paid orders linked to this account, convert to PaymentRecord,
 * and merge into localStorage rc_payments (skipping IDs already present).
 */
export async function syncOrdersFromServer(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/orders')
    if (!res.ok) return
    const orders: Array<{
      _id: string; planType: string; amountFen: number; isStudent: boolean
      resumeId?: string; templateId?: string; paidAt?: number; deviceId: string
    }> = await res.json()

    const local = getPayments()
    const localIds = new Set(local.map(p => p.orderId))
    const now = Date.now()

    const toAdd: PaymentRecord[] = orders
      .filter(o => o.paidAt && !localIds.has(o._id))
      .map(o => ({
        orderId: o._id,
        deviceId: o.deviceId || '',
        planType: o.planType as PaymentRecord['planType'],
        amount: o.amountFen,
        isStudent: o.isStudent,
        resumeId: o.resumeId,
        templateId: o.templateId,
        paidAt: o.paidAt!,
        expiresAt: o.planType !== 'single' && PLAN_DURATION_MS[o.planType]
          ? o.paidAt! + PLAN_DURATION_MS[o.planType]
          : undefined,
        payMethod: 'wechat' as const,
        aiAnalyzeUsed: 0,
      }))
      // Drop expired subscriptions — no point restoring them
      .filter(p => p.expiresAt === undefined || p.expiresAt > now)

    if (toAdd.length > 0) setPayments([...local, ...toAdd])
  } catch {
    // silently fail
  }
}
