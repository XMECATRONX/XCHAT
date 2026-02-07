import { Hono } from 'hono'
export const admin = new Hono()
admin.get('/earnings', (c) => c.json({ total: 15420, net_8_percent: 1233.6 }))
