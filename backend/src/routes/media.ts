import { Hono } from 'hono'
import { getPrisma } from '../lib/prisma'
import { TransactionType } from '../lib/transaction-types'
import { uploadFile, getFile, fileExists } from '../lib/storage'
import { applyInvisibleWatermark, buildWatermarkPayload, extractWatermark } from '../lib/watermark'
import { appendPayToUnlockSplit, processStoragePayment } from '../lib/payments'
import { ensureMediaUnlock, userHasUnlockedMedia } from '../lib/media'
import { decryptBuffer } from '../lib/encryption'

const mediaRoutes = new Hono()

function parseOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const parsed = Number.parseInt(value.toString(), 10)
  return Number.isNaN(parsed) ? null : parsed
}

mediaRoutes.post('/media/upload', async (c) => {
  const prisma = getPrisma(c.env)
  const body = await c.req.parseBody()
  const file = body.file as { arrayBuffer?: () => Promise<ArrayBuffer>; name?: string; type?: string }
  if (!file || typeof file.arrayBuffer !== 'function') {
    return c.json({ error: 'file is required' }, 400)
  }
  const creatorId = parseOptionalInt(body.creatorId)
  if (!creatorId) {
    return c.json({ error: 'creatorId is required' }, 400)
  }
  const packId = parseOptionalInt(body.packId)
  const title = body.title ? body.title.toString() : null
  const price = body.price ? body.price.toString() : null

  const arrayBuffer = await file.arrayBuffer()
  const storageKey = `media/${creatorId}/${Date.now()}-${file.name ?? 'upload'}`

  await uploadFile(c.env, storageKey, arrayBuffer, file.type)

  const mediaItem = await prisma.mediaItem.create({
    data: {
      creatorId,
      packId,
      title,
      storageKey,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: arrayBuffer.byteLength,
      price
    }
  })

  return c.json({ mediaItem })
})

mediaRoutes.post('/watermark/extract', async (c) => {
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  const { dataBase64 } = payload as { dataBase64?: string }
  if (!dataBase64) {
    return c.json({ error: 'dataBase64 is required' }, 400)
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(dataBase64, 'base64')
  } catch (error) {
    return c.json({ error: 'Invalid base64 payload' }, 400)
  }

  const watermark = extractWatermark(buffer)
  return c.json({ watermark })
})

mediaRoutes.get('/media/:id', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid media id' }, 400)
  }
  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    include: { pack: true }
  })
  if (!mediaItem) {
    return c.json({ error: 'Media not found' }, 404)
  }
  return c.json({ mediaItem })
})

mediaRoutes.post('/media/:id/unlock', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid media id' }, 400)
  }
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { buyerId, amount, platformUserId, referralUserId } = payload as {
    buyerId?: number
    amount?: string | number
    platformUserId?: number
    referralUserId?: number | null
  }
  if (!buyerId || amount === undefined || !platformUserId) {
    return c.json({ error: 'buyerId, amount, platformUserId are required' }, 400)
  }

  const mediaItem = await prisma.mediaItem.findUnique({ where: { id } })
  if (!mediaItem) {
    return c.json({ error: 'Media not found' }, 404)
  }

  const { creatorTransaction, platformTransaction, referralTransaction } =
    await appendPayToUnlockSplit(prisma, {
      buyerId,
      creatorId: mediaItem.creatorId,
      amount,
      platformUserId,
      referralUserId
    })

  const unlockRecord = await ensureMediaUnlock({
    prisma,
    mediaItemId: mediaItem.id,
    userId: buyerId,
    transactionId: creatorTransaction.id,
    isRestricted: mediaItem.isRestricted
  })

  return c.json({
    unlock: unlockRecord,
    transactions: {
      creator: creatorTransaction,
      platform: platformTransaction,
      referral: referralTransaction
    }
  })
})

mediaRoutes.get('/media/ownerships', async (c) => {
  const prisma = getPrisma(c.env)
  const userId = parseOptionalInt(c.req.query('userId'))
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }

  const ownerships = await prisma.contentOwnership.findMany({
    where: { userId },
    include: {
      pack: {
        include: {
          items: true,
          creator: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return c.json({ ownerships })
})

mediaRoutes.post('/media/vault', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const { userId, packId, amount, platformUserId, feeType } = payload as {
    userId?: number
    packId?: number
    amount?: string | number
    platformUserId?: number
    feeType?: TransactionType | string
  }
  if (!userId || !packId || amount === undefined || !platformUserId) {
    return c.json({ error: 'userId, packId, amount, platformUserId are required' }, 400)
  }

  const storageType = feeType === TransactionType.STORAGE_FEE
    || feeType === TransactionType.STORAGE_RENT
    ? feeType
    : feeType === undefined || feeType === null
      ? TransactionType.STORAGE_RENT
      : null
  if (!storageType) {
    return c.json({ error: 'feeType must be STORAGE_FEE or STORAGE_RENT' }, 400)
  }

  const ownership = await prisma.contentOwnership.findUnique({
    where: {
      userId_packId: {
        userId,
        packId
      }
    }
  })
  if (!ownership) {
    return c.json({ error: 'Ownership not found' }, 404)
  }
  if (ownership.isVaulted) {
    return c.json({ error: 'Pack already vaulted' }, 409)
  }

  const { platformTransaction } = await processStoragePayment(prisma, {
    buyerId: userId,
    amount,
    platformUserId,
    type: storageType
  })

  const updatedOwnership = await prisma.contentOwnership.update({
    where: { id: ownership.id },
    data: {
      isVaulted: true,
      expiresAt: null
    }
  })

  return c.json({
    ownership: updatedOwnership,
    transaction: platformTransaction
  })
})

mediaRoutes.get('/media/:id/serve', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid media id' }, 400)
  }
  const userId = parseOptionalInt(c.req.query('userId'))
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }

  const mediaItem = await prisma.mediaItem.findUnique({ where: { id } })
  if (!mediaItem) {
    return c.json({ error: 'Media not found' }, 404)
  }

  if (mediaItem.requiresUnlock && mediaItem.creatorId !== userId) {
    const unlocked = await userHasUnlockedMedia(prisma, mediaItem.id, userId)
    if (!unlocked) {
      return c.json({ error: 'Payment required' }, 402)
    }
  }

  let storageKey = mediaItem.storageKey
  if (mediaItem.requiresUnlock && mediaItem.creatorId !== userId) {
    const watermarkKey = `watermarked/${mediaItem.id}/${userId}`
    const hasWatermark = await fileExists(c.env, watermarkKey)
    if (!hasWatermark) {
      const original = await getFile(c.env, mediaItem.storageKey)
      if (!original) {
        return c.json({ error: 'Media file missing' }, 404)
      }
      const watermarked = applyInvisibleWatermark(
        original,
        buildWatermarkPayload(userId, mediaItem.id)
      )
      await uploadFile(c.env, watermarkKey, watermarked, mediaItem.contentType)
      await prisma.mediaWatermark.upsert({
        where: {
          mediaItemId_userId: {
            mediaItemId: mediaItem.id,
            userId
          }
        },
        update: {
          storageKey: watermarkKey
        },
        create: {
          mediaItemId: mediaItem.id,
          userId,
          storageKey: watermarkKey
        }
      })
    }
    storageKey = watermarkKey
  }

  const data = await getFile(c.env, storageKey)
  if (!data) {
    return c.json({ error: 'Media file missing' }, 404)
  }

  return new Response(data, {
    headers: {
      'Content-Type': mediaItem.contentType,
      'Cache-Control': 'private, max-age=3600'
    }
  })
})

mediaRoutes.get('/media/:id/bridge', async (c) => {
  const prisma = getPrisma(c.env)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid media id' }, 400)
  }
  const userId = parseOptionalInt(c.req.query('userId'))
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }

  const mediaItem = await prisma.mediaItem.findUnique({ where: { id } })
  if (!mediaItem) {
    return c.json({ error: 'Media not found' }, 404)
  }

  const isCreator = mediaItem.creatorId === userId
  let hasOwnership = false

  if (mediaItem.packId) {
    const ownership = await prisma.contentOwnership.findUnique({
      where: {
        userId_packId: {
          userId,
          packId: mediaItem.packId
        }
      }
    })
    if (!ownership) {
      return c.json({ error: 'Ownership required' }, 402)
    }
    const isExpired =
      !ownership.isVaulted &&
      ownership.expiresAt !== null &&
      ownership.expiresAt.getTime() <= Date.now()
    if (isExpired) {
      return c.json({ error: 'Ownership expired' }, 402)
    }
    hasOwnership = true
  }

  if (!isCreator && !hasOwnership && mediaItem.requiresUnlock) {
    const unlocked = await userHasUnlockedMedia(prisma, mediaItem.id, userId)
    if (!unlocked) {
      return c.json({ error: 'Payment required' }, 402)
    }
  }

  const encrypted = await getFile(c.env, mediaItem.storageKey)
  if (!encrypted) {
    return c.json({ error: 'Media file missing' }, 404)
  }

  let decrypted: Buffer
  try {
    decrypted = decryptBuffer(encrypted)
  } catch (error) {
    console.error('Decrypt error', error)
    return c.json({ error: 'Failed to decrypt media' }, 500)
  }

  return new Response(decrypted, {
    headers: {
      'Content-Type': mediaItem.contentType,
      'Cache-Control': 'private, max-age=3600'
    }
  })
})

export { mediaRoutes }
