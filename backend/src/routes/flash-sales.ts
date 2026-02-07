import { Hono } from 'hono'
import { getPrisma } from '../lib/prisma'

const flashSaleRoutes = new Hono()

flashSaleRoutes.post('/flash-sales', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { creatorId, title, price, mediaItemId, packId } = payload as {
    creatorId?: number
    title?: string
    price?: string | number
    mediaItemId?: number
    packId?: number
  }
  if (!creatorId || !title || price === undefined) {
    return c.json({ error: 'creatorId, title, and price are required' }, 400)
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  const flashSale = await prisma.flashSale.create({
    data: {
      creatorId,
      title,
      price: price.toString(),
      expiresAt,
      mediaItemId: mediaItemId ?? null,
      packId: packId ?? null
    }
  })

  return c.json({ flashSale })
})

flashSaleRoutes.get('/flash-sales/active', async (c) => {
  const prisma = getPrisma(c.env)
  const now = new Date()
  const flashSales = await prisma.flashSale.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: now }
    },
    include: { mediaItem: true, pack: true }
  })
  return c.json({ flashSales })
})

flashSaleRoutes.get('/flash-sales/:id', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid flash sale id' }, 400)
  }
  const flashSale = await prisma.flashSale.findUnique({
    where: { id },
    include: { mediaItem: true, pack: true }
  })
  if (!flashSale) {
    return c.json({ error: 'Flash sale not found' }, 404)
  }
  if (flashSale.expiresAt <= new Date() && flashSale.isActive) {
    await prisma.flashSale.update({
      where: { id },
      data: { isActive: false }
    })
  }
  return c.json({ flashSale })
})

export { flashSaleRoutes }
