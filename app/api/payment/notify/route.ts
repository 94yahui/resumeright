import { NextRequest, NextResponse } from 'next/server'
import { hpjVerify } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'

// 虎皮椒 POST callback when payment succeeds
export async function POST(req: NextRequest) {
  const text   = await req.text()
  const params = Object.fromEntries(new URLSearchParams(text))

  if (!hpjVerify(params)) {
    return new NextResponse('fail', { status: 400 })
  }

  if (params.status !== 'OD') {
    return new NextResponse('success')   // not yet paid, acknowledge silently
  }

  const orderId = params.trade_order_id
  const txId    = params.transaction_id
  const paidAt  = Date.now()

  const col = await getOrderCollection()
  await col.updateOne(
    { _id: orderId, status: 'pending' },
    { $set: { status: 'paid', paidAt, wxTransactionId: txId } },
  )

  // Sync membership for subscription orders from logged-in users
  const order = await col.findOne({ _id: orderId })
  if (order?.openid && order.planType !== 'single') {
    const { getUserCollection } = await import('../../../lib/mongodb')
    const { PLAN_DURATION_MS } = await import('../../../lib/payment')
    const users = await getUserCollection()
    const expiresAt = PLAN_DURATION_MS[order.planType]
      ? paidAt + PLAN_DURATION_MS[order.planType]
      : undefined
    await users.updateOne(
      { openid: order.openid },
      { $set: { membership: { plan: order.planType, purchased_at: paidAt, expires_at: expiresAt }, updated_at: paidAt } }
    )
  }

  return new NextResponse('success')
}
