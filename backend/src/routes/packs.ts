import { Hono } from 'hono'
import { getPrisma } from '../lib/prisma'
import { appendPayToUnlockSplit } from '../lib/payments'

const packRoutes = new Hono()

packRoutes.get('/packs', async (c) => {
  const prisma = getPrisma(c.env)
  const creatorIdParam = c.req.query('creatorId')
  const creatorId = creatorIdParam ? Number.parseInt(creatorIdParam, 10) : null
  const packs = await prisma.mediaPack.findMany({
    where: creatorId ? { creatorId } : undefined,
    include: { items: true }
  })
  return c.json({ packs })
})

packRoutes.post('/packs', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { creatorId, title, description, price } = payload as {
    creatorId?: number
    title?: string
    description?: string
    price?: string | number
  }
  if (!creatorId || !title) {
    return c.json({ error: 'creatorId and title are required' }, 400)
  }

  const pack = await prisma.mediaPack.create({
    data: {
      creatorId,
      title,
      description: description ?? null,
      price: price?.toString()
    }
  })
  return c.json({ pack })
})

packRoutes.get('/packs/:id', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid pack id' }, 400)
  }
  const pack = await prisma.mediaPack.findUnique({
    where: { id },
    include: { items: true, flashSales: true }
  })
  if (!pack) {
    return c.json({ error: 'Pack not found' }, 404)
  }
  return c.json({ pack })
})

packRoutes.post('/packs/:id/purchase', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid pack id' }, 400)
  }
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { buyerId, amount, platformUserId, referralUserId, expiresAt } = payload as {
    buyerId?: number
    amount?: string | number
    platformUserId?: number
    referralUserId?: number | null
    expiresAt?: string
  }
  if (!buyerId || !platformUserId) {
    return c.json({ error: 'buyerId and platformUserId are required' }, 400)
  }

  const pack = await prisma.mediaPack.findUnique({ where: { id } })
  if (!pack) {
    return c.json({ error: 'Pack not found' }, 404)
  }

  const price = amount ?? pack.price
  if (price === null || price === undefined) {
    return c.json({ error: 'Pack price is required' }, 400)
  }

  const { creatorTransaction, platformTransaction, referralTransaction } =
    await appendPayToUnlockSplit(prisma, {
      buyerId,
      creatorId: pack.creatorId,
      amount: price,
      platformUserId,
      referralUserId
    })

  const expiresAtDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  const ownership = await prisma.contentOwnership.upsert({
    where: {
      userId_packId: {
        userId: buyerId,
        packId: pack.id
      }
    },
    update: {
      isVaulted: false,
      expiresAt: expiresAtDate
    },
    create: {
      userId: buyerId,
      packId: pack.id,
      isVaulted: false,
      expiresAt: expiresAtDate
    }
  })

  return c.json({
    ownership,
    transactions: {
      creator: creatorTransaction,
      platform: platformTransaction,
      referral: referralTransaction
    }
  })
})

packRoutes.post('/packs/:id/items', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid pack id' }, 400)
  }
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { mediaItemId } = payload as { mediaItemId?: number }
  if (!mediaItemId) {
    return c.json({ error: 'mediaItemId is required' }, 400)
  }
  const item = await prisma.mediaItem.update({
    where: { id: mediaItemId },
    data: { packId: id }
  })
  return c.json({ item })
})

export { packRoutes }
