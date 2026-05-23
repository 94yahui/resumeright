import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { hpjCreate } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'
import type { PlanType } from '../../../lib/payment'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { orderId, planType, amountFen, isStudent, deviceId, resumeId, templateId, title } = body as {
    orderId: string
    planType: PlanType
    amountFen: number
    isStudent: boolean
    deviceId: string
    resumeId?: string
    templateId?: string
    title: string
  }

  if (!orderId || !planType || !amountFen || !deviceId) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  const host      = req.headers.get('host') ?? ''
  const proto     = host.startsWith('localhost') ? 'http' : 'https'
  const base      = `${proto}://${host}`
  const notifyUrl = `${base}/api/payment/notify`
  const returnUrl = `${base}/editor`

  // Store order in MongoDB before calling payment gateway
  const col = await getOrderCollection()
  await col.insertOne({
    _id: orderId, deviceId, planType, amountFen, isStudent,
    resumeId, templateId,
    status: 'pending', createdAt: Date.now(),
  })

  const result = await hpjCreate({ orderId, amountFen, title, notifyUrl, returnUrl })
  if (!result.ok) {
    await col.deleteOne({ _id: orderId })
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  // Generate QR from the payment page URL — WeChat scans it and pays directly
  const qrDataUrl = await QRCode.toDataURL(result.url!, {
    width: 220, margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return NextResponse.json({ qrDataUrl, payUrl: result.url, orderId })
}
