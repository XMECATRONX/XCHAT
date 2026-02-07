import { createHash } from 'crypto'
import type { PrismaClient } from '@prisma/client/edge'
import { generateMockSolanaWallet } from './solana'

type TransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'BURN'
  | 'REFERRAL'
  | 'HOLDER_REWARD'
  | 'PLATFORM_FEE'
  | 'CONTENT_PURCHASE'
  | 'AD_PURCHASE'
  | 'LIVE_ENTRY'
  | 'SWAP'
  | 'TREASURY_FEE'
  | 'STAKE'
  | 'LOTTERY'
  | 'ADS'
  | 'CALL'

const BASE_UNITS = 100000000n

export interface LedgerTransactionInput {
  fromUserId?: number | null
  toUserId?: number | null
  amount: string | number
  type: TransactionType
  metadata?: Record<string, unknown> | null
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function simulateSolanaWalletGeneration(params?: {
  seed?: string
  userId?: number | null
}) {
  return generateMockSolanaWallet(params)
}

function buildHashPayload(params: {
  previousHash: string
  createdAt: string
  fromUserId: number | null
  toUserId: number | null
  amount: string
  type: TransactionType
  metadata: Record<string, unknown> | null
}) {
  return JSON.stringify({
    previousHash: params.previousHash,
    createdAt: params.createdAt,
    fromUserId: params.fromUserId,
    toUserId: params.toUserId,
    amount: params.amount,
    type: params.type,
    metadata: params.metadata ?? null
  })
}

export async function getLatestTransaction(prisma: PrismaClient) {
  return prisma.transaction.findFirst({
    orderBy: { id: 'desc' }
  })
}

export async function appendTransaction(prisma: PrismaClient, input: LedgerTransactionInput) {
  const latest = await getLatestTransaction(prisma)
  const previousHash = latest?.currentHash ?? 'GENESIS'
  const createdAt = new Date()
  const createdAtIso = createdAt.toISOString()
  const amountString = typeof input.amount === 'string'
    ? input.amount
    : input.amount.toString()
  const fromUserId = input.fromUserId ?? null
  const toUserId = input.toUserId ?? null
  const metadata = input.metadata ?? null
  const currentHash = sha256(
    buildHashPayload({
      previousHash,
      createdAt: createdAtIso,
      fromUserId,
      toUserId,
      amount: amountString,
      type: input.type,
      metadata
    })
  )

  return prisma.transaction.create({
    data: {
      fromUserId,
      toUserId,
      amount: amountString,
      type: input.type,
      createdAt,
      prevHash: previousHash,
      currentHash
    }
  })
}

export function parseAmountToUnits(amount: string | number): bigint {
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

export function calculateSwapBreakdown(params: {
  amount: string | number
  insurance?: boolean
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) {
    throw new Error('Amount must be greater than zero')
  }

  const spreadUnits = (totalUnits * 150n) / 10000n
  const insuranceUnits = params.insurance ? (totalUnits * 50n) / 10000n : 0n
  const feeUnits = spreadUnits + insuranceUnits
  const netUnits = totalUnits - feeUnits

  if (netUnits <= 0n) {
    throw new Error('Amount too small after fees')
  }

  return {
    totalUnits,
    netUnits,
    spreadUnits,
    insuranceUnits,
    feeUnits,
    grossAmount: formatUnits(totalUnits),
    netAmount: formatUnits(netUnits),
    spreadAmount: formatUnits(spreadUnits),
    insuranceAmount: formatUnits(insuranceUnits),
    feeAmount: formatUnits(feeUnits),
    insuranceSelected: Boolean(params.insurance)
  }
}

function calculateAdsBurnUnits(total: bigint): bigint {
  return (total * 10n) / 100n
}

function splitAdsUnits(total: bigint): {
  platform: bigint
  burn: bigint
  referral: bigint
  holders: bigint
} {
  const burn = calculateAdsBurnUnits(total)
  const referral = (total * 10n) / 100n
  const holders = (total * 20n) / 100n
  const platform = total - burn - referral - holders
  return { platform, burn, referral, holders }
}

function splitContentUnits(total: bigint): {
  creator: bigint
  platform: bigint
  holders: bigint
} {
  const platform = (total * 8n) / 100n
  const holders = (total * 2n) / 100n
  const creator = total - platform - holders
  return { creator, platform, holders }
}

export async function processPayment(prisma: PrismaClient, params: {
  fromUserId?: number | null
  toUserId?: number | null
  amount: string | number
  type: TransactionType
  platformUserId?: number
  holdersPoolUserId?: number
  referralUserId?: number | null
  metadata?: Record<string, unknown> | null
}) {
  const totalUnits = parseAmountToUnits(params.amount)
  if (totalUnits <= 0n) {
    throw new Error('Amount must be greater than zero')
  }

  if (
    params.type === 'AD_PURCHASE'
  ) {
    if (!params.platformUserId || !params.holdersPoolUserId) {
      throw new Error('platformUserId and holdersPoolUserId are required')
    }
    if (params.referralUserId === undefined || params.referralUserId === null) {
      throw new Error('referralUserId is required')
    }

    const split = splitAdsUnits(totalUnits)
    const platformAmount = formatUnits(split.platform)
    const burnAmount = formatUnits(split.burn)
    const referralAmount = formatUnits(split.referral)
    const holdersAmount = formatUnits(split.holders)
    const splitBaseMetadata = {
      splitRule: '60/20/10/10',
      totalAmount: formatUnits(totalUnits)
    }

    const platformTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.platformUserId,
      amount: platformAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'platform',
        splitPercent: 60,
        ...(params.metadata ?? {})
      }
    })

    const burnTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: null,
      amount: burnAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'burn',
        splitPercent: 10,
        burn: true,
        ...(params.metadata ?? {})
      }
    })

    const referralTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.referralUserId,
      amount: referralAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'referral',
        splitPercent: 10,
        ...(params.metadata ?? {})
      }
    })

    const holdersTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.holdersPoolUserId,
      amount: holdersAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'holders_pool',
        splitPercent: 20,
        ...(params.metadata ?? {})
      }
    })

    return {
      platformTransaction,
      burnTransaction,
      referralTransaction,
      holdersTransaction
    }
  }

  if (params.type === 'CONTENT_PURCHASE' || params.type === 'LIVE_ENTRY') {
    if (!params.platformUserId || !params.holdersPoolUserId) {
      throw new Error('platformUserId and holdersPoolUserId are required')
    }
    if (!params.toUserId) {
      throw new Error('toUserId is required')
    }

    const split = splitContentUnits(totalUnits)
    const creatorAmount = formatUnits(split.creator)
    const platformAmount = formatUnits(split.platform)
    const holdersAmount = formatUnits(split.holders)
    const splitBaseMetadata = {
      splitRule: '90/8/2',
      totalAmount: formatUnits(totalUnits)
    }

    const creatorTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.toUserId,
      amount: creatorAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'creator',
        splitPercent: 90,
        ...(params.metadata ?? {})
      }
    })

    const platformTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.platformUserId,
      amount: platformAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'platform',
        splitPercent: 8,
        ...(params.metadata ?? {})
      }
    })

    const holdersTransaction = await appendTransaction(prisma, {
      fromUserId: params.fromUserId ?? null,
      toUserId: params.holdersPoolUserId,
      amount: holdersAmount,
      type: params.type,
      metadata: {
        ...splitBaseMetadata,
        splitRole: 'holders_pool',
        splitPercent: 2,
        ...(params.metadata ?? {})
      }
    })

    return {
      creatorTransaction,
      platformTransaction,
      holdersTransaction
    }
  }

  const transaction = await appendTransaction(prisma, {
    fromUserId: params.fromUserId ?? null,
    toUserId: params.toUserId ?? null,
    amount: formatUnits(totalUnits),
    type: params.type,
    metadata: params.metadata ?? null
  })

  return { transaction }
}
