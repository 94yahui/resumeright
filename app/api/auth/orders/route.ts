import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/jwt'
import { getOrderCollection } from '../../../lib/mongodb'

const PLAN_LABELS: Record<string, string> = {
  single:    '单次解锁',
  monthly:   '月卡',
  quarterly: '季卡',
  yearly:    '年卡',
  trial7:    '7天体验卡',
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const openid = payload.openid as string

  try {
    const col = await getOrderCollection()
    const orders = await col
      .find({ openid, status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json({
      orders: orders.map(o => ({
        orderId:    o._id,
        planType:   o.planType,
        planLabel:  PLAN_LABELS[o.planType as string] ?? o.planType,
        amountFen:  o.amountFen,
        isStudent:  o.isStudent,
        paidAt:     o.paidAt,
        resumeId:   o.resumeId   ?? null,
        templateId: o.templateId ?? null,
      })),
    })
  } catch (e) {
    console.error('[auth/orders]', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
