import { NextRequest, NextResponse } from 'next/server'
import { getLoginCodeCollection, getUserCollection } from '../../../lib/mongodb'
import { signToken } from '../../../lib/jwt'

// POST /api/auth/verify-login-code
// body: { code: string, device_id?: string }
export async function POST(req: NextRequest) {
  const { code, device_id } = await req.json() as { code?: string; device_id?: string }

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: '请输入6位数字登录码' }, { status: 400 })
  }

  const codes = await getLoginCodeCollection()
  const now = Date.now()
  const record = await codes.findOne({ code })

  if (!record) {
    return NextResponse.json({ error: '登录码无效，请重新发送「登录」获取' }, { status: 400 })
  }
  if (record.expires_at < now) {
    await codes.deleteOne({ _id: record._id })
    return NextResponse.json({ error: '登录码已过期，请重新发送「登录」获取' }, { status: 400 })
  }

  const openid = record._id  // openid is the document _id
  const users  = await getUserCollection()

  if (device_id) {
    await users.updateOne(
      { openid },
      { $addToSet: { device_ids: device_id }, $set: { updated_at: now } }
    )
  }

  const user  = await users.findOne({ openid })
  const token = signToken({ openid, uid: user?._id?.toString() ?? openid })

  await codes.deleteOne({ _id: openid })  // 用完即删

  const res = NextResponse.json({ ok: true })
  res.cookies.set('rc_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,  // 30 天
    path: '/',
  })
  return res
}
