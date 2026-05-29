import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/jwt'
import { getUserCollection } from '../../../lib/mongodb'

// GET /api/auth/me — 前端用于检查是否已登录，返回用户基本信息
export async function GET(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ logged_in: false })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ logged_in: false })

  const openid = payload.openid as string
  const users  = await getUserCollection()
  const user   = await users.findOne({ openid })
  if (!user) return NextResponse.json({ logged_in: false })

  return NextResponse.json({
    logged_in: true,
    openid,
    membership: user.membership ?? null,
  })
}

// POST /api/auth/me/logout — 清除 cookie
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('rc_token', '', { maxAge: 0, path: '/' })
  return res
}
