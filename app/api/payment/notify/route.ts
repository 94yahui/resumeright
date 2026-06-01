import { NextRequest, NextResponse } from 'next/server'
import { hpjVerify } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'
import { syncMembershipFromOrder } from '../../../lib/syncMembership'

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
  const updateResult = await col.updateOne(
    { _id: orderId, status: 'pending' },
    { $set: { status: 'paid', paidAt, wxTransactionId: txId } },
  )

  // Only sync membership if this webhook was the first to mark the order paid.
  // Skipping on retry prevents duplicate webhook calls from extending the subscription.
  if (updateResult.modifiedCount > 0) {
    const order = await col.findOne({ _id: orderId })
    await syncMembershipFromOrder(order ?? {}, paidAt)
  }

  return new NextResponse('success')
}
