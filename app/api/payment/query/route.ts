import { NextRequest, NextResponse } from 'next/server'
import { hpjQuery } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'

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
    await col.updateOne(
      { _id: orderId },
      { $set: { status: 'paid', paidAt: Date.now(), wxTransactionId: result.transactionId } },
    )
    return NextResponse.json({ paid: true, order: { ...order, status: 'paid', paidAt: Date.now() } })
  }

  return NextResponse.json({ paid: false })
}
