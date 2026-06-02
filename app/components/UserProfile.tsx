'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getDeviceId, getDailyCount, FREE_ANALYZE_LIMIT } from '../lib/payment'
import { clearLocalResumeData } from '../lib/storage'

const SUB_PLANS = new Set(['monthly', 'quarterly', 'yearly', 'trial7'])
function isActiveSub(plan?: string | null, expiresAt?: number): boolean {
  if (!plan || !SUB_PLANS.has(plan)) return false
  if (expiresAt != null && expiresAt <= Date.now()) return false
  return true
}
const PLAN_LABELS: Record<string, string> = {
  trial7: '7天体验卡', monthly: '月度会员', quarterly: '季度会员', yearly: '年度会员',
}

// ── User avatar: logo-white on a per-user muted color background ───────────────
const AVATAR_COLORS = [
  '#5b8dee', '#4fa37a', '#8b72be', '#4ba8a8', '#c9607a',
  '#c87840', '#6474b8', '#6a9a6a', '#b870a8', '#4d9fca',
  '#9a7840', '#5a8fc8', '#7a9450', '#a06880',
]

function userAvatarColor(seed: string | null | undefined): string {
  const s = seed ?? 'default'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function UserAvatar({ nickname, size = 32, border }: { avatar?: string | null; nickname?: string | null; size?: number; border?: string }) {
  const logoSize = Math.round(size * 0.62)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: userAvatarColor(nickname),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden', boxSizing: 'border-box',
      ...(border ? { border } : {}),
    }}>
      <img src="/logo-white.png" alt="logo" width={logoSize} height={logoSize} style={{ display: 'block', objectFit: 'contain' }} />
    </div>
  )
}

export function GeekAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#1e293b" />
      <text x="16" y="20.5" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="600">&lt;/&gt;</text>
    </svg>
  )
}

// ── KickedOut Modal ────────────────────────────────────────────────────────────
const KICKED_COUNTDOWN = 2

export function KickedOutModal() {
  const [countdown, setCountdown] = useState(KICKED_COUNTDOWN)

  const doClose = useCallback(async () => {
    try { await fetch('/api/auth/me', { method: 'POST' }) } catch {}
    clearLocalResumeData()
    window.location.reload()
  }, [])

  useEffect(() => {
    if (countdown <= 0) { doClose(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, doClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      <style>{`
        @keyframes koFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes koSlideUp { from { opacity: 0; transform: translateY(18px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes koRing    { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'koFadeIn 0.2s ease',
      }}>
        <div style={{
          width: '100%', maxWidth: '340px',
          borderRadius: '18px', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.32)',
          background: '#fff',
          animation: 'koSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          padding: '32px 28px', textAlign: 'center', position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="44" height="44" rx="12" fill="var(--theme-blue)" fillOpacity="0.1" />
              <path d="M15 22V18a7 7 0 0 1 14 0v4" stroke="var(--theme-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="12" y="22" width="20" height="13" rx="3" fill="none" stroke="var(--theme-blue)" strokeWidth="2"/>
              <circle cx="22" cy="28.5" r="1.5" fill="var(--theme-blue)"/>
            </svg>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            账号已在其他设备登录
          </div>
          <div style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.65, marginBottom: '20px' }}>
            当前账号已在新设备登录，您已被退出。
          </div>

          {/* Countdown ring + number */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
              <circle cx="14" cy="14" r="12" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle
                cx="14" cy="14" r="12" fill="none"
                stroke="var(--theme-blue)" strokeWidth="2.5"
                strokeDasharray="75.4"
                strokeDashoffset={75.4 * (1 - countdown / KICKED_COUNTDOWN)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {countdown} 秒后自动刷新
            </span>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Profile Modal ──────────────────────────────────────────────────────────────
interface ProfileModalProps {
  onClose: () => void
  openid: string | null
  nickname: string | null
  avatar: string | null
  membership: { plan: string; purchased_at: number; expires_at?: number } | null
  isStudent: boolean
  freeAnalyzeUsed: number
  dailyAnalyzeUsed?: number  // server-side count for subscribers (cross-device accurate)
  dailyTranslateUsed?: number
  dailyImportUsed?: number
  onUpgrade?: () => void
  onAuthSuccess?: () => void
  onRefreshAuth?: () => void
}

interface OrderRecord {
  orderId: string
  planLabel: string
  amountFen: number
  isStudent: boolean
  paidAt: number
}

export function ProfileModal({ onClose, openid, nickname, avatar, membership, isStudent, freeAnalyzeUsed, dailyAnalyzeUsed, dailyTranslateUsed, dailyImportUsed, onUpgrade, onRefreshAuth }: ProfileModalProps) {
  const [importUsed, setImportUsed] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'usage' | 'orders'>('usage')
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  // Live DB counts fetched when modal opens
  const [liveAnalyze, setLiveAnalyze] = useState<number | null>(null)
  const [liveTranslate, setLiveTranslate] = useState<number | null>(null)
  const [liveImport, setLiveImport] = useState<number | null>(null)
  const [liveFreeAnalyze, setLiveFreeAnalyze] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    setImportUsed(getDailyCount(getDeviceId(), 'import'))
    // Always fetch fresh counts directly from DB when modal opens
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.logged_in) {
          setLiveAnalyze(data.daily_analyze_used ?? 0)
          setLiveTranslate(data.daily_translate_used ?? 0)
          setLiveImport(data.daily_import_used ?? 0)
          setLiveFreeAnalyze(data.free_analyze_used ?? 0)
        }
      })
      .catch(() => {})
    onRefreshAuth?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== 'orders' || orders.length > 0) return
    setOrdersLoading(true)
    fetch('/api/auth/orders')
      .then(r => r.json())
      .then(data => { if (data.orders) setOrders(data.orders) })
      .catch(() => {})
      .finally(() => setOrdersLoading(false))
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPro = isActiveSub(membership?.plan, membership?.expires_at)
  const isSingle = membership?.plan === 'single'
  const planName = isPro ? (PLAN_LABELS[membership!.plan] ?? 'Pro 会员') : isSingle ? '单模板版' : '免费版'
  const planColor = isPro ? '#f59e0b' : isSingle ? '#0789ec' : '#64748b'

  const displayName = nickname ?? (openid ? `用户_${openid.slice(-4)}` : '未知用户')

  // Pro daily limits
  const PRO_AI_LIMIT = 20
  const PRO_TRANSLATE_LIMIT = 5
  const PRO_IMPORT_LIMIT = 10

  // Live-first display counts: use fresh DB value once loaded, fall back to props then localStorage
  const displayAiAnalyzeUsed = liveAnalyze ?? dailyAnalyzeUsed ?? 0
  const displayTranslateUsed = liveTranslate ?? dailyTranslateUsed ?? 0
  const displayImportUsed    = liveImport ?? dailyImportUsed ?? importUsed

  // AI counts (free users: lifetime; pro users: daily from DB)
  const effectiveFreeAnalyze = liveFreeAnalyze ?? freeAnalyzeUsed
  const aiUsed = isPro ? null : effectiveFreeAnalyze
  const aiLimit = isPro ? null : FREE_ANALYZE_LIMIT
  const aiPct = aiUsed !== null && aiLimit ? Math.min(1, aiUsed / aiLimit) : 1

  // Import counts — use DB-sourced displayImportUsed for all plans
  const importLimit = isPro ? PRO_IMPORT_LIMIT : isSingle ? 5 : 2
  const importPct = Math.min(1, displayImportUsed / importLimit)

  // Membership expiry
  const expiresAt = membership?.expires_at
  const expiresText = expiresAt
    ? `有效期至 ${new Date(expiresAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}`
    : isPro ? '永久有效' : ''

  const proBenefits = [
    '全部模板随心用',
    '无水印下载',
    `AI优化${PRO_AI_LIMIT}次/天`,
    `英文简历${PRO_TRANSLATE_LIMIT}次/天`,
    '压缩1页',
    `导入${PRO_IMPORT_LIMIT}次/天`,
  ]

  const modal = (
    <>
      <style>{`
        @keyframes pmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pmSlideUp { from { opacity: 0; transform: translateY(18px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .pm-card { transform: translateZ(0); isolation: isolate; position: relative; }
        .pm-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          box-shadow: inset 0 0 28px rgba(0,0,0,0.06);
          pointer-events: none;
          z-index: 999;
        }
      `}</style>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          animation: 'pmFadeIn 0.2s ease',
        }}
      >
        <div className="pm-card" style={{
          width: '100%', maxWidth: '360px',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
          background: '#fff',
          animation: 'pmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            padding: '28px 24px 24px',
            position: 'relative',
            textAlign: 'center',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '14px', right: '16px',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                width: '28px', height: '28px', borderRadius: '50%',
                cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                fontSize: '16px', lineHeight: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >×</button>

            {/* Avatar with glowing ring + Pro badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                padding: '3px',
                background: isPro
                  ? 'linear-gradient(135deg, #f59e0b, #fcd34d)'
                  : 'linear-gradient(135deg, #38bdf8, #818cf8)',
                borderRadius: '50%',
                boxShadow: isPro
                  ? '0 0 16px rgba(245,158,11,0.5)'
                  : '0 0 16px rgba(56,189,248,0.4)',
              }}>
                <div style={{ background: '#0f172a', borderRadius: '50%', padding: '2px' }}>
                  <UserAvatar avatar={avatar} nickname={nickname} size={64} />
                </div>
              </div>
              {isPro && (
                <div style={{
                  marginTop: '8px',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 10px', borderRadius: '20px',
                  background: 'linear-gradient(90deg, #ff9240, #ff6700)',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                  letterSpacing: '0.3px',
                }}>
                  ✦ Pro 会员
                </div>
              )}
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              {displayName}
            </div>

            {/* Plan badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '20px',
                background: isPro ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                border: `1px solid ${isPro ? 'rgba(245,158,11,0.35)' : 'rgba(100,116,139,0.25)'}`,
                fontSize: '11.5px', fontWeight: 600, color: planColor,
                letterSpacing: '0.2px',
              }}>
                {isPro ? '✦' : '○'} {planName}
              </span>
              {isStudent && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '20px',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontSize: '11.5px', fontWeight: 600, color: '#10b981',
                }}>
                  ✓ 学生认证
                </span>
              )}
            </div>
            {expiresText && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
                {expiresText}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px 24px', background: '#fff' }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '8px', padding: '3px', marginBottom: '18px' }}>
              {([['usage', '使用情况'], ['orders', '订单记录']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                  background: activeTab === tab ? 'white' : 'transparent',
                  color: activeTab === tab ? '#0f172a' : '#94a3b8',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>{label}</button>
              ))}
            </div>

            {activeTab === 'orders' ? (
              <div>
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13px' }}>加载中…</div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13px' }}>暂无订单记录</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orders.map(o => (
                      <div key={o.orderId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '10px',
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                            {o.planLabel}{o.isStudent ? ' · 学生价' : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {new Date(o.paidAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          ¥{(o.amountFen / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isPro ? (
              <>
                {/* Pro benefits */}
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  专属权益
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {proBenefits.map(b => (
                    <span key={b} style={{
                      fontSize: '12px', padding: '3px 8px', borderRadius: '6px',
                      background: '#f1f5f9', color: '#334155', fontWeight: 500,
                    }}>✓ {b}</span>
                  ))}
                </div>

                {/* Daily usage for pro */}
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
                  今日使用情况
                </div>
                {[
                  { label: 'AI 深度定向优化', used: displayAiAnalyzeUsed, limit: PRO_AI_LIMIT },
                  { label: '生成英文简历', used: displayTranslateUsed, limit: PRO_TRANSLATE_LIMIT },
                  { label: '简历导入解析', used: displayImportUsed, limit: PRO_IMPORT_LIMIT },
                ].map(({ label, used, limit }) => {
                  const pct = Math.min(1, used / limit)
                  const remaining = limit - used
                  return (
                    <div key={label} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: pct >= 1 ? '#ef4444' : '#64748b' }}>
                          剩余 {remaining} / {limit}
                        </span>
                      </div>
                      <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(1 - pct) * 100}%`,
                          background: pct >= 1 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #ff9240, #ff6700)',
                          borderRadius: '9999px',
                          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
                  使用情况
                </div>

                {/* AI optimize stat */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>AI 深度定向优化</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {aiUsed} / {aiLimit}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${aiPct * 100}%`,
                      background: aiPct >= 1
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #818cf8, #6366f1)',
                      borderRadius: '9999px',
                      transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                  </div>
                </div>

                {/* Import stat */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>简历导入解析</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {displayImportUsed} / {importLimit} 今日
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${importPct * 100}%`,
                      background: importPct >= 1
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #38bdf8, #0789ec)',
                      borderRadius: '9999px',
                      transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                  </div>
                </div>

                <button
                  onClick={() => { onClose(); onUpgrade?.() }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', padding: '10px',
                    background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
                    color: '#fff', borderRadius: '10px', border: 'none',
                    fontSize: '13.5px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ✦ 升级 Pro · 解锁全部功能
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}

// ── User avatar dropdown ───────────────────────────────────────────────────────
interface UserDropdownProps {
  avatar: string | null | undefined
  nickname: string | null | undefined
  openid: string | null | undefined
  membership: { plan: string; purchased_at: number; expires_at?: number } | null | undefined
  isStudent: boolean | undefined
  freeAnalyzeUsed: number | undefined
  dailyAnalyzeUsed?: number
  dailyTranslateUsed?: number
  dailyImportUsed?: number
  onLogout: () => void
  onUpgrade?: () => void
  onRefreshAuth?: () => void
  /** On dark backgrounds (editor topbar), invert hover/border colors */
  dark?: boolean
  /** Show only the avatar circle, no name or chevron */
  compact?: boolean
}

export function UserDropdown({ avatar, nickname, openid, membership, isStudent, freeAnalyzeUsed, dailyAnalyzeUsed, dailyTranslateUsed, dailyImportUsed, onLogout, onUpgrade, onRefreshAuth, dark, compact }: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayName = nickname ?? (openid ? `用户_${(openid as string).slice(-4)}` : '我')
  const isPro = isActiveSub(membership?.plan, membership?.expires_at)

  return (
    <>
    <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px',
            borderRadius: '20px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <UserAvatar
            avatar={avatar} nickname={nickname} size={32}
            border={isPro ? '2px solid #f59e0b' : dark ? '2px solid rgba(255,255,255,0.25)' : '2px solid rgba(0,0,0,0.1)'}
          />
          {!compact && (
            <>
              <span style={{ fontSize: '13px', fontWeight: 500, color: dark ? 'rgba(255,255,255,0.85)' : 'var(--ink2)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'var(--ink3)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: '#fff', borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '5px',
            zIndex: 300,
            minWidth: '160px',
            animation: 'ddSlide 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* User info strip */}
            <div style={{
              padding: '8px 12px 8px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '3px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{displayName}</div>
              {isPro && (
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500, marginTop: '2px' }}>
                  ✦ {PLAN_LABELS[membership?.plan ?? ''] ?? 'Pro 会员'}
                </div>
              )}
            </div>

            <button
              onClick={() => { setOpen(false); setShowProfile(true); onRefreshAuth?.() }}
              style={ddItem}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, color: 'var(--theme-blue)' }}>
                <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 13c0-3.038 2.462-5.5 5.5-5.5S13 9.962 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              个人中心
            </button>
            <button
              onClick={() => { setOpen(false); onLogout() }}
              style={{ ...ddItem, color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, color: '#ef4444' }}>
                <path d="M9.5 10.5v1.75A1.25 1.25 0 0 1 8.25 13.5h-5.5A1.25 1.25 0 0 1 1.5 12.25v-9.5A1.25 1.25 0 0 1 2.75 1.5h5.5A1.25 1.25 0 0 1 9.5 2.75V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M12.5 7.5H5.5m7 0-2-2m2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              退出登录
            </button>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          openid={openid ?? null}
          nickname={nickname ?? null}
          avatar={avatar ?? null}
          membership={membership ?? null}
          isStudent={isStudent ?? false}
          freeAnalyzeUsed={freeAnalyzeUsed ?? 0}
          dailyAnalyzeUsed={dailyAnalyzeUsed}
          dailyTranslateUsed={dailyTranslateUsed}
          dailyImportUsed={dailyImportUsed}
          onUpgrade={onUpgrade}
          onRefreshAuth={onRefreshAuth}
        />
      )}
    </>
  )
}

const ddItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '8px 12px',
  background: 'transparent', border: 'none',
  borderRadius: '8px', cursor: 'pointer',
  fontSize: '13.5px', color: '#334155',
  fontFamily: 'var(--font-sans)',
  textAlign: 'left', transition: 'background 0.1s',
}
