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

import type { ResumeData } from './types'
import type { AccentStyle, FontPair } from './templates-config'

export interface DraftState {
  data: ResumeData
  templateId: string
  color: string | undefined
  accentStyleOverride?: AccentStyle
  fontPairOverride?: FontPair
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
  accentStyleOverride?: AccentStyle
  fontPairOverride?: FontPair
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

// ── Cloud resume sync (disabled) ────────────────────────────────────────────────
// Login was removed, so there is no per-user cloud storage. All resume data now
// lives in localStorage only. These functions are kept as no-ops so the editor,
// which still calls them, keeps working unchanged. When OAuth is added later,
// reconnect them to a per-user /api/resumes endpoint.

export async function fetchCloudResumes(): Promise<HistoryEntry[]> {
  return []
}

export async function upsertCloudResume(_entry: HistoryEntry): Promise<void> {
  // no-op: local storage is the source of truth
}

export async function deleteCloudResume(_id: string): Promise<void> {
  // no-op
}

/** No cloud to sync with — returns false (local list unchanged). */
export async function syncResumesWithCloud(): Promise<boolean> {
  return false
}

// ── Legacy login-time sync hooks (no-ops) ────────────────────────────────────────

export function syncFreeAnalyzeOnLogin(_serverCount: number): void {
  // no-op: AI usage is no longer metered
}

export function incrementFreeAnalyzeOnServer(): void {
  // no-op
}

export async function syncOrdersFromServer(): Promise<void> {
  // no-op: payment removed
}
