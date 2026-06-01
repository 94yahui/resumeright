// Module-level store for a pending parse-resume fetch started on the landing page.
// Survives client-side navigation (SPA transition) but not a full page reload.

export interface PendingImportResult {
  data: Record<string, unknown>
  filename: string
}

let _promise: Promise<PendingImportResult> | null = null

export function setPendingImport(p: Promise<PendingImportResult>) {
  _promise = p
}

export function takePendingImport(): Promise<PendingImportResult> | null {
  const p = _promise
  _promise = null
  return p
}
