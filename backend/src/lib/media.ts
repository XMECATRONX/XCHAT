import type { PrismaClient } from '@prisma/client/edge'
import { TransactionType } from './transaction-types'

export async function userHasUnlockedMedia(
  prisma: PrismaClient,
  mediaItemId: number,
  userId: number
): Promise<boolean> {
  const unlock = await prisma.mediaUnlock.findFirst({
    where: {
      mediaItemId,
      userId,
      transaction: {
        type: TransactionType.PAY_TO_UNLOCK
      }
    }
  })
  return Boolean(unlock)
}

export async function ensureMediaUnlock(params: {
  prisma: PrismaClient
  mediaItemId: number
  userId: number
  transactionId: number
  isRestricted: boolean
}) {
  const { prisma, ...unlockParams } = params
  return prisma.mediaUnlock.upsert({
    where: {
      mediaItemId_userId: {
        mediaItemId: unlockParams.mediaItemId,
        userId: unlockParams.userId
      }
    },
    update: {
      transactionId: unlockParams.transactionId,
      isRestricted: unlockParams.isRestricted
    },
    create: {
      mediaItemId: unlockParams.mediaItemId,
      userId: unlockParams.userId,
      transactionId: unlockParams.transactionId,
      isRestricted: unlockParams.isRestricted
    }
  })
}
