import { MongoClient, Collection } from 'mongodb'
import type { PlanType } from './payment'

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
