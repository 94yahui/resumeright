import { NextRequest, NextResponse } from 'next/server'
import { verifyWechatSignature, parseWechatXml, buildTextReply } from '../../../lib/wechat'
import { getLoginCodeCollection, getUserCollection } from '../../../lib/mongodb'

const CODE_TTL = 5 * 60 * 1000  // 5 分钟

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

  const xml      = await req.text()
  console.log('[wx] raw body:', JSON.stringify(xml.slice(0, 500)))
  const msg      = parseWechatXml(xml)
  const ghid     = msg.ToUserName    // 公众号 gh_xxx，用于回复的 FromUserName
  const openid   = msg.FromUserName  // 用户 openid
  const msgType  = msg.MsgType

  console.log('[wx] parsed:', { ghid, openid, msgType, event: msg.Event, content: msg.Content })

  // ── 事件：用户关注（新用户 or 重新关注） ───────────────────────────────────
  if (msgType === 'event' && msg.Event === 'subscribe') {
    const [code] = await Promise.all([issueLoginCode(openid), ensureUser(openid)])
    return xml_reply(buildTextReply(openid, ghid,
      `🎉 欢迎关注简力全开！\n\n您的登录码是：\n\n${code}\n\n请在网页登录框输入此码，5分钟内有效。\n\n之后需要登录，发送「登录」即可获取新验证码。`
    ))
  }

  // ── 事件：取消关注 ──────────────────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'unsubscribe') {
    return new NextResponse('success')
  }

  // ── 事件：菜单点击「获取登录码」──────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'CLICK' && msg.EventKey === 'GET_LOGIN_CODE') {
    await ensureUser(openid)
    const code = await issueLoginCode(openid)
    return xml_reply(buildTextReply(openid, ghid,
      `👋 欢迎回来！\n\n您的登录码是：\n\n${code}\n\n请在网页登录框输入此码，5分钟内有效。`
    ))
  }

  // ── 文本消息 ────────────────────────────────────────────────────────────────
  if (msgType === 'text') {
    const content = (msg.Content ?? '').trim()

    if (content === '登录') {
      const [code] = await Promise.all([issueLoginCode(openid), ensureUser(openid)])
      return xml_reply(buildTextReply(openid, ghid,
        `👋 欢迎回来！\n\n您的登录码是：\n\n${code}\n\n请在网页登录框输入此码，5分钟内有效。`
      ))
    }

    return xml_reply(buildTextReply(openid, ghid,
      '发送「登录」或点击底部「获取登录码」即可登录网页。'
    ))
  }

  return new NextResponse('success')
}

// ── helpers ──────────────────────────────────────────────────────────────────

function xml_reply(xml: string) {
  console.log('[wx] reply XML:', xml)
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } })
}

async function issueLoginCode(openid: string): Promise<string> {
  const codes = await getLoginCodeCollection()
  const now   = Date.now()
  const code  = String(Math.floor(100000 + Math.random() * 900000))
  await codes.updateOne(
    { _id: openid },
    { $set: { code, created_at: now, expires_at: now + CODE_TTL } },
    { upsert: true }
  )
  return code
}

async function ensureUser(openid: string) {
  const users = await getUserCollection()
  const now   = Date.now()
  await users.updateOne(
    { openid },
    { $setOnInsert: { openid, device_ids: [], created_at: now, updated_at: now } },
    { upsert: true }
  )
}
