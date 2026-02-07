import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret', 'salt', 32)

export function encryptBuffer(buffer: Buffer): { iv: string; data: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const result = Buffer.concat([cipher.update(buffer), cipher.final()])
  return { iv: iv.toString('hex'), data: result.toString('base64') }
}

export function decryptBuffer(ivHex: string, base64Data: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedData = Buffer.from(base64Data, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()])
}
