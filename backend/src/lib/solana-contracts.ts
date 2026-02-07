import { createHash, randomBytes } from 'crypto'

export interface PulseBurnInput {
  amount: number
  initiator: string
  timestamp?: number
  burnRate?: number
  vaultRate?: number
  treasuryRate?: number
}

export interface VaultRelease {
  index: number
  unlockDate: string
  unlockAmount: number
  cumulativeUnlocked: number
  remainingLocked: number
}

export interface PulseBurnResult {
  txId: string
  timestamp: string
  amount: number
  burnAmount: number
  vaultAmount: number
  treasuryAmount: number
  netAmount: number
  burnAddress: string
  vaultAddress: string
  treasuryAddress: string
  vaultSchedule: VaultRelease[]
}

const DEFAULT_BURN_RATE = 0.08
const DEFAULT_VAULT_RATE = 0.18
const DEFAULT_TREASURY_RATE = 0.04
const VAULT_YEARS = 8

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function clampRate(rate: number) {
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error('Invalid rate provided')
  }
  return rate
}

function createAddress(seed: string) {
  return `So${sha256(seed).slice(0, 42)}`
}

function buildVaultSchedule(amount: number, start: Date) {
  const months = VAULT_YEARS * 12
  const perMonth = amount / months
  const schedule: VaultRelease[] = []
  let cumulative = 0

  for (let i = 1; i <= months; i += 1) {
    cumulative += perMonth
    const unlockDate = new Date(start)
    unlockDate.setMonth(unlockDate.getMonth() + i)
    const remaining = Math.max(amount - cumulative, 0)
    schedule.push({
      index: i,
      unlockDate: unlockDate.toISOString(),
      unlockAmount: Number(perMonth.toFixed(6)),
      cumulativeUnlocked: Number(cumulative.toFixed(6)),
      remainingLocked: Number(remaining.toFixed(6))
    })
  }

  return schedule
}

export function createPulseBurn(input: PulseBurnInput): PulseBurnResult {
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  const burnRate = clampRate(input.burnRate ?? DEFAULT_BURN_RATE)
  const vaultRate = clampRate(input.vaultRate ?? DEFAULT_VAULT_RATE)
  const treasuryRate = clampRate(input.treasuryRate ?? DEFAULT_TREASURY_RATE)

  const totalRate = burnRate + vaultRate + treasuryRate
  if (totalRate >= 1) {
    throw new Error('Combined rates must be less than 1')
  }

  const burnAmount = Number((amount * burnRate).toFixed(6))
  const vaultAmount = Number((amount * vaultRate).toFixed(6))
  const treasuryAmount = Number((amount * treasuryRate).toFixed(6))
  const netAmount = Number((amount - burnAmount - vaultAmount - treasuryAmount).toFixed(6))

  const timestamp = new Date(input.timestamp ?? Date.now())
  const seed = `${input.initiator}:${timestamp.toISOString()}:${randomBytes(8).toString('hex')}`
  const txId = sha256(seed).slice(0, 48)

  return {
    txId,
    timestamp: timestamp.toISOString(),
    amount,
    burnAmount,
    vaultAmount,
    treasuryAmount,
    netAmount,
    burnAddress: createAddress(`${seed}:burn`),
    vaultAddress: createAddress(`${seed}:vault`),
    treasuryAddress: createAddress(`${seed}:treasury`),
    vaultSchedule: buildVaultSchedule(vaultAmount, timestamp)
  }
}

export function previewVaultRelease(
  amount: number,
  startTimestamp = Date.now(),
  yearOffset = 1
) {
  const schedule = buildVaultSchedule(amount, new Date(startTimestamp))
  const targetMonth = Math.min(Math.max(yearOffset, 1) * 12, schedule.length)
  return schedule[targetMonth - 1]
}
