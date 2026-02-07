import { Hono } from 'hono'
import { getPrisma } from '../lib/prisma'
import { purchaseSubscription } from '../lib/subscriptions'

const subscriptionRoutes = new Hono()

subscriptionRoutes.post('/subscriptions/subscribe', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  const {
    userId,
    creatorId,
    amount,
    platformUserId,
    holdersPoolUserId,
    isRestricted
  } = payload as {
    userId?: number
    creatorId?: number
    amount?: string | number
    platformUserId?: number
    holdersPoolUserId?: number
    isRestricted?: boolean
  }

  if (!userId || !creatorId || amount === undefined || amount === null) {
    return c.json({ error: 'userId, creatorId, and amount are required' }, 400)
  }
  if (!platformUserId || !holdersPoolUserId) {
    return c.json({ error: 'platformUserId and holdersPoolUserId are required' }, 400)
  }

  try {
    const result = await purchaseSubscription(prisma, {
      userId,
      creatorId,
      amount,
      platformUserId,
      holdersPoolUserId,
      isRestricted
    })
    return c.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed'
    return c.json({ error: message }, 400)
  }
})

export { subscriptionRoutes }
