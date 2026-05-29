'use client'
import { useState, useEffect, useCallback } from 'react'

export interface AuthState {
  loading: boolean
  loggedIn: boolean
  openid: string | null
  membership: { plan: string; purchased_at: number; expires_at?: number; single_template_id?: string } | null
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ loading: true, loggedIn: false, openid: null, membership: null })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setAuth({ loading: false, loggedIn: data.logged_in, openid: data.openid ?? null, membership: data.membership ?? null })
    } catch {
      setAuth({ loading: false, loggedIn: false, openid: null, membership: null })
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    setAuth({ loading: false, loggedIn: false, openid: null, membership: null })
  }, [])

  return { ...auth, refresh, logout }
}
