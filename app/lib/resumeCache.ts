const CACHE_KEY = 'rc_cached_resume'
const PARSED_CACHE_KEY = 'rc_cached_resume_parsed'
const MAX_CACHE_BYTES = 4 * 1024 * 1024  // 4 MB

export const RESUME_CACHED_EVENT = 'rc:resume-cached'

interface CachedEntry { name: string; type: string; data: string; savedAt: number }

const ATS_RESULT_KEY = 'rc_cached_ats_result'

export function saveATSResultToCache(result: unknown): void {
  try { localStorage.setItem(ATS_RESULT_KEY, JSON.stringify(result)) } catch {}
}

export function getCachedATSResult(): unknown | null {
  try {
    const raw = localStorage.getItem(ATS_RESULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveResumeToCache(file: File): void {
  if (file.size > MAX_CACHE_BYTES) return
  // New file → invalidate previous parsed and ATS results
  try { localStorage.removeItem(PARSED_CACHE_KEY) } catch {}
  try { localStorage.removeItem(ATS_RESULT_KEY) } catch {}
  const reader = new FileReader()
  reader.onload = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: reader.result as string,
        savedAt: Date.now(),
      } satisfies CachedEntry))
    } catch {}
  }
  reader.readAsDataURL(file)
}

export function saveParsedDataToCache(data: unknown): void {
  try { localStorage.setItem(PARSED_CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function getCachedParsedData(): unknown | null {
  try {
    const raw = localStorage.getItem(PARSED_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getCachedResumeName(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as CachedEntry).name
  } catch { return null }
}

export function getCachedResumeFile(): File | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { name, type, data } = JSON.parse(raw) as CachedEntry
    const bytes = Uint8Array.from(atob(data.split(',')[1]), c => c.charCodeAt(0))
    return new File([bytes], name, { type })
  } catch { return null }
}
