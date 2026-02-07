import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import { generateMockSolanaAddress } from './solana'

type EnvWithDb = {
  DB?: D1Database
}

const prismaByDb = new WeakMap<D1Database, PrismaClient>()
const prismaDefaultsApplied = new WeakSet<PrismaClient>()

const applySolanaDefaults = (client: PrismaClient) => {
  if (prismaDefaultsApplied.has(client)) return
  client.$use(async (params, next) => {
    if (params.model === 'User') {
      const applyDefaults = (data: Record<string, unknown>) => {
        if (!data.solanaAddress) {
          const seed = typeof data.phone === 'string' ? data.phone : undefined
          data.solanaAddress = generateMockSolanaAddress(seed)
        }
        if (data.isVerifiedKYC === undefined) {
          data.isVerifiedKYC = false
        }
      }

      if (params.action === 'create' && params.args?.data) {
        applyDefaults(params.args.data as Record<string, unknown>)
      }

      if (params.action === 'createMany' && params.args?.data) {
        const data = params.args.data
        if (Array.isArray(data)) {
          data.forEach((entry) => applyDefaults(entry as Record<string, unknown>))
        } else {
          applyDefaults(data as Record<string, unknown>)
        }
      }
    }

    return next(params)
  })
  prismaDefaultsApplied.add(client)
}

export const getPrisma = (env: EnvWithDb) => {
  if (!env.DB) {
    throw new Error('D1 database not configured. Add [[d1_databases]] to wrangler.toml')
  }
  let prisma = prismaByDb.get(env.DB)
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: new PrismaD1(env.DB)
    })
    prismaByDb.set(env.DB, prisma)
  }
  applySolanaDefaults(prisma)
  return prisma
}
