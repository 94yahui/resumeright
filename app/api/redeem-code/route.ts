import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../lib/jwt'

export type PlanType = 'monthly' | 'quarterly' | 'yearly' | 'trial7'

export interface PromoRecord {
  plan: PlanType
  label?: string
  createdAt: number
  usedAt?: number
}

// ── Dev fallback: PROMO_CODES env var (unlimited use, no DB needed) ──────────
interface EnvCodeConfig { code: string; plan: PlanType; label?: string }

function lookupEnvCode(code: string): EnvCodeConfig | null {
  try {
    const list: EnvCodeConfig[] = JSON.parse(process.env.PROMO_CODES ?? '[]')
    return list.find(c => c.code.toUpperCase() === code.toUpperCase()) ?? null
  } catch { return null }
}

// ── POST /api/redeem-code ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Require login so the plan is persisted to the user account (not just localStorage)
  const token = req.cookies.get('rc_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) {
    return NextResponse.json({ valid: false, error: '请先登录后再兑换' }, { status: 401 })
  }
  const openid = payload.openid as string

  const body = await req.json()
  const code: string = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code) {
    return NextResponse.json({ valid: false, error: '无效请求' }, { status: 400 })
  }

  if (!process.env.MONGODB_URI) {
    // Local dev: fall back to env var list (unlimited use)
    const match = lookupEnvCode(code)
    if (!match) return NextResponse.json({ valid: false, error: '兑换码无效或已过期' })
    return NextResponse.json({ valid: true, plan: match.plan, label: match.label ?? null })
  }

  // Production: MongoDB single-use
  const { getPromoCollection, getUserCollection } = await import('../../lib/mongodb')
  const col = await getPromoCollection()

  const doc = await col.findOne({ _id: code })
  if (!doc) return NextResponse.json({ valid: false, error: '兑换码无效或已过期' })
  if (doc.usedAt) return NextResponse.json({ valid: false, error: '此兑换码已被使用' })

  const now = Date.now()
  // Atomic claim: only succeeds if usedAt is still unset, preventing concurrent redemptions.
  const claimResult = await col.updateOne(
    { _id: code, usedAt: { $exists: false } },
    { $set: { usedAt: now } },
  )
  if (claimResult.modifiedCount === 0) {
    return NextResponse.json({ valid: false, error: '此兑换码已被使用' })
  }

  // Persist membership to user doc (openid always present — login required above)
  const { PLAN_DURATION_MS } = await import('../../lib/payment')
  const users = await getUserCollection()
  let expiresAt: number | undefined
  if (PLAN_DURATION_MS[doc.plan]) {
    const existing = await users.findOne({ openid }, { projection: { membership: 1 } })
    const m = existing?.membership as { plan?: string; expires_at?: number } | null
    const currentExpiry = (m && m.plan !== 'single' && m.expires_at) ? m.expires_at : 0
    expiresAt = Math.max(currentExpiry, now) + PLAN_DURATION_MS[doc.plan]
  }
  await users.updateOne(
    { openid },
    { $set: { membership: { plan: doc.plan, purchased_at: now, expires_at: expiresAt }, updated_at: now } }
  )

  return NextResponse.json({ valid: true, plan: doc.plan, label: doc.label ?? null })
}
