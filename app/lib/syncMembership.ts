import { getUserCollection } from './mongodb'
import { PLAN_DURATION_MS } from './payment'

interface OrderLike {
  openid?: string | null
  planType?: string
  templateId?: string | null
}

/**
 * Write the membership granted by a paid order to the user document.
 * - Subscription plans always overwrite the membership field.
 * - Single plans only write if the user has no active subscription (avoids downgrading).
 * Safe to call from both webhook and query-polling paths.
 */
export async function syncMembershipFromOrder(order: OrderLike, paidAt: number): Promise<void> {
  if (!order.openid || !order.planType) return
  const { openid, planType } = order
  try {
    const users = await getUserCollection()

    if (planType !== 'single') {
      let expiresAt: number | undefined
      if (PLAN_DURATION_MS[planType]) {
        const existing = await users.findOne({ openid }, { projection: { membership: 1 } })
        const m = existing?.membership as { plan?: string; expires_at?: number } | null
        const currentExpiry = (m && m.plan !== 'single' && m.expires_at) ? m.expires_at : 0
        expiresAt = Math.max(currentExpiry, paidAt) + PLAN_DURATION_MS[planType]
      }
      await users.updateOne(
        { openid },
        { $set: { membership: { plan: planType as import('./payment').PlanType, purchased_at: paidAt, expires_at: expiresAt }, updated_at: paidAt } }
      )
    } else {
      // Single purchase: don't overwrite an active subscription
      const user = await users.findOne({ openid })
      const m = user?.membership as { plan: string; expires_at?: number } | null
      const now = paidAt
      const hasActiveSub = m && m.plan !== 'single' && (!m.expires_at || m.expires_at > now)
      if (!hasActiveSub) {
        await users.updateOne(
          { openid },
          { $set: { membership: { plan: 'single' as import('./payment').PlanType, purchased_at: paidAt, single_template_id: (order as { templateId?: string }).templateId ?? undefined, single_resume_id: (order as { resumeId?: string }).resumeId ?? undefined }, updated_at: paidAt } }
        )
      }
    }
  } catch (e) {
    console.error('[syncMembership] error:', e)
  }
}
