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
  const { getPromoCollection } = await import('../../lib/mongodb')
  const col = await getPromoCollection()

  const doc = await col.findOne({ _id: code })
  if (!doc) return NextResponse.json({ valid: false, error: '兑换码无效或已过期' })
  if (doc.usedAt) return NextResponse.json({ valid: false, error: '此兑换码已被使用' })

  const now = Date.now()
  await col.updateOne({ _id: code }, { $set: { usedAt: now } })

  // If logged in, persist the membership to the user doc so it syncs across devices
  const token = req.cookies.get('rc_token')?.value
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      const { getUserCollection } = await import('../../lib/mongodb')
      const { PLAN_DURATION_MS } = await import('../../lib/payment')
      const users = await getUserCollection()
      const expiresAt = PLAN_DURATION_MS[doc.plan] ? now + PLAN_DURATION_MS[doc.plan] : undefined
      await users.updateOne(
        { openid: payload.openid as string },
        { $set: { membership: { plan: doc.plan, purchased_at: now, expires_at: expiresAt }, updated_at: now } }
      )
    }
  }

  return NextResponse.json({ valid: true, plan: doc.plan, label: doc.label ?? null })
}
