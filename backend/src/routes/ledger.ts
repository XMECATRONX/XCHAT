import { Hono } from 'hono'
import { getPrisma } from '../lib/prisma'
import { appendTransaction, calculateSwapBreakdown, parseAmountToUnits, processPayment, type LedgerTransactionInput } from '../lib/ledger'
import { Prisma } from '@prisma/client'
import { TransactionType } from '../lib/transaction-types'

const ledgerRoutes = new Hono()

type LedgerAppendPayload = {
  amount?: string | number
  type?: LedgerTransactionInput['type']
  label?: string
  metadata?: Record<string, unknown>
  fromUserId?: number | null
  toUserId?: number | null
}

ledgerRoutes.get('/ledger/balance', async (c) => {
  const prisma = getPrisma(c.env)
  const s = await prisma.transaction.aggregate({ _sum: { amount: true } })
  return c.json({ balance: Number(s._sum.amount ?? 0) })
})

ledgerRoutes.get('/ledger/history', async (c) => {
  const prisma = getPrisma(c.env)
  const txs = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return c.json({ transactions: txs })
})

ledgerRoutes.post('/ledger/append', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  const {
    amount,
    type,
    label,
    metadata,
    fromUserId,
    toUserId
  } = payload as LedgerAppendPayload

  if (amount === undefined || amount === null) {
    return c.json({ error: 'amount is required' }, 400)
  }

  const numericAmount = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(numericAmount)) {
    return c.json({ error: 'amount must be a number' }, 400)
  }

  const normalizedType = type ?? (numericAmount < 0 ? 'DEBIT' : 'CREDIT')

  const transaction = await appendTransaction(prisma, {
    fromUserId: fromUserId ?? null,
    toUserId: toUserId ?? null,
    amount: numericAmount,
    type: normalizedType,
    metadata: {
      ...(metadata ?? {}),
      label: label ?? null
    }
  })

  return c.json({ transaction })
})

ledgerRoutes.post('/ledger/pay', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }
  const {
    amount,
    reason,
    metadata,
    buyerId,
    platformUserId,
    holdersPoolUserId,
    referralUserId
  } = payload as {
    amount?: string | number
    reason?: string
    metadata?: Record<string, unknown>
    buyerId?: number
    platformUserId?: number
    holdersPoolUserId?: number
    referralUserId?: number | null
  }
  if (amount === undefined || amount === null) {
    return c.json({ error: 'amount is required' }, 400)
  }

  if (
    (reason === 'ad_purchase' || reason === 'posicionamiento') &&
    (!buyerId || !platformUserId || !holdersPoolUserId || referralUserId === null || referralUserId === undefined)
  ) {
    return c.json({
      error: 'buyerId, platformUserId, holdersPoolUserId, referralUserId are required'
    }, 400)
  }

  if (
    (reason === 'ad_purchase' || reason === 'posicionamiento') &&
    buyerId &&
    platformUserId &&
    holdersPoolUserId &&
    referralUserId !== undefined &&
    referralUserId !== null
  ) {
    const type = 'AD_PURCHASE'
    const splitTransactions = await processPayment(prisma, {
      fromUserId: buyerId,
      amount,
      type,
      platformUserId,
      holdersPoolUserId,
      referralUserId,
      metadata: {
        ...(metadata ?? {}),
        reason: reason ?? null
      }
    })
    return c.json({ transactions: splitTransactions })
  }

  const tx = await appendTransaction(prisma, {
    amount: -Number(amount),
    type: reason === 'ad_purchase' ? 'AD_PURCHASE' : TransactionType.PAY_TO_UNLOCK,
    metadata: {
      ...(metadata ?? {}),
      reason: reason ?? null
    }
  })
  return c.json({ transaction: tx })
})

ledgerRoutes.post('/swap', async (c) => {
  const prisma = getPrisma(c.env)
  const payload = await c.req.json().catch(() => null)
  if (!payload) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  const { userId, amount, insurance, metadata, treasuryUserId } = payload as {
    userId?: number
    amount?: string | number
    insurance?: boolean
    metadata?: Record<string, unknown>
    treasuryUserId?: number
  }

  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }
  if (amount === undefined || amount === null) {
    return c.json({ error: 'amount is required' }, 400)
  }

  let breakdown: ReturnType<typeof calculateSwapBreakdown>
  try {
    breakdown = calculateSwapBreakdown({ amount, insurance })
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const treasury = treasuryUserId
    ? await prisma.user.findUnique({ where: { id: treasuryUserId } })
    : await prisma.user.findFirst({
      where: {
        OR: [
          { phone: 'treasury' },
          { role: 'TREASURY' }
        ]
      }
    })
  let treasuryAccount = treasury
  if (!treasuryAccount) {
    treasuryAccount = await prisma.user.create({
      data: {
        phone: 'treasury',
        role: 'TREASURY'
      }
    })
  }

  if (!treasuryAccount) {
    return c.json({ error: 'Treasury account not found' }, 404)
  }

  const balanceUnits = parseAmountToUnits(user.balanceXT.toString())
  if (balanceUnits < breakdown.totalUnits) {
    return c.json({ error: 'Insufficient balance' }, 400)
  }

  const swapType = 'SWAP' as TransactionType
  const swapTransaction = await appendTransaction(prisma, {
    fromUserId: userId,
    toUserId: null,
    amount: breakdown.netAmount,
    type: swapType,
    metadata: {
      ...(metadata ?? {}),
      grossAmount: breakdown.grossAmount,
      spreadAmount: breakdown.spreadAmount,
      insuranceAmount: breakdown.insuranceAmount,
      feeAmount: breakdown.feeAmount,
      insuranceSelected: breakdown.insuranceSelected,
      treasuryUserId: treasuryAccount.id
    }
  })

  const treasuryFeeTransaction = await appendTransaction(prisma, {
    fromUserId: userId,
    toUserId: treasuryAccount.id,
    amount: breakdown.feeAmount,
    type: swapType,
    metadata: {
      ...(metadata ?? {}),
      feeRole: 'treasury',
      grossAmount: breakdown.grossAmount,
      spreadAmount: breakdown.spreadAmount,
      insuranceAmount: breakdown.insuranceAmount,
      insuranceSelected: breakdown.insuranceSelected
    }
  })

  const grossDecimal = new Prisma.Decimal(breakdown.grossAmount)
  const feeDecimal = new Prisma.Decimal(breakdown.feeAmount)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balanceXT: { decrement: grossDecimal } }
    }),
    prisma.user.update({
      where: { id: treasuryAccount.id },
      data: { balanceXT: { increment: feeDecimal } }
    })
  ])

  return c.json({
    swap: {
      grossAmount: breakdown.grossAmount,
      netAmount: breakdown.netAmount,
      spreadAmount: breakdown.spreadAmount,
      insuranceAmount: breakdown.insuranceAmount,
      feeAmount: breakdown.feeAmount,
      insuranceSelected: breakdown.insuranceSelected
    },
    transactions: {
      swap: swapTransaction,
      treasuryFee: treasuryFeeTransaction
    },
    treasury: {
      id: treasuryAccount.id
    }
  })
})

export { ledgerRoutes }
