// This file will be regenerated when modules are added
// Run: nxcode generate

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { exampleRoutes } from './routes/example'
import { ledgerRoutes } from './routes/ledger'
import { mediaRoutes } from './routes/media'
import { packRoutes } from './routes/packs'
import { flashSaleRoutes } from './routes/flash-sales'
import { subscriptionRoutes } from './routes/subscriptions'
import { admin } from './routes/admin'
import { kyc } from './routes/kyc'

type Bindings = {
  DB?: D1Database
  CACHE?: KVNamespace
  STORAGE?: R2Bucket
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', logger())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Health check (outside /api for infrastructure probes)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

// API Routes
app.route('/api', exampleRoutes)
app.route('/api', ledgerRoutes)
app.route('/api', mediaRoutes)
app.route('/api', packRoutes)
app.route('/api', flashSaleRoutes)
app.route('/api', subscriptionRoutes)
app.route('/api/admin', admin)
app.route('/api/kyc', kyc)

export default app
// Minimal addition to check if write works
