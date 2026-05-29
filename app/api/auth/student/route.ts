import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/jwt'
import { getUserCollection } from '../../../lib/mongodb'

// POST /api/auth/student — record student verification for logged-in user
export async function POST(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json() as { email?: string }
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

  const openid = payload.openid as string
  const now = Date.now()
  const users = await getUserCollection()
  await users.updateOne(
    { openid },
    { $set: { student: { email, certified_at: now, expires_at: now + 365 * 86_400_000 }, updated_at: now } }
  )
  return NextResponse.json({ ok: true })
}
