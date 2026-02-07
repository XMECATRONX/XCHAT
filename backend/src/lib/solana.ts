import { createHash, randomBytes } from 'crypto'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function generateMockSolanaAddress(seed?: string): string {
  const entropy = seed ?? `${Date.now()}-${randomBytes(16).toString('hex')}`
  return `So${sha256(entropy).slice(0, 42)}`
}

export function generateMockSolanaWallet(params?: {
  seed?: string
  userId?: number | null
}) {
  const seed = params?.seed
    ?? `${params?.userId ?? 'anon'}-${Date.now()}-${randomBytes(16).toString('hex')}`
  return {
    publicKey: generateMockSolanaAddress(seed),
    secretKey: sha256(`${seed}:secret`)
  }
}
