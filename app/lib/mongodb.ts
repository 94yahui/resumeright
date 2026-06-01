import { MongoClient, Collection, ObjectId } from 'mongodb'
import type { PlanType } from './payment'
import type { ResumeData } from './types'

// ── Users ─────────────────────────────────────────────────────────────────────
export interface UserDoc {
  _id: ObjectId
  openid: string             // 个人订阅号 OpenID（现阶段唯一微信身份）
  openid_service?: string    // 未来：服务号 OpenID
  unionid?: string           // 未来：绑定开放平台后填入
  device_ids: string[]       // localStorage deviceId 列表，迁移用
  membership?: {
    plan: PlanType
    purchased_at: number
    expires_at?: number      // undefined = 永久（单次解锁）
    single_template_id?: string
    single_resume_id?: string  // which resume is unlocked (single plan only)
  }
  student?: {
    certified_at: number
    expires_at: number       // 1 year from certification
  }
  free_analyze_used?: number    // lifetime free AI-analyze count (synced across devices)
  single_analyze_used?: number  // lifetime single-plan AI-analyze count (server-authoritative)
  created_at: number
  updated_at: number
  session_id?: string
}

export async function getUserCollection(): Promise<Collection<UserDoc>> {
  return (await db()).collection<UserDoc>('users')
}

// ── WeChat login codes (反转流程：用户发"登录"→公众号回复6位码→用户在网页输入) ──
// openid 作为 _id，每个用户同时只有一个有效码
export interface LoginCodeDoc {
  _id: string        // openid
  code: string       // 6位数字，如 "482917"
  created_at: number
  expires_at: number // Unix ms，5 分钟有效
}

export async function getLoginCodeCollection(): Promise<Collection<LoginCodeDoc>> {
  return (await db()).collection<LoginCodeDoc>('wechat_login_codes')
}

// ── Promo codes ───────────────────────────────────────────────────────────────
export interface PromoDoc {
  _id: string
  plan: PlanType
  label?: string
  createdAt: number
  usedAt?: number
}

// ── Payment orders ────────────────────────────────────────────────────────────
export interface OrderDoc {
  _id: string              // RC-xxx order ID
  openid?: string          // set when user is logged in at time of purchase
  deviceId: string
  planType: PlanType
  amountFen: number        // in fen (¥1 = 100)
  isStudent: boolean
  resumeId?: string
  templateId?: string
  status: 'pending' | 'paid'
  createdAt: number
  paidAt?: number
  wxTransactionId?: string
}

// ── Connection singleton ──────────────────────────────────────────────────────
const uri = process.env.MONGODB_URI ?? ''
let client: MongoClient | null = null
let lastErrorAt = 0
const COOLOFF_MS = 15_000  // don't retry for 15s after a failed connect

async function getClient(): Promise<MongoClient> {
  if (!client) {
    if (Date.now() - lastErrorAt < COOLOFF_MS) {
      throw new Error('MongoDB unavailable (cooling off)')
    }
    const c = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,       // serverless: one connection per function instance is enough
      minPoolSize: 0,
      socketTimeoutMS: 10000,
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('MongoDB connect timeout (5s)')), 5000)
    })
    try {
      await Promise.race([c.connect(), deadline])
      clearTimeout(timer)
      client = c
    } catch (e) {
      clearTimeout(timer)
      lastErrorAt = Date.now()
      c.close().catch(() => {})
      throw e
    }
  }
  return client
}

function db() {
  return getClient().then(c => c.db('resumecraft'))
}

export async function getPromoCollection(): Promise<Collection<PromoDoc>> {
  return (await db()).collection<PromoDoc>('promo_codes')
}

export async function getOrderCollection(): Promise<Collection<OrderDoc>> {
  return (await db()).collection<OrderDoc>('orders')
}

// ── AI daily usage quota ──────────────────────────────────────────────────────
export interface DailyUsageDoc {
  _id: string       // `${deviceId}_${type}_${date|'total'}`
  deviceId: string
  ip: string        // for fraud reference only
  type: string
  date: string      // YYYY-MM-DD UTC, or 'total' for lifetime counters
  count: number
  updatedAt: number
}

export async function getDailyUsageCollection(): Promise<Collection<DailyUsageDoc>> {
  return (await db()).collection<DailyUsageDoc>('daily_usage')
}

// ── Cloud resumes (per-user resume history, synced across devices) ─────────────
export interface ResumeDoc {
  _id: string        // same as client-side HistoryEntry.id
  openid: string
  name: string
  data: ResumeData
  templateId: string
  color?: string
  savedAt: number
  isEnglish?: boolean
}

export async function getResumeCollection(): Promise<Collection<ResumeDoc>> {
  return (await db()).collection<ResumeDoc>('resumes')
}
