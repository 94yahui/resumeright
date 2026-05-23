import { NextRequest, NextResponse } from 'next/server'
import type { PlanType } from '../../redeem-code/route'
import type { PromoDoc } from '../../../lib/mongodb'

function randomCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s.slice(0, 4)}-${s.slice(4)}`
}

const PLAN_PREFIX: Record<PlanType, string> = {
  monthly:   'RCM',
  quarterly: 'RCQ',
  yearly:    'RCY',
  trial7:    'RCT',
}

// POST /api/admin/promo  — generate codes
// Body: { secret, plan, label?, count? }
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'ADMIN_SECRET not set' }, { status: 500 })

  const body = await req.json()
  if (body?.secret !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan: PlanType = body?.plan
  const validPlans: PlanType[] = ['monthly', 'quarterly', 'yearly', 'trial7']
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: `plan must be one of: ${validPlans.join(', ')}` }, { status: 400 })
  }

  const count = Math.min(Math.max(0, Number(body?.count) || 0), 500)
  const label: string | undefined = body?.label || undefined

  // count=0 is used by the admin UI just to verify the secret — return early
  if (count === 0) return NextResponse.json({ codes: [], plan, count: 0 })

  const now = Date.now()
  const { getPromoCollection } = await import('../../../lib/mongodb')
  const col = await getPromoCollection()

  const docs: PromoDoc[] = []
  for (let i = 0; i < count; i++) {
    docs.push({ _id: randomCode(PLAN_PREFIX[plan]), plan, label, createdAt: now })
  }

  await col.insertMany(docs)
  return NextResponse.json({ codes: docs.map(d => d._id), plan, count: docs.length })
}

// GET /api/admin/promo?secret=...&code=...  — look up a code's status
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'ADMIN_SECRET not set' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const code = searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'missing code param' }, { status: 400 })

  const { getPromoCollection } = await import('../../../lib/mongodb')
  const col = await getPromoCollection()

  const doc = await col.findOne({ _id: code })
  if (!doc) return NextResponse.json({ found: false })
  return NextResponse.json({ found: true, ...doc, used: !!doc.usedAt })
}
