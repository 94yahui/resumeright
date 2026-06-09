import { NextRequest, NextResponse } from 'next/server'
import { getDailyUsageCollection, getUserCollection } from '../../lib/mongodb'
import { verifyToken } from '../../lib/jwt'

const ALLOWED_HOSTS = ['jianliquankai.com', '.vercel.app', 'localhost']

// In-memory per-IP rate limit: 30 req/min
const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS  = 60_000

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function isOriginAllowed(req: NextRequest): boolean {
  const ref = req.headers.get('referer') || req.headers.get('origin') || ''
  return ALLOWED_HOSTS.some(h => ref.includes(h))
}

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now >= entry.resetAt) { ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return true }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function todayStr() { return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10) }

// ── Document key conventions ──────────────────────────────────────────────────
// Logged-in users (any plan):  "u_{openid}_{YYYY-MM-DD}"
//   fields: { analyze, translate, import, compress, createdAt, updatedAt }
// Guest users (no token):      "d_{deviceId}_{YYYY-MM-DD}"
//   fields: { import, createdAt, updatedAt }
//
// Free-user analyze is a lifetime counter tracked on the users document
// (users.free_analyze_used), not in daily_usage.

const FIELD: Record<string, string> = {
  'analyze':      'analyze',
  'translate':    'translate',
  'compress':     'compress',
  'parse-resume': 'import',
  'ats-score':    'ats_score',
}

// Daily limits per plan (0 = blocked, -1 = uses lifetime counter on users doc)
// guest = not logged in (tracked by deviceId); free = logged-in non-paying user
const LIMITS: Record<string, { subscriber: number; single: number; free: number; guest?: number }> = {
  'analyze':      { subscriber: 20, single: -1, free: -1 },
  'translate':    { subscriber: 5,  single: 0,  free: 0  },
  'compress':     { subscriber: 20, single: 0,  free: 0  },
  'parse-resume': { subscriber: 10, single: 2,  free: 2,  guest: 1 },
  'ats-score':    { subscriber: 5,  single: 3,  free: 2  },
}

// Config for types that use lifetime counters for non-subscriber plans
// freePlanDaily: true means free users use daily counter instead of lifetime
interface LifetimeCfg {
  guestDocId: (deviceId: string) => string
  freeField: string; singleField: string
  guestLimit: number; freeLimit: number; singleLimit: number
  guestErr: (fl: number) => string; freeErr: (l: number) => string; singleErr: () => string
  freePlanDaily?: boolean
  singlePlanDaily?: boolean
}
const LIFETIME: Record<string, LifetimeCfg> = {
  'analyze': {
    guestDocId: d => `guest_analyze_${d}`,
    freeField: 'free_analyze_used', singleField: 'single_analyze_used',
    guestLimit: 1, freeLimit: 2, singleLimit: 5,
    guestErr: fl => `免费次数已用完，登录后可再用 ${fl} 次，升级 Pro 可享每日 20 次。`,
    freeErr:  l  => `已用完 ${l} 次免费 AI 优化，升级 Pro 可享每天 20 次。`,
    singleErr:() => `单次购买的 AI 优化（5 次）已用完，升级 Pro 可享每天 20 次。`,
  },
  'ats-score': {
    guestDocId: d => `guest_ats_${d}`,
    freeField: 'free_ats_used', singleField: 'single_ats_used',
    guestLimit: 1, freeLimit: 2, singleLimit: 5,
    guestErr: fl => `ATS检测免费次数已用完，登录后每天可用 ${fl} 次，升级 Pro 可享每日 5 次。`,
    freeErr:  l  => `已用完 ${l} 次免费 ATS 检测，升级 Pro 可享每天 5 次。`,
    singleErr:() => `单次购买的 ATS 检测（5 次）已用完，升级 Pro 可享每天 5 次。`,
    freePlanDaily: true,
    singlePlanDaily: true,
  },
}

// Keep legacy constants for external references
const GUEST_ANALYZE_LIFETIME_LIMIT = 1  // not-logged-in, keyed by deviceId
const FREE_ANALYZE_LIFETIME_LIMIT  = 2  // logged-in free users

// ── TTL index (7 days) — created once, MongoDB auto-deletes old docs ──────────
let _ttlReady = false
async function ensureTTLIndex() {
  if (_ttlReady) return
  try {
    const col = await getDailyUsageCollection()
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 })
    _ttlReady = true
  } catch {}
}

// ── Plan lookup ───────────────────────────────────────────────────────────────
type PlanKind = 'subscriber' | 'single' | 'free'

async function getPlanKind(openid: string): Promise<PlanKind> {
  try {
    const users = await getUserCollection()
    const user = await users.findOne({ openid }, { projection: { membership: 1 } })
    if (!user?.membership) return 'free'
    const m = user.membership as { plan: string; expires_at?: number }
    if (m.plan === 'single') return 'single'
    if (!m.expires_at || m.expires_at > Date.now()) return 'subscriber'
    return 'free'
  } catch {
    return 'free'
  }
}

// ── Public read helpers ───────────────────────────────────────────────────────

/** Today's usage for a logged-in user — single document, all features. */
export async function getDailyUsageCounts(openid: string): Promise<{ analyze: number; translate: number; import: number; compress: number; ats_score: number }> {
  try {
    const col = await getDailyUsageCollection()
    const doc = await col.findOne({ _id: `u_${openid}_${todayStr()}` }) as Record<string, unknown> | null
    return {
      analyze:   (doc?.analyze   as number) ?? 0,
      translate: (doc?.translate as number) ?? 0,
      import:    (doc?.import    as number) ?? 0,
      compress:  (doc?.compress  as number) ?? 0,
      ats_score: (doc?.ats_score as number) ?? 0,
    }
  } catch {
    return { analyze: 0, translate: 0, import: 0, compress: 0, ats_score: 0 }
  }
}

/** Today's import count for a guest user (keyed by deviceId). */
export async function getDeviceImportCount(deviceId: string): Promise<number> {
  if (!deviceId) return 0
  try {
    const col = await getDailyUsageCollection()
    const doc = await col.findOne({ _id: `d_${deviceId}_${todayStr()}` }) as Record<string, unknown> | null
    return (doc?.import as number) ?? 0
  } catch {
    return 0
  }
}

// ── Guards ────────────────────────────────────────────────────────────────────

export function guardAI(req: NextRequest, deviceId: unknown): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  if (!isOriginAllowed(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 10)
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  if (!checkIpRateLimit(getClientIp(req)))
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  return null
}

export async function checkServerQuota(req: NextRequest, type: string, deviceId: string): Promise<NextResponse | null> {
  if (!deviceId || deviceId.length < 10) return null

  void ensureTTLIndex()

  const field = FIELD[type]
  const cfg   = LIMITS[type]
  if (!field || !cfg) return null

  try {
    const token   = req.cookies.get('rc_token')?.value
    const payload = token ? verifyToken(token) : null
    const openid  = payload?.openid as string | undefined
    const plan: PlanKind = openid ? await getPlanKind(openid) : 'free'

    // ── Lifetime-counter types (analyze, ats-score) for non-subscribers ──
    const ltCfg = LIFETIME[type]
    if (ltCfg && plan !== 'subscriber') {
      if (!openid) {
        const col = await getDailyUsageCollection()
        const existing = await col.findOne({ _id: ltCfg.guestDocId(deviceId) }) as Record<string, unknown> | null
        const used = (existing?.count as number) ?? 0
        if (used >= ltCfg.guestLimit) {
          return NextResponse.json({ error: ltCfg.guestErr(ltCfg.freeLimit) }, { status: 429 })
        }
        return null
      }
      const users = await getUserCollection()
      if (plan === 'single' && !ltCfg.singlePlanDaily) {
        const user = await users.findOne({ openid }, { projection: { [ltCfg.singleField]: 1 } }) as Record<string, unknown> | null
        const used = (user?.[ltCfg.singleField] as number) ?? 0
        if (used >= ltCfg.singleLimit) {
          return NextResponse.json({ error: ltCfg.singleErr() }, { status: 429 })
        }
        return null
      }
      if (plan === 'single') {
        // singlePlanDaily: fall through to daily limits below
      } else if (!ltCfg.freePlanDaily) {
        const user = await users.findOne({ openid }, { projection: { [ltCfg.freeField]: 1 } }) as Record<string, unknown> | null
        const used = (user?.[ltCfg.freeField] as number) ?? 0
        if (used >= ltCfg.freeLimit) {
          return NextResponse.json({ error: ltCfg.freeErr(ltCfg.freeLimit) }, { status: 429 })
        }
        return null
      }
      // freePlanDaily: fall through to daily limits below
    }

    // ── Daily limits ──
    const limit = plan === 'subscriber' ? cfg.subscriber
      : plan === 'single'               ? cfg.single
      : !openid && cfg.guest !== undefined ? cfg.guest
      :                                   cfg.free
    if (limit === 0) return NextResponse.json({ error: '该功能需要 Pro 订阅会员。' }, { status: 403 })

    const key = openid ? `u_${openid}_${todayStr()}` : `d_${deviceId}_${todayStr()}`
    const col = await getDailyUsageCollection()

    const existing = await col.findOne({ _id: key }, { projection: { [field]: 1 } }) as Record<string, unknown> | null
    const current  = (existing?.[field] as number) ?? 0

    if (current >= limit) {
      const hint = !openid ? '登录后可获得更多次数。' : '明天再来吧。'
      return NextResponse.json(
        { error: `今日使用次数已达上限（${limit} 次/天），${hint}` },
        { status: 429 },
      )
    }
  } catch (e) {
    console.warn('checkServerQuota error (fail open):', e)
  }
  return null
}

// Call this after a successful AI response — only then does the usage count.
export async function incrementQuota(req: NextRequest, type: string, deviceId: string): Promise<void> {
  if (!deviceId || deviceId.length < 10) return

  const field = FIELD[type]
  const cfg   = LIMITS[type]
  if (!field || !cfg) return

  try {
    const token   = req.cookies.get('rc_token')?.value
    const payload = token ? verifyToken(token) : null
    const openid  = payload?.openid as string | undefined
    const plan: PlanKind = openid ? await getPlanKind(openid) : 'free'

    const ltCfg = LIFETIME[type]
    if (ltCfg && plan !== 'subscriber') {
      if (!openid) {
        const col = await getDailyUsageCollection()
        // No createdAt — must not be expired by 7-day TTL index
        await col.updateOne(
          { _id: ltCfg.guestDocId(deviceId) },
          { $inc: { count: 1 }, $set: { updatedAt: Date.now() } },
          { upsert: true },
        )
        return
      }
      const users = await getUserCollection()
      if (plan === 'single' && !ltCfg.singlePlanDaily) {
        await users.updateOne({ openid }, { $inc: { [ltCfg.singleField]: 1 }, $set: { updated_at: Date.now() } })
        return
      }
      if (plan !== 'single' && !ltCfg.freePlanDaily) {
        await users.updateOne({ openid }, { $inc: { [ltCfg.freeField]: 1 }, $set: { updated_at: Date.now() } })
        return
      }
      // freePlanDaily: fall through to daily increment below
    }

    const limit = plan === 'subscriber' ? cfg.subscriber
      : plan === 'single'               ? cfg.single
      : !openid && cfg.guest !== undefined ? cfg.guest
      :                                   cfg.free
    if (limit === 0) return

    const key = openid ? `u_${openid}_${todayStr()}` : `d_${deviceId}_${todayStr()}`
    const col = await getDailyUsageCollection()
    await col.updateOne(
      { _id: key },
      {
        $inc: { [field]: 1 },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true },
    )
  } catch (e) {
    console.warn('incrementQuota error (fail open):', e)
  }
}
