'use client'
import { useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Auth is currently DISABLED.
//
// Login (previously WeChat) and payment/membership have been removed for the
// international launch. This hook is now a stub that grants every visitor full,
// unlimited access so all former member-gated features are open to everyone.
//
// The AuthState shape and the useAuth/hasSessionHint exports are kept intact on
// purpose: when OAuth (e.g. Google) is added later, only this file plus a small
// session API route need to change — no consumer component has to be touched.
// ─────────────────────────────────────────────────────────────────────────────

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
  dailyImportUsed: number
  freeAtsUsed: number
  singleAtsUsed: number
  dailyAtsUsed: number
}

// Full-access stub: treated as a logged-in subscriber with no usage consumed.
const FULL_ACCESS: AuthState = {
  loading: false,
  loggedIn: true,
  kickedOut: false,
  openid: null,
  nickname: null,
  avatar: null,
  membership: { plan: 'monthly', purchased_at: 0 },
  isStudent: false,
  freeAnalyzeUsed: 0,
  singleAnalyzeUsed: 0,
  dailyAnalyzeUsed: 0,
  dailyImportUsed: 0,
  freeAtsUsed: 0,
  singleAtsUsed: 0,
  dailyAtsUsed: 0,
}

/**
 * Kept for the editor, which used this to decide whether to wait for cloud sync.
 * With login removed there is no cloud session, so storage is always local.
 */
export function hasSessionHint(): boolean {
  return false
}

export function useAuth() {
  const refresh = useCallback(async () => {}, [])
  const logout = useCallback(async () => {}, [])
  return { ...FULL_ACCESS, refresh, logout }
}
