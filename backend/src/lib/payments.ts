import type { PrismaClient } from '@prisma/client/edge'
import { TransactionType } from './transaction-types'
import { appendTransaction } from './ledger'

const BASE_UNITS = 100000000n

function parseAmountToUnits(amount: string | number): bigint {
  const value = typeof amount === 'number' ? amount.toString() : amount
  const [wholePart, fracPart = ''] = value.split('.')
  const normalizedFrac = fracPart.padEnd(8, '0').slice(0, 8)
  return BigInt(wholePart || '0') * BASE_UNITS + BigInt(normalizedFrac || '0')
}

function formatUnits(units: bigint): string {
  const whole = units / BASE_UNITS
  const frac = units % BASE_UNITS
  return `${whole.toString()}.${frac.toString().padStart(8, '0')}`
}

function splitPayToUnlockUnits(total: bigint): {
  creator: bigint
  platform: bigint
  referral: bigint
} {
  const platform = (total * 8n) / 100n
  const referral = (total * 2n) / 100n
  const creator = total - platform - referral
  return { creator, platform, referral }
}

export async function appendPayToUnlockSplit(prisma: PrismaClient, params: {
  buyerId: number
  creatorId: number
  amount: string | number
  platformUserId: number
  referralUserId?: number | null
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) {
    throw new Error('Amount must be > 0')
  }

  const split = splitPayToUnlockUnits(totalUnits)
  const creatorAmount = formatUnits(split.creator)
  const platformAmount = formatUnits(split.platform + (params.referralUserId ? 0n : split.referral))
  const referralAmount = formatUnits(split.referral)
  const splitBaseMetadata = {
    splitRule: '90/8/2',
    totalAmount: formatUnits(totalUnits)
  }

  const creatorTransaction = await appendTransaction(prisma, {
    fromUserId: params.buyerId,
    toUserId: params.creatorId,
    amount: creatorAmount,
    type: TransactionType.PAY_TO_UNLOCK,
    metadata: {
      ...splitBaseMetadata,
      splitRole: 'creator',
      splitPercent: 90
    }
  })

  const platformTransaction = await appendTransaction(prisma, {
    fromUserId: params.buyerId,
    toUserId: params.platformUserId,
    amount: platformAmount,
    type: TransactionType.PAY_TO_UNLOCK,
    metadata: {
      ...splitBaseMetadata,
      splitRole: 'platform',
      splitPercent: params.referralUserId ? 8 : 10
    }
  })

  let referralTransaction = null
  if (params.referralUserId) {
    referralTransaction = await appendTransaction(prisma, {
      fromUserId: params.buyerId,
      toUserId: params.referralUserId,
      amount: referralAmount,
      type: TransactionType.PAY_TO_UNLOCK,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'referral',
        splitPercent: 2
      }
    })
  }

  return {
    creatorTransaction,
    platformTransaction,
    referralTransaction
  }
}

export async function processStoragePayment(prisma: PrismaClient, params: {
  buyerId: number
  amount: string | number
  platformUserId: number
  type: TransactionType.STORAGE_RENT | TransactionType.STORAGE_FEE
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) {
    throw new Error('Amount must be > 0')
  }

  const platformTransaction = await appendTransaction(prisma, {
    fromUserId: params.buyerId,
    toUserId: params.platformUserId,
    amount: formatUnits(totalUnits),
    type: params.type,
    metadata: {
      splitRule: '100',
      splitRole: 'platform',
      splitPercent: 100,
      totalAmount: formatUnits(totalUnits)
    }
  })

  return { platformTransaction }
}

export async function appendLaunchpadSplit(prisma: PrismaClient, params: {
  buyerId: number
  amount: string | number
  vaults: Record<string, number>
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) throw new Error('Amount must be > 0')

  // EXACT percentages from Tokenomics: 8, 15, 20, 5, 10, 15, 20, 7
  const splits = {
    fundadores: (totalUnits * 8n) / 100n,
    private: (totalUnits * 15n) / 100n,
    staking: (totalUnits * 20n) / 100n,
    user_rewards: (totalUnits * 5n) / 100n,
    marketing: (totalUnits * 10n) / 100n,
    liquidez: (totalUnits * 15n) / 100n,
    ecosistema: (totalUnits * 20n) / 100n,
    treasury: (totalUnits * 7n) / 100n
  }

  // Record transactions for each vault
  const results = [];
  for (const [key, units] of Object.entries(splits)) {
    results.push(await appendTransaction(prisma, {
      fromUserId: params.buyerId,
      toUserId: null, // Routing to protocol vaults
      amount: formatUnits(units),
      type: TransactionType.ADS, // Use appropriate type or generic
      metadata: { vault: key, splitPercent: (splits as any)[key] * 100n / totalUnits }
    }));
  }
  return results;
}
