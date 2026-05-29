import { NextRequest, NextResponse } from 'next/server'
import { verifyWechatSignature, parseWechatXml, buildTextReply } from '../../../lib/wechat'
import { getLoginSessionCollection, getUserCollection } from '../../../lib/mongodb'

const APPID = process.env.WECHAT_APPID ?? ''

// ── GET: 微信服务器验证 ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const signature = searchParams.get('signature') ?? ''
  const timestamp = searchParams.get('timestamp') ?? ''
  const nonce     = searchParams.get('nonce') ?? ''
  const echostr   = searchParams.get('echostr') ?? ''

  if (!verifyWechatSignature(signature, timestamp, nonce)) {
    return new NextResponse('forbidden', { status: 403 })
  }
  return new NextResponse(echostr)
}

// ── POST: 接收微信事件/消息 ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const signature = searchParams.get('signature') ?? ''
  const timestamp = searchParams.get('timestamp') ?? ''
  const nonce     = searchParams.get('nonce') ?? ''

  if (!verifyWechatSignature(signature, timestamp, nonce)) {
    return new NextResponse('forbidden', { status: 403 })
  }

  const xml  = await req.text()
  const msg  = parseWechatXml(xml)
  const openid  = msg.FromUserName  // 用户的 OpenID
  const msgType = msg.MsgType       // text | event

  // ── 事件：用户关注 ──────────────────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'subscribe') {
    await ensureUser(openid)
    const reply = buildTextReply(openid, APPID,
      '欢迎关注简力全开！\n\n请将网页上显示的登录码发送给我，即可完成登录。\n\n例如发送：RC-A1B2C3'
    )
    return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
  }

  // ── 事件：用户取消关注 ──────────────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'unsubscribe') {
    return new NextResponse('success')
  }

  // ── 文本消息：匹配登录码 ────────────────────────────────────────────────────
  if (msgType === 'text') {
    const content = (msg.Content ?? '').trim().toUpperCase()

    if (/^RC-[A-Z0-9]{6}$/.test(content)) {
      const sessions = await getLoginSessionCollection()
      const now = Date.now()
      const session = await sessions.findOne({ _id: content, status: 'pending' })

      if (!session) {
        const reply = buildTextReply(openid, APPID, '登录码无效或已过期，请刷新网页重新获取。')
        return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
      }

      if (session.expires_at < now) {
        const reply = buildTextReply(openid, APPID, '登录码已过期，请刷新网页重新获取。')
        return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
      }

      // 标记 session 已认证，写入 openid
      await sessions.updateOne(
        { _id: content },
        { $set: { status: 'authenticated', openid } }
      )

      // 确保用户记录存在
      await ensureUser(openid)

      const reply = buildTextReply(openid, APPID, '✅ 登录成功！请返回网页继续使用。')
      return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
    }

    // 其他文字消息
    const reply = buildTextReply(openid, APPID,
      '请将网页上显示的登录码发送给我（格式：RC-XXXXXX），即可完成登录。'
    )
    return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
  }

  return new NextResponse('success')
}

// ── 首次见到该 openid 时自动建用户记录 ───────────────────────────────────────
async function ensureUser(openid: string) {
  const users = await getUserCollection()
  const now = Date.now()
  await users.updateOne(
    { openid },
    { $setOnInsert: { openid, device_ids: [], created_at: now, updated_at: now } },
    { upsert: true }
  )
}
