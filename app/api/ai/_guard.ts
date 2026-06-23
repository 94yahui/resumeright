import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// AI request guard.
//
// Membership/payment quotas have been removed — every visitor gets unlimited
// access. We keep a lightweight per-IP rate limit and a deviceId sanity check to
// protect the AI endpoints from abuse. The quota helpers are kept as no-op stubs
// so the AI routes that import them keep working unchanged.
// ─────────────────────────────────────────────────────────────────────────────

// In-memory per-IP rate limit: 30 req/min
const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now >= entry.resetAt) { ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return true }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export function guardAI(req: NextRequest, deviceId: unknown): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 10)
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  if (!checkIpRateLimit(getClientIp(req)))
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  return null
}

// Quotas removed — unlimited access for everyone.
export async function checkServerQuota(_req: NextRequest, _type: string, _deviceId: string): Promise<NextResponse | null> {
  return null
}

export async function incrementQuota(_req: NextRequest, _type: string, _deviceId: string): Promise<void> {
  // no-op: usage is no longer metered
}

// Kept for backward compatibility with any remaining callers.
export async function getDailyUsageCounts(_openid: string): Promise<{ analyze: number; import: number; compress: number; ats_score: number }> {
  return { analyze: 0, import: 0, compress: 0, ats_score: 0 }
}

export async function getDeviceImportCount(_deviceId: string): Promise<number> {
  return 0
}
