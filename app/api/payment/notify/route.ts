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

  const col = await getOrderCollection()
  await col.updateOne(
    { _id: orderId, status: 'pending' },
    { $set: { status: 'paid', paidAt: Date.now(), wxTransactionId: txId } },
  )

  return new NextResponse('success')
}
