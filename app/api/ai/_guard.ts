import { NextRequest, NextResponse } from 'next/server'
import { getDailyUsageCollection, getOrderCollection } from '../../lib/mongodb'

const ALLOWED_HOSTS = ['jianliquankai.com', '.vercel.app', 'localhost']

// In-memory per-IP rate limit: 30 requests/minute
const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

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
  if (!entry || now >= entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Pro status lookup ──────────────────────────────────────────────────────────
const PLAN_MS: Record<string, number> = {
  monthly:   30 * 86_400_000,
  quarterly: 90 * 86_400_000,
  yearly:    365 * 86_400_000,
  trial7:    7  * 86_400_000,
}

type PlanKind = 'subscriber' | 'single' | 'free'

async function getPlanKind(deviceId: string): Promise<PlanKind> {
  try {
    const col = await getOrderCollection()
    const orders = await col.find({ deviceId, status: 'paid' }).toArray()
    const now = Date.now()
    const hasActiveSub = orders.some(o => {
      if (o.planType === 'single') return false
      const dur = PLAN_MS[o.planType] ?? 0
      return (o.paidAt ?? 0) + dur > now
    })
    if (hasActiveSub) return 'subscriber'
    if (orders.some(o => o.planType === 'single')) return 'single'
  } catch (e) {
    console.warn('getPlanKind error (fail open):', e)
  }
  return 'free'
}

// ── Per-feature quota table ────────────────────────────────────────────────────
// Limits per plan kind. 0 = feature blocked.
// analyze: single & free use a lifetime total (date key = 'total'); subscriber uses daily.
const LIMITS: Record<string, { sub: number; single: number; free: number }> = {
  analyze:          { sub: 20, single: 5, free: 2 },
  translate:        { sub: 5,  single: 0, free: 0 },
  compress:         { sub: 20, single: 0, free: 0 },
  'parse-resume':   { sub: 10, single: 2, free: 2 },
}

// ── MongoDB-backed per-device quota check ─────────────────────────────────────
export async function checkServerQuota(req: NextRequest, type: string, deviceId: string): Promise<NextResponse | null> {
  if (!deviceId || deviceId.length < 10) return null
  try {
    const kind = await getPlanKind(deviceId)
    const cfg = LIMITS[type]
    if (!cfg) return null

    const limit = kind === 'subscriber' ? cfg.sub : kind === 'single' ? cfg.single : cfg.free
    if (limit === 0) {
      return NextResponse.json({ error: '该功能需要 Pro 订阅会员。' }, { status: 403 })
    }

    // analyze for non-subscribers is a lifetime counter (never resets)
    const useLifetime = type === 'analyze' && kind !== 'subscriber'
    const date = useLifetime ? 'total' : new Date().toISOString().slice(0, 10)
    const key = `${deviceId}_${type}_${date}`

    const col = await getDailyUsageCollection()
    const doc = await col.findOneAndUpdate(
      { _id: key },
      {
        $inc: { count: 1 },
        $setOnInsert: { deviceId, ip: getClientIp(req), type, date },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true, returnDocument: 'after' },
    )
    if ((doc?.count ?? 1) > limit) {
      const msg = useLifetime
        ? `已用完 ${limit} 次免费 AI 优化，升级 Pro 可享每天 20 次。`
        : `今日使用次数已达上限（${limit} 次/天），明天再来吧。`
      return NextResponse.json({ error: msg }, { status: 429 })
    }
  } catch (e) {
    console.warn('checkServerQuota error (fail open):', e)
  }
  return null
}

// ── Synchronous pre-flight guard ──────────────────────────────────────────────
export function guardAI(req: NextRequest, deviceId: unknown): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && !isOriginAllowed(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 10) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  }
  if (!checkIpRateLimit(getClientIp(req))) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }
  return null
}
