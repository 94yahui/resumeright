// Payment data layer — device ID, payment records, student verification, usage tracking.
// All data stored in localStorage (+ cookie for device ID).
// No server-side state in this version.

// ─── Storage keys ─────────────────────────────────────────────────────────────
const LS_DEVICE   = 'rc_device_id'
const LS_PAYMENTS = 'rc_payments'
const LS_STUDENT  = 'rc_student'
const LS_USAGE    = 'rc_usage'
const COOKIE_DEVICE = 'rc_did'

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlanType  = 'single' | 'monthly' | 'quarterly' | 'yearly' | 'trial7'
export type PayMethod = 'wechat'
export type UsageType = 'import' | 'ai_analyze' | 'ai_translate'

export interface PaymentRecord {
  orderId: string
  deviceId: string
  planType: PlanType
  amount: number          // actual paid, in fen (¥1 = 100 fen)
  isStudent: boolean
  resumeId?: string       // 'single' only — which resume this unlocks
  templateId?: string     // 'single' only — which template was unlocked at purchase time
  paidAt: number          // unix ms
  expiresAt?: number      // unix ms; undefined for 'single' (no expiry)
  payMethod: PayMethod
  aiAnalyzeUsed: number
}

export interface StudentRecord {
  deviceId: string
  certifiedAt: number
  expiresAt: number       // 1 year from certification
}

interface DailyUsage {
  deviceId: string
  date: string            // 'YYYY-MM-DD'
  type: UsageType
  count: number
  updatedAt: number
}

// ─── Resolved pro status ──────────────────────────────────────────────────────
export type ProStatus =
  | { kind: 'free' }
  | { kind: 'single'; orderId: string; resumeId: string; templateId: string; aiAnalyzeLeft: number }
  | { kind: 'subscription'; plan: 'monthly' | 'quarterly' | 'yearly'; expiresAt: number }

// ─── Plan prices (fen) ────────────────────────────────────────────────────────
export const PRICES = {
  monthly:   { normal: 2900, student: 1490 },
  quarterly: { normal: 6900, student: 3490 },
  yearly:    { normal: 16800, student: 8400 },
  single:    { normal: 990, student: 490 },   // non-first-order
  singleFirst: { normal: 99, student: 99 },   // first order: ¥0.99 for everyone
}

export const PLAN_DURATION_MS: Record<string, number> = {
  monthly:   30 * 86_400_000,
  quarterly: 90 * 86_400_000,
  yearly:    365 * 86_400_000,
  trial7:    7  * 86_400_000,
}

// ─── Promo code redemption tracking (per-device, stored in localStorage) ──────
const LS_REDEEMED = 'rc_redeemed'
export function hasRedeemedCode(code: string): boolean {
  const list: string[] = ls(LS_REDEEMED, [])
  return list.includes(code.toUpperCase())
}
export function markCodeRedeemed(code: string): void {
  const list: string[] = ls(LS_REDEEMED, [])
  if (!list.includes(code.toUpperCase())) {
    list.push(code.toUpperCase())
    lsSet(LS_REDEEMED, list)
  }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function lsSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────
function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const exp = new Date(Date.now() + days * 86_400_000)
  document.cookie = `${name}=${value};expires=${exp.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  for (const c of document.cookie.split(';')) {
    const t = c.trim()
    if (t.startsWith(prefix)) return t.slice(prefix.length)
  }
  return null
}

// ─── Device ID ────────────────────────────────────────────────────────────────
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Returns the device ID, creating it on first call.
 * Dual-writes to cookie (365 days) + localStorage so clearing one end preserves identity.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  const fromCookie = getCookie(COOKIE_DEVICE)
  const fromLS     = localStorage.getItem(LS_DEVICE)
  const existing   = fromCookie || fromLS
  if (existing) {
    if (!fromCookie) setCookie(COOKIE_DEVICE, existing, 365)
    if (!fromLS)     localStorage.setItem(LS_DEVICE, existing)
    return existing
  }
  const id = generateUUID()
  localStorage.setItem(LS_DEVICE, id)
  setCookie(COOKIE_DEVICE, id, 365)
  return id
}

// ─── Payment records ──────────────────────────────────────────────────────────
export function getPayments(): PaymentRecord[] {
  return ls<PaymentRecord[]>(LS_PAYMENTS, [])
}

export function addPayment(record: PaymentRecord): void {
  const list = getPayments()
  list.unshift(record)
  lsSet(LS_PAYMENTS, list)
}

export function updatePayment(orderId: string, patch: Partial<PaymentRecord>): void {
  const list = getPayments()
  const idx  = list.findIndex(p => p.orderId === orderId)
  if (idx === -1) return
  list[idx] = { ...list[idx], ...patch }
  lsSet(LS_PAYMENTS, list)
}

export function generateOrderId(): string {
  return `RC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/** True if this device has never completed any purchase (unlocks ¥0.99 first-order price). */
export function isFirstPurchase(deviceId: string): boolean {
  return getPayments().filter(p => p.deviceId === deviceId).length === 0
}

// ─── Pro status resolution ────────────────────────────────────────────────────
/**
 * Resolves the effective pro status for a device.
 * Pass `resumeId` to check whether a single-purchase covers the current resume.
 */
export function getProStatus(deviceId: string, resumeId?: string): ProStatus {
  const now      = Date.now()
  const payments = getPayments().filter(p => p.deviceId === deviceId)

  // Active subscription wins over everything else (trial7 counts as subscription)
  const activeSub = payments
    .filter(p => p.planType !== 'single' && !!p.expiresAt && p.expiresAt > now)
    .sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0]
  if (activeSub) {
    const planLabel = activeSub.planType === 'trial7' ? 'monthly' : activeSub.planType as 'monthly' | 'quarterly' | 'yearly'
    return {
      kind: 'subscription',
      plan: planLabel,
      expiresAt: activeSub.expiresAt!,
    }
  }

  // Single purchase covering this specific resume
  if (resumeId) {
    const single = payments.find(p => p.planType === 'single' && p.resumeId === resumeId)
    if (single) {
      return {
        kind: 'single',
        orderId: single.orderId,
        resumeId,
        templateId: single.templateId ?? '',  // empty = old purchase without template binding
        aiAnalyzeLeft: Math.max(0, 5 - (single.aiAnalyzeUsed ?? 0)),
      }
    }
  }

  return { kind: 'free' }
}

// ─── Student verification ─────────────────────────────────────────────────────
export function getStudentRecord(deviceId: string): StudentRecord | null {
  const rec = ls<StudentRecord | null>(LS_STUDENT, null)
  if (!rec || rec.deviceId !== deviceId) return null
  if (rec.expiresAt < Date.now()) return null   // expired
  return rec
}

export function setStudentRecord(record: StudentRecord): void {
  lsSet(LS_STUDENT, record)
}

export function isStudent(deviceId: string): boolean {
  return getStudentRecord(deviceId) !== null
}

// ─── Daily usage limits ───────────────────────────────────────────────────────
function getUsageList(): DailyUsage[] {
  return ls<DailyUsage[]>(LS_USAGE, [])
}

function saveUsageList(list: DailyUsage[]): void {
  lsSet(LS_USAGE, list)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getDailyCount(deviceId: string, type: UsageType, date = todayStr()): number {
  const rec = getUsageList().find(u => u.deviceId === deviceId && u.type === type && u.date === date)
  return rec?.count ?? 0
}

function incrementDaily(deviceId: string, type: UsageType): void {
  const date = todayStr()
  const list = getUsageList()
  const idx  = list.findIndex(u => u.deviceId === deviceId && u.type === type && u.date === date)
  if (idx === -1) {
    list.push({ deviceId, date, type, count: 1, updatedAt: Date.now() })
  } else {
    list[idx] = { ...list[idx], count: list[idx].count + 1, updatedAt: Date.now() }
  }
  saveUsageList(list)
}

/** Remove records older than 7 days to keep localStorage lean. */
export function cleanOldUsage(): void {
  const threshold = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
  saveUsageList(getUsageList().filter(u => u.date >= threshold))
}

// ─── Free AI-analyze lifetime counter ────────────────────────────────────────
const LS_FREE_ANALYZE = 'rc_fa'
export const FREE_ANALYZE_LIMIT  = 2   // logged-in free users (lifetime)
export const GUEST_ANALYZE_LIMIT = 1   // not-logged-in guests (lifetime, by deviceId)

export function getFreeAnalyzeUsed(): number {
  return ls<number>(LS_FREE_ANALYZE, 0)
}

export function setFreeAnalyzeUsed(count: number): void {
  lsSet(LS_FREE_ANALYZE, count)
}

function incrementFreeAnalyze(): void {
  lsSet(LS_FREE_ANALYZE, getFreeAnalyzeUsed() + 1)
}

export function setPayments(list: PaymentRecord[]): void {
  lsSet(LS_PAYMENTS, list)
}

// ─── Usage check + record ─────────────────────────────────────────────────────
export type UsageCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'not_paid' | 'daily_limit' | 'total_limit'; used: number; limit: number }

const IMPORT_LIMITS = { free: 2, single: 5, subscription: 10 }

export function checkUsage(deviceId: string, type: UsageType, status: ProStatus): UsageCheckResult {
  if (type === 'import') {
    const limit = status.kind === 'subscription' ? IMPORT_LIMITS.subscription
      : status.kind === 'single'       ? IMPORT_LIMITS.single
      :                                  IMPORT_LIMITS.free
    const used = getDailyCount(deviceId, 'import')
    if (used >= limit) return { allowed: false, reason: 'daily_limit', used, limit }
    return { allowed: true }
  }

  if (type === 'ai_analyze') {
    if (status.kind === 'free') {
      const used = getFreeAnalyzeUsed()
      if (used >= FREE_ANALYZE_LIMIT) return { allowed: false, reason: 'total_limit', used, limit: FREE_ANALYZE_LIMIT }
      return { allowed: true }
    }
    if (status.kind === 'single') {
      const left = status.aiAnalyzeLeft
      if (left <= 0) return { allowed: false, reason: 'total_limit', used: 5, limit: 5 }
      return { allowed: true }
    }
    const used = getDailyCount(deviceId, 'ai_analyze')
    if (used >= 20) return { allowed: false, reason: 'daily_limit', used, limit: 20 }
    return { allowed: true }
  }

  if (type === 'ai_translate') {
    if (status.kind !== 'subscription') return { allowed: false, reason: 'not_paid', used: 0, limit: 0 }
    // Daily limit for subscription users is checked server-side (authDailyTranslateUsedRef) in handleTranslate
    return { allowed: true }
  }

  return { allowed: true }
}

/** Call after a successful AI / import action to deduct from quota. */
export function recordUsage(deviceId: string, type: UsageType, status: ProStatus): void {
  if (type === 'import') {
    incrementDaily(deviceId, 'import')
    return
  }
  if (type === 'ai_analyze' && status.kind === 'free') {
    incrementFreeAnalyze()
    return
  }
  if (type === 'ai_analyze' && status.kind === 'single') {
    const list = getPayments()
    const idx  = list.findIndex(p => p.orderId === status.orderId)
    if (idx !== -1) {
      list[idx] = { ...list[idx], aiAnalyzeUsed: (list[idx].aiAnalyzeUsed ?? 0) + 1 }
      lsSet(LS_PAYMENTS, list)
    }
    return
  }
  // subscription: daily counters
  incrementDaily(deviceId, type)
}

// ─── Template access ──────────────────────────────────────────────────────────
/** Returns true when the user can use a Pro (free:false) template. */
export function canUseProTemplate(status: ProStatus): boolean {
  return status.kind === 'subscription'
}

/** Returns true when PDF download should have no watermark. */
export function hasNoWatermark(status: ProStatus): boolean {
  return status.kind === 'subscription' || status.kind === 'single'
}
