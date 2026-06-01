import { NextRequest, NextResponse } from 'next/server'
import { hpjQuery } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'
import { syncMembershipFromOrder } from '../../../lib/syncMembership'

// Polled by frontend every 2s while QR code is shown
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'missing orderId' }, { status: 400 })

  const col   = await getOrderCollection()
  const order = await col.findOne({ _id: orderId })
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 })

  // Already confirmed by webhook
  if (order.status === 'paid') {
    return NextResponse.json({ paid: true, order })
  }

  // Double-check with 虎皮椒 in case webhook hasn't fired yet
  const result = await hpjQuery(orderId)
  if (result.paid) {
    const paidAt = Date.now()
    const updateResult = await col.updateOne(
      { _id: orderId, status: { $ne: 'paid' } },
      { $set: { status: 'paid', paidAt, wxTransactionId: result.transactionId } },
    )
    // Only sync if we were the first to confirm payment (webhook may have beaten us)
    if (updateResult.modifiedCount > 0) {
      await syncMembershipFromOrder(order, paidAt)
    }
    return NextResponse.json({ paid: true, order: { ...order, status: 'paid', paidAt } })
  }

  return NextResponse.json({ paid: false })
}
