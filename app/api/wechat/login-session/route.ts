import { NextRequest, NextResponse } from 'next/server'
import { generateLoginCode } from '../../../lib/wechat'
import { getLoginSessionCollection, getUserCollection } from '../../../lib/mongodb'
import { signToken } from '../../../lib/jwt'

const SESSION_TTL_MS = 10 * 60 * 1000  // 10 分钟

// ── POST /api/wechat/login-session ───────────────────────────────────────────
// 前端打开登录弹窗时调用，返回登录码供用户发给公众号
export async function POST() {
  const code = generateLoginCode()
  const now  = Date.now()

  const sessions = await getLoginSessionCollection()
  await sessions.insertOne({
    _id: code,
    status: 'pending',
    created_at: now,
    expires_at: now + SESSION_TTL_MS,
  })

  return NextResponse.json({ code, expires_in: SESSION_TTL_MS / 1000 })
}

// ── GET /api/wechat/login-session?code=RC-XXXXXX ─────────────────────────────
// 前端每 2 秒轮询一次，检查是否已扫码登录
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 })

  const sessions = await getLoginSessionCollection()
  const session  = await sessions.findOne({ _id: code })

  if (!session) return NextResponse.json({ status: 'not_found' }, { status: 404 })
  if (session.expires_at < Date.now()) return NextResponse.json({ status: 'expired' })
  if (session.status === 'pending')    return NextResponse.json({ status: 'pending' })

  // 已认证 — 找到用户，签发 JWT，写入 httpOnly cookie
  const openid = session.openid!
  const users  = await getUserCollection()
  const user   = await users.findOne({ openid })

  // 可选：把前端传来的 deviceId 关联到用户（迁移桥接）
  const deviceId = req.nextUrl.searchParams.get('device_id')
  if (deviceId && user) {
    await users.updateOne(
      { openid },
      { $addToSet: { device_ids: deviceId }, $set: { updated_at: Date.now() } }
    )
  }

  const token = signToken({ openid, uid: user?._id?.toString() ?? openid })

  // 用完即删，防止重复轮询拿 token
  await sessions.deleteOne({ _id: code })

  const res = NextResponse.json({ status: 'authenticated' })
  res.cookies.set('rc_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,  // 30 天
    path: '/',
  })
  return res
}
