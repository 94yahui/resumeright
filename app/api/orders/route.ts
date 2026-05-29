import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../lib/jwt'
import { getOrderCollection } from '../../lib/mongodb'

// GET /api/orders — fetch all paid orders for the logged-in user
export async function GET(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const openid = payload.openid as string
  const col = await getOrderCollection()
  const orders = await col.find({ openid, status: 'paid' }).toArray()
  return NextResponse.json(orders)
}
