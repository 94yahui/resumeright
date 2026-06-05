import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/jwt'
import { getUserCollection } from '../../../lib/mongodb'
import { getDailyUsageCounts } from '../../ai/_guard'

const isProd = process.env.NODE_ENV === 'production'

// GET /api/auth/me — 前端用于检查是否已登录，返回用户基本信息
export async function GET(req: NextRequest) {
  const token = req.cookies.get('rc_token')?.value
  if (!token) return NextResponse.json({ logged_in: false })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ logged_in: false })

  const openid = payload.openid as string
  const tokenSessionId = payload.session_id as string | undefined
  try {
    const users = await getUserCollection()

    // Run user lookup and daily-count fetch in parallel
    const [user, dailyCounts] = await Promise.all([
      users.findOne({ openid }),
      getDailyUsageCounts(openid),
    ])
    if (!user) return NextResponse.json({ logged_in: false })

    // Session invalidation: if DB has a session_id and token's doesn't match
    // (including old tokens without session_id), this device was kicked out by a newer login.
    // Clear cookies immediately so a page refresh doesn't re-trigger the kicked-out modal.
    const dbSessionId = user.session_id
    if (dbSessionId && tokenSessionId !== dbSessionId) {
      const kicked = NextResponse.json({ logged_in: false, kicked_out: true })
      kicked.cookies.set('rc_token', '', { maxAge: 0, path: '/' })
      kicked.cookies.set('rc_mem_hint', '', { maxAge: 0, path: '/' })
      return kicked
    }

    const now = Date.now()
    const isStudent = !!user.student && user.student.expires_at > now
    const membership = user.membership as { plan?: string; expires_at?: number } | null ?? null
    const isSubscriber = !!(membership && membership.plan !== 'single' &&
      (!membership.expires_at || membership.expires_at > now))
    const isSingle = membership?.plan === 'single'
    // All counts come from the single u_{openid}_{date} document.
    // Non-subscriber analyze is a lifetime counter (free_analyze_used), not daily.
    const daily_analyze_used   = isSubscriber ? dailyCounts.analyze   : 0
    const daily_translate_used = isSubscriber ? dailyCounts.translate : 0
    const daily_import_used    = dailyCounts.import  // correct for all logged-in users
    const daily_ats_used       = isSubscriber ? dailyCounts.ats_score : 0

    const res = NextResponse.json({
      logged_in: true,
      openid,
      nickname: (user as Record<string, unknown>).nickname ?? null,
      avatar: (user as Record<string, unknown>).avatar ?? null,
      membership,
      is_student: isStudent,
      free_analyze_used: user.free_analyze_used ?? 0,
      single_analyze_used: isSingle ? ((user as Record<string, unknown>).single_analyze_used as number ?? 0) : 0,
      daily_analyze_used,
      daily_translate_used,
      daily_import_used,
      free_ats_used: (user as Record<string, unknown>).free_ats_used as number ?? 0,
      single_ats_used: isSingle ? ((user as Record<string, unknown>).single_ats_used as number ?? 0) : 0,
      daily_ats_used,
    })

    // Set a JS-readable hint cookie so subsequent page loads can show the correct
    // membership state immediately (before the API call completes).
    // This is a UI optimisation only — actual auth/access control always uses rc_token.
    if (isSubscriber) {
      res.cookies.set('rc_mem_hint', '1', {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 60 * 60,  // 1 hour — re-confirmed on every auth/me call
        path: '/',
      })
    } else {
      res.cookies.set('rc_mem_hint', '', { maxAge: 0, path: '/' })
    }

    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!msg.includes('cooling off')) console.error('[auth/me] DB error:', e)
    return NextResponse.json({ logged_in: false })
  }
}

// POST /api/auth/me/logout — 清除 cookie
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('rc_token', '', { maxAge: 0, path: '/' })
  res.cookies.set('rc_mem_hint', '', { maxAge: 0, path: '/' })
  return res
}
