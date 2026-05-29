import { createHash } from 'crypto'

const WECHAT_TOKEN = process.env.WECHAT_TOKEN ?? ''

// ── Signature verification (GET handler) ─────────────────────────────────────
export function verifyWechatSignature(signature: string, timestamp: string, nonce: string): boolean {
  const str  = [WECHAT_TOKEN, timestamp, nonce].sort().join('')
  const hash = createHash('sha1').update(str).digest('hex')
  return hash === signature
}

// ── XML parse (WeChat sends XML in POST body) ─────────────────────────────────
export function parseWechatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const m of xml.matchAll(/<(\w+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g)) {
    result[m[1]] = m[2].trim()
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

// ── Generate login code ───────────────────────────────────────────────────────
// e.g. "RC-A1B2C3" — 6 chars, uppercase alphanumeric, excludes confusable chars
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateLoginCode(): string {
  let code = ''
  const arr = new Uint8Array(6)
  // Node crypto fallback for server context
  for (let i = 0; i < 6; i++) arr[i] = Math.floor(Math.random() * CHARS.length)
  for (const b of arr) code += CHARS[b % CHARS.length]
  return `RC-${code}`
}
