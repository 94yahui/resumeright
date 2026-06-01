import { createHash } from 'crypto'

const WECHAT_TOKEN   = process.env.WECHAT_TOKEN ?? ''
const WECHAT_APPID   = process.env.WECHAT_APPID ?? ''
const WECHAT_SECRET  = process.env.WECHAT_APPSECRET ?? ''

// ── Access-token cache (expires in 7200 s, refresh 60 s early) ───────────────
let _cachedToken = ''
let _tokenExpiresAt = 0

export async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt) return _cachedToken
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`
  const res  = await fetch(url)
  const json = await res.json() as { access_token?: string; expires_in?: number; errcode?: number }
  if (!json.access_token) throw new Error(`WeChat token error: ${JSON.stringify(json)}`)
  _cachedToken    = json.access_token
  _tokenExpiresAt = Date.now() + ((json.expires_in ?? 7200) - 60) * 1000
  return _cachedToken
}

export async function fetchWechatUserInfo(openid: string): Promise<{ nickname: string; avatar: string } | null> {
  try {
    const token = await getAccessToken()
    const url   = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`
    const res   = await fetch(url)
    const json  = await res.json() as { nickname?: string; headimgurl?: string; errcode?: number }
    if (json.errcode || !json.nickname) return null
    return { nickname: json.nickname, avatar: json.headimgurl ?? '' }
  } catch {
    return null
  }
}

// ── Signature verification (GET handler) ─────────────────────────────────────
export function verifyWechatSignature(signature: string, timestamp: string, nonce: string): boolean {
  const str  = [WECHAT_TOKEN, timestamp, nonce].sort().join('')
  const hash = createHash('sha1').update(str).digest('hex')
  return hash === signature
}

// ── XML parse (WeChat sends XML in POST body) ─────────────────────────────────
// 注意：不能用单条可选 CDATA 正则，外层 <xml> 会优先匹配并吞掉整个文档。
// 改为两条各自严格的正则：
//   1. CDATA 标签：<Tag><![CDATA[...]]></Tag>  — 外层 <xml> 内容以 < 开头，匹配不上 <![CDATA[，跳过
//   2. 纯文本标签：<Tag>数字/文本</Tag>         — [^<]+ 要求内容里无 <，外层 <xml> 自然排除
export function parseWechatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const m of xml.matchAll(/<(\w+)><!\[CDATA\[([\s\S]*?)\]\]><\/\1>/g)) {
    result[m[1]] = m[2]
  }
  for (const m of xml.matchAll(/<(\w+)>([^<]+)<\/\1>/g)) {
    if (!result[m[1]]) result[m[1]] = m[2].trim()
  }
  return result
}

// ── Build text reply XML ──────────────────────────────────────────────────────
export function buildTextReply(toOpenId: string, fromAppId: string, content: string): string {
  return `<xml>
<ToUserName><![CDATA[${toOpenId}]]></ToUserName>
<FromUserName><![CDATA[${fromAppId}]]></FromUserName>
<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
}

