import { createHmac } from 'crypto'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod'

export function signToken(payload: Record<string, unknown>, expiresInSecs = 60 * 60 * 24 * 30): string {
  const now = Math.floor(Date.now() / 1000)
  const full = { ...payload, iat: now, exp: now + expiresInSecs }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body   = Buffer.from(JSON.stringify(full)).toString('base64url')
  const sig    = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const expected = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
