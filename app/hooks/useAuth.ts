'use client'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

export interface AuthState {
  loading: boolean
  loggedIn: boolean
  kickedOut: boolean
  openid: string | null
  nickname: string | null
  avatar: string | null
  membership: { plan: string; purchased_at: number; expires_at?: number; single_template_id?: string; single_resume_id?: string } | null
  isStudent: boolean
  freeAnalyzeUsed: number
  singleAnalyzeUsed: number
  dailyAnalyzeUsed: number
  dailyTranslateUsed: number
  dailyImportUsed: number
}

const EMPTY: AuthState = { loading: false, loggedIn: false, kickedOut: false, openid: null, nickname: null, avatar: null, membership: null, isStudent: false, freeAnalyzeUsed: 0, singleAnalyzeUsed: 0, dailyAnalyzeUsed: 0, dailyTranslateUsed: 0, dailyImportUsed: 0 }

// ── Auth state cache — lets the UI restore member state instantly on refresh ──
const CACHE_KEY = 'rc_auth_cache'
const CACHE_TTL = 30 * 60 * 1000  // 30 min: short enough to catch plan changes promptly

interface CachedAuth {
  loggedIn: boolean
  openid: string | null
  nickname: string | null
  avatar: string | null
  membership: AuthState['membership']
  isStudent: boolean
  _cachedAt: number
}

function readCache(): CachedAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data: CachedAuth = JSON.parse(raw)
    if (!data.loggedIn || Date.now() - data._cachedAt > CACHE_TTL) return null
    return data
  } catch { return null }
}

function writeCache(s: AuthState): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CachedAuth = {
      loggedIn: s.loggedIn, openid: s.openid, nickname: s.nickname,
      avatar: s.avatar, membership: s.membership, isStudent: s.isStudent,
      _cachedAt: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {}
}

function clearCache(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

/**
 * Returns true when the localStorage auth cache suggests the user was recently logged in.
 * rc_token is httpOnly so JS can't read it — this is our proxy for "likely logged in".
 * Used by the editor to skip localStorage history loading and wait for cloud sync instead.
 */
export function hasSessionHint(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const data: CachedAuth = JSON.parse(raw)
    return data.loggedIn === true && (Date.now() - data._cachedAt) < CACHE_TTL
  } catch { return false }
}

function isMembershipActive(m: AuthState['membership']): boolean {
  if (!m || m.plan === 'single') return false
  return !m.expires_at || m.expires_at > Date.now()
}

export function useAuth() {
  const kickedOutRef = useRef(false)
  const prevLoggedInRef    = useRef<boolean>(readCache()?.loggedIn ?? false)
  const prevMembershipRef  = useRef<AuthState['membership']>(readCache()?.membership ?? null)
  // Always start with the same state on server and client to avoid hydration mismatches.
  // Cache is applied synchronously before the first paint via useLayoutEffect below.
  const [auth, setAuth] = useState<AuthState>({ ...EMPTY, loading: true })

  // Apply localStorage cache before the browser paints — invisible to users, no flash.
  useLayoutEffect(() => {
    const cache = readCache()
    if (cache) {
      setAuth(prev => ({
        ...prev,
        loggedIn: cache.loggedIn,
        openid: cache.openid,
        nickname: cache.nickname,
        avatar: cache.avatar,
        membership: cache.membership,
        isStudent: cache.isStudent,
      }))
    }
  }, [])

  const refresh = useCallback(async () => {
    if (kickedOutRef.current) return  // locked until page reload
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.kicked_out === true) {
        kickedOutRef.current = true
        clearCache()
        setAuth({ ...EMPTY, kickedOut: true, loggedIn: false })
        return
      }
      const next: AuthState = {
        loading: false,
        loggedIn: data.logged_in,
        kickedOut: false,
        openid: data.openid ?? null,
        nickname: data.nickname ?? null,
        avatar: data.avatar ?? null,
        membership: data.membership ?? null,
        isStudent: data.is_student ?? false,
        freeAnalyzeUsed: data.free_analyze_used ?? 0,
        singleAnalyzeUsed: data.single_analyze_used ?? 0,
        dailyAnalyzeUsed: data.daily_analyze_used ?? 0,
        dailyTranslateUsed: data.daily_translate_used ?? 0,
        dailyImportUsed: data.daily_import_used ?? 0,
      }
      // Only write/clear cache on definitive state changes.
      // Don't clear on logged_in:false — it may be a transient DB error.
      // Cache is only cleared on explicit logout or kicked_out.
      if (next.loggedIn) { writeCache(next) }

      // Detect silent payment activation (e.g. user closed QR modal but payment went through).
      // Only fire when the user was already logged in — avoids false positive on every login
      // where prevMembershipRef is null (cache cleared on logout) but membership is active.
      const wasLoggedIn = prevLoggedInRef.current
      const wasActive   = isMembershipActive(prevMembershipRef.current)
      const nowActive   = isMembershipActive(next.membership)
      if (wasLoggedIn && !wasActive && nowActive) {
        window.dispatchEvent(new CustomEvent('rc:payment_success', {
          detail: { plan: next.membership?.plan },
        }))
      }
      prevLoggedInRef.current   = next.loggedIn
      prevMembershipRef.current = next.membership

      setAuth(next)
    } catch {
      // Network/server error — don't wipe cached auth state
      setAuth(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Periodic refresh every 2 minutes to detect kicked-out sessions
  useEffect(() => {
    const t = setInterval(refresh, 2 * 60 * 1000)
    return () => clearInterval(t)
  }, [refresh])

  // Immediate kick-out detection: re-check when tab regains focus or becomes visible
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const onFocus   = () => refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  // Cross-component login notification: any component can dispatch 'rc:login' to trigger a refresh
  useEffect(() => {
    const onLogin = () => refresh()
    window.addEventListener('rc:login', onLogin)
    return () => window.removeEventListener('rc:login', onLogin)
  }, [refresh])

  const logout = useCallback(async () => {
    clearCache()
    await fetch('/api/auth/me', { method: 'POST' })
    setAuth({ ...EMPTY })
  }, [])

  return { ...auth, refresh, logout }
}
