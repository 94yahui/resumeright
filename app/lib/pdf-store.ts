/**
 * Module-level in-memory store for resume data during server-side PDF generation.
 * Shared between /api/pdf/generate (writer) and /api/pdf/data (reader).
 * Works reliably in a persistent Node.js process (npm start / npm dev).
 */

interface PdfEntry {
  data?: unknown
  templateId?: string
  color?: string
  breakPoints?: number[]
  totalHeight?: number
  htmlContent?: string
  ts: number
}

const store = new Map<string, PdfEntry>()

// Sweep stale entries older than 2 minutes (guarded for environments where
// setInterval is not available or where unref doesn't exist)
const sweep = setInterval(() => {
  const cutoff = Date.now() - 120_000
  for (const [id, v] of store) {
    if (v.ts < cutoff) store.delete(id)
  }
}, 60_000)
if (typeof sweep === 'object' && 'unref' in sweep) (sweep as NodeJS.Timeout).unref()

export function storePdfEntry(id: string, entry: Omit<PdfEntry, 'ts'>) {
  store.set(id, { ...entry, ts: Date.now() })
}

export function getPdfEntry(id: string): PdfEntry | undefined {
  return store.get(id)
}

export function deletePdfEntry(id: string) {
  store.delete(id)
}
