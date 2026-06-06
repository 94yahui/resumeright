import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { hpjCreate } from '../../../lib/hupijiao'
import { getOrderCollection } from '../../../lib/mongodb'
import { verifyToken } from '../../../lib/jwt'
import type { PlanType } from '../../../lib/payment'

// Server-authoritative prices (fen). Must stay in sync with client PRICES in payment.ts.
const PLAN_PRICES: Record<string, { normal: number; student: number }> = {
  monthly:   { normal: 2900, student: 1490 },
  quarterly: { normal: 6900, student: 3490 },
  yearly:    { normal: 16800, student: 8400 },
  single:    { normal: 990,  student: 490  },
}
const FIRST_ORDER_PRICE = 99  // ¥0.99 for anyone's very first purchase

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { orderId, planType, isStudent, deviceId, resumeId, templateId, title } = body as {
    orderId: string
    planType: PlanType
    isStudent: boolean
    deviceId: string
    resumeId?: string
    templateId?: string
    title: string
  }

  if (!orderId || !planType || !deviceId) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }
  if (!PLAN_PRICES[planType] && planType !== 'trial7') {
    return NextResponse.json({ error: '无效套餐' }, { status: 400 })
  }

  const col = await getOrderCollection()

  // Determine first purchase server-side — never trust client flag
  const pastCount = await col.countDocuments({ deviceId, status: 'paid' })
  const isFirstOrder = pastCount === 0

  // Calculate price server-side — ignore client-provided amountFen
  let amountFen: number
  if (planType === 'single' && isFirstOrder) {
    amountFen = FIRST_ORDER_PRICE
  } else if (planType === 'trial7') {
    amountFen = isStudent ? PLAN_PRICES.monthly.student : PLAN_PRICES.monthly.normal
  } else {
    const prices = PLAN_PRICES[planType]
    amountFen = isStudent ? prices.student : prices.normal
  }

  // Attach openid if user is logged in — enables cross-device order sync
  const token = req.cookies.get('rc_token')?.value
  const openid = token ? ((verifyToken(token)?.openid as string) ?? undefined) : undefined

  const host      = req.headers.get('host') ?? ''
  const proto     = host.startsWith('localhost') ? 'http' : 'https'
  const base      = `${proto}://${host}`
  const notifyUrl = `${base}/api/payment/notify`
  const returnUrl = `${base}/editor`

  // Store order in MongoDB before calling payment gateway
  await col.insertOne({
    _id: orderId, openid, deviceId, planType, amountFen, isStudent,
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

  return NextResponse.json({ qrDataUrl, payUrl: result.url, orderId, amountFen })
}
