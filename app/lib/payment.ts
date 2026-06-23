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
export type PlanType  = 'single' | 'day3' | 'weekly' | 'monthly' | 'quarterly'
export type PayMethod = 'wechat'
export type UsageType = 'import' | 'ai_analyze'

export interface PaymentRecord {
  orderId: string
  deviceId: string
  planType: PlanType
  amount: number          // actual paid, in USD cents ($1 = 100 cents)
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
  | { kind: 'subscription'; plan: 'day3' | 'weekly' | 'monthly' | 'quarterly'; expiresAt: number }

// ─── Plan prices (USD cents, $1 = 100 cents) ──────────────────────────────────
export const PRICES = {
  single:    699,   // pay-as-you-go — permanently unlock export of one resume
  day3:      399,   // 3-day pass (one-time, no auto-renew)
  weekly:    799,   // weekly pass (one-time, no auto-renew)
  monthly:   1999,  // monthly (auto-renews)
  quarterly: 3999,  // quarterly (auto-renews)
}

export const PLAN_DURATION_MS: Record<string, number> = {
  day3:      3   * 86_400_000,
  weekly:    7   * 86_400_000,
  monthly:   30  * 86_400_000,
  quarterly: 90  * 86_400_000,
}

// ─── Pricing-page display config ──────────────────────────────────────────────
// Passes grant full Pro access for their duration. Short passes (3-day / weekly) are
// one-time with no auto-renew; monthly / quarterly auto-renew. Pay-as-you-go ('single')
// is a one-time purchase that permanently unlocks export of a SINGLE resume.
export interface PassPlan {
  key: 'day3' | 'weekly' | 'monthly' | 'quarterly'
  label: string
  cents: number
  days: number
  autoRenew: boolean
  badge?: string
}
export const PASS_PLANS: PassPlan[] = [
  { key: 'day3',      label: '3-Day Pass', cents: PRICES.day3,      days: 3,  autoRenew: false },
  { key: 'weekly',    label: 'Weekly',     cents: PRICES.weekly,    days: 7,  autoRenew: false },
  { key: 'monthly',   label: 'Monthly',    cents: PRICES.monthly,   days: 30, autoRenew: true, badge: 'Most popular' },
  { key: 'quarterly', label: 'Quarterly',  cents: PRICES.quarterly, days: 90, autoRenew: true, badge: 'Best value' },
]

// Feature credits per tier.
//  - free / single: one-time allowances (free = lifetime per device, single = per purchase)
//  - pro: per-day caps (resets daily while the pass is active)
export const AI_QUOTA = {
  free:   { optimize: 5,  ats: 5,  import: 2,  coverLetter: 1  },   // one-time
  single: { optimize: 10, ats: 10, import: 5,  coverLetter: 3  },   // one-time, per template purchase
  pro:    { optimize: 20, ats: 10, import: 10, coverLetter: 10 },   // per day
}

/** Format USD cents as "$6.99". */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
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
// Payment removed — everyone is treated as an unlimited subscriber so all
// Pro templates, watermark-free export and AI features are open to all.
export function getProStatus(_deviceId: string, _resumeId?: string): ProStatus {
  return {
    kind: 'subscription',
    plan: 'monthly',
    expiresAt: Number.MAX_SAFE_INTEGER,
  }
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

export function checkUsage(_deviceId: string, _type: UsageType, _status: ProStatus): UsageCheckResult {
  // Payment/quotas removed — everything is unlimited.
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
export function canUseProTemplate(_status: ProStatus): boolean {
  return true
}

/** Returns true when PDF download should have no watermark. */
export function hasNoWatermark(_status: ProStatus): boolean {
  return true
}
