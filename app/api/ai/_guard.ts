import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['jianliquankai.com', '.vercel.app', 'localhost']

// In-memory per-IP rate limit: 30 requests/minute
const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function isOriginAllowed(req: NextRequest): boolean {
  const ref = req.headers.get('referer') || req.headers.get('origin') || ''
  return ALLOWED_HOSTS.some(h => ref.includes(h))
}

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now >= entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Returns an error NextResponse if the request should be blocked, null if OK.
export function guardAI(req: NextRequest, deviceId: unknown): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && !isOriginAllowed(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 10) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  }
  if (!checkIpRateLimit(getClientIp(req))) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }
  return null
}
