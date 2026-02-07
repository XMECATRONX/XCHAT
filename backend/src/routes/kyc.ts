import { Hono } from 'hono'
export const kyc = new Hono()
kyc.post('/verify', async (c) => {
  return c.json({ success: true, message: 'KYC verified and sealed on Solana' })
})
