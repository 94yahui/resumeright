import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/jwt'
import { getUserCollection } from '../../../lib/mongodb'

// POST /api/auth/free-analyze — increment free AI-analyze counter for logged-in user
export async function POST(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ ok: true }) // silently ignore if not logged in
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ ok: true })

  const openid = payload.openid as string
  const users = await getUserCollection()
  const result = await users.findOneAndUpdate(
    { openid },
    { $inc: { free_analyze_used: 1 }, $set: { updated_at: Date.now() } },
    { returnDocument: 'after' }
  )
  return NextResponse.json({ ok: true, count: result?.free_analyze_used ?? 1 })
}
