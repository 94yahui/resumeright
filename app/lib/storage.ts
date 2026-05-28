// localStorage keys
const DRAFT_KEY = 'resumecraft_draft'
const HISTORY_KEY = 'resumecraft_history'
const PAID_KEY = 'resumecraft_paid'

import type { ResumeData } from './types'

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
