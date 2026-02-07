import { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client/edge'
import { appendTransaction } from './ledger'
import { TransactionType } from './transaction-types'

const BASE_UNITS = 100000000n
const SUBSCRIPTION_MS = 30 * 24 * 60 * 60 * 1000

function parseAmountToUnits(amount: string | number): bigint {
  const value = typeof amount === 'number' ? amount.toString() : amount
  if (!value || value === '0') return 0n
  const [wholePart, fracPart = ''] = value.split('.')
  const normalizedFrac = fracPart.padEnd(8, '0').slice(0, 8)
  const whole = BigInt(wholePart || '0')
  const frac = BigInt(normalizedFrac || '0')
  return whole * BASE_UNITS + frac
}

function formatUnits(units: bigint): string {
  const sign = units < 0 ? '-' : ''
  const abs = units < 0 ? -units : units
  const whole = abs / BASE_UNITS
  const frac = abs % BASE_UNITS
  const fracStr = frac.toString().padStart(8, '0')
  return `${sign}${whole.toString()}.${fracStr}`
}

function splitUnits(total: bigint): { creator: bigint; platform: bigint; holders: bigint } {
  const platform = (total * 8n) / 100n
  const holders = (total * 2n) / 100n
  const creator = total - platform - holders
  return { creator, platform, holders }
}

export async function purchaseSubscription(prisma: PrismaClient, params: {
  userId: number
  creatorId: number
  amount: string | number
  platformUserId: number
  holdersPoolUserId: number
  isRestricted?: boolean
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) {
    throw new Error('Amount must be greater than zero')
  }
  if (params.userId === params.creatorId) {
    throw new Error('Creator cannot subscribe to themselves')
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [
          params.userId,
          params.creatorId,
          params.platformUserId,
          params.holdersPoolUserId
        ]
      }
    }
  })
  const userById = new Map(users.map((user) => [user.id, user]))
  const subscriber = userById.get(params.userId)
  const creator = userById.get(params.creatorId)
  const platform = userById.get(params.platformUserId)
  const holdersPool = userById.get(params.holdersPoolUserId)

  if (!subscriber) {
    throw new Error('Subscriber not found')
  }
  if (!creator) {
    throw new Error('Creator not found')
  }
  if (!platform) {
    throw new Error('Platform account not found')
  }
  if (!holdersPool) {
    throw new Error('Holders pool account not found')
  }

  let isRestricted = params.isRestricted
  if (isRestricted === undefined) {
    const [restrictedItem, restrictedPack] = await Promise.all([
      prisma.mediaItem.findFirst({
        where: { creatorId: params.creatorId, isRestricted: true },
        select: { id: true }
      }),
      prisma.mediaPack.findFirst({
        where: { creatorId: params.creatorId, isRestricted: true },
        select: { id: true }
      })
    ])
    isRestricted = Boolean(restrictedItem || restrictedPack)
  }

  if (!subscriber.isAdult && isRestricted) {
    throw new Error('Restricted content requires adult verification')
  }

  const balanceUnits = parseAmountToUnits(subscriber.balanceXT.toString())
  if (balanceUnits < totalUnits) {
    throw new Error('Insufficient balance')
  }

  const split = splitUnits(totalUnits)
  const creatorAmount = formatUnits(split.creator)
  const platformAmount = formatUnits(split.platform)
  const holdersAmount = formatUnits(split.holders)
  const splitBaseMetadata = {
    splitRule: '90/8/2',
    totalAmount: formatUnits(totalUnits)
  }

  const creatorTransaction = await appendTransaction(prisma, {
    fromUserId: params.userId,
    toUserId: params.creatorId,
    amount: creatorAmount,
    type: TransactionType.SUBSCRIPTION,
    metadata: {
      ...splitBaseMetadata,
      splitRole: 'creator',
      splitPercent: 90
    }
  })

  const platformTransaction = await appendTransaction(prisma, {
    fromUserId: params.userId,
    toUserId: params.platformUserId,
    amount: platformAmount,
    type: TransactionType.SUBSCRIPTION,
    metadata: {
      ...splitBaseMetadata,
      splitRole: 'platform',
      splitPercent: 8
    }
  })

  const holdersTransaction = await appendTransaction(prisma, {
    fromUserId: params.userId,
    toUserId: params.holdersPoolUserId,
    amount: holdersAmount,
    type: TransactionType.SUBSCRIPTION,
    metadata: {
      ...splitBaseMetadata,
      splitRole: 'holders_pool',
      splitPercent: 2
    }
  })

  const totalAmount = new Prisma.Decimal(formatUnits(totalUnits))
  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: { balanceXT: { decrement: totalAmount } }
    }),
    prisma.user.update({
      where: { id: params.creatorId },
      data: { balanceXT: { increment: new Prisma.Decimal(creatorAmount) } }
    }),
    prisma.user.update({
      where: { id: params.platformUserId },
      data: { balanceXT: { increment: new Prisma.Decimal(platformAmount) } }
    }),
    prisma.user.update({
      where: { id: params.holdersPoolUserId },
      data: { balanceXT: { increment: new Prisma.Decimal(holdersAmount) } }
    })
  ])

  const now = new Date()
  const existing = await prisma.subscription.findUnique({
    where: {
      userId_creatorId: { userId: params.userId, creatorId: params.creatorId }
    }
  })
  const baseDate = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now
  const expiresAt = new Date(baseDate.getTime() + SUBSCRIPTION_MS)

  const subscription = await prisma.subscription.upsert({
    where: {
      userId_creatorId: { userId: params.userId, creatorId: params.creatorId }
    },
    create: {
      userId: params.userId,
      creatorId: params.creatorId,
      expiresAt
    },
    update: {
      expiresAt
    }
  })

  return {
    subscription,
    transactions: {
      creator: creatorTransaction,
      platform: platformTransaction,
      holders: holdersTransaction
    }
  }
}
