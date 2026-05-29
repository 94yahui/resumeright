'use client'
import { useState, useEffect, useCallback } from 'react'

export interface AuthState {
  loading: boolean
  loggedIn: boolean
  openid: string | null
  membership: { plan: string; purchased_at: number; expires_at?: number; single_template_id?: string } | null
  isStudent: boolean
  freeAnalyzeUsed: number
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ loading: true, loggedIn: false, openid: null, membership: null, isStudent: false, freeAnalyzeUsed: 0 })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setAuth({ loading: false, loggedIn: data.logged_in, openid: data.openid ?? null, membership: data.membership ?? null, isStudent: data.is_student ?? false, freeAnalyzeUsed: data.free_analyze_used ?? 0 })
    } catch {
      setAuth({ loading: false, loggedIn: false, openid: null, membership: null, isStudent: false, freeAnalyzeUsed: 0 })
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    setAuth({ loading: false, loggedIn: false, openid: null, membership: null, isStudent: false, freeAnalyzeUsed: 0 })
  }, [])

  return { ...auth, refresh, logout }
}
