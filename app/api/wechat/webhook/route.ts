import { NextRequest, NextResponse } from 'next/server'
import { verifyWechatSignature, parseWechatXml, buildTextReply } from '../../../lib/wechat'
import { getLoginCodeCollection, getUserCollection } from '../../../lib/mongodb'

const APPID = process.env.WECHAT_APPID ?? ''
const CODE_TTL_MS = 5 * 60 * 1000  // 5 分钟

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

  const xml     = await req.text()
  const msg     = parseWechatXml(xml)
  const openid  = msg.FromUserName
  const msgType = msg.MsgType

  // ── 事件：用户关注 ──────────────────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'subscribe') {
    await ensureUser(openid)
    const reply = buildTextReply(openid, APPID,
      '欢迎关注简力全开！\n\n发送「登录」即可获取网页登录码。'
    )
    return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
  }

  // ── 事件：用户取消关注 ──────────────────────────────────────────────────────
  if (msgType === 'event' && msg.Event === 'unsubscribe') {
    return new NextResponse('success')
  }

  // ── 文本消息 ────────────────────────────────────────────────────────────────
  if (msgType === 'text') {
    const content = (msg.Content ?? '').trim()

    if (content === '登录') {
      await ensureUser(openid)
      const code = await issueLoginCode(openid)
      const reply = buildTextReply(openid, APPID,
        `您的登录码是：${code}\n\n请在网页登录框中输入此码，5分钟内有效。`
      )
      return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
    }

    // 其他文字消息
    const reply = buildTextReply(openid, APPID,
      '发送「登录」即可获取网页登录码。'
    )
    return new NextResponse(reply, { headers: { 'Content-Type': 'text/xml' } })
  }

  return new NextResponse('success')
}

// ── 生成并存储登录码（openid 为主键，同时只有一个有效码） ─────────────────────
async function issueLoginCode(openid: string): Promise<string> {
  const codes = await getLoginCodeCollection()
  const now = Date.now()
  const code = String(Math.floor(100000 + Math.random() * 900000))  // 6位数字
  await codes.updateOne(
    { _id: openid },
    { $set: { code, created_at: now, expires_at: now + CODE_TTL_MS } },
    { upsert: true }
  )
  return code
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
