import { MongoClient, Collection, ObjectId } from 'mongodb'
import type { PlanType } from './payment'

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
  }
  created_at: number
  updated_at: number
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

async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
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
