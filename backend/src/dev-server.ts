import { getRequestListener } from '@hono/node-server'
import { createServer } from 'http'
import app from './index'
import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { Server as SocketIOServer } from 'socket.io'

const port = 3001

// Initialize database if schema.sql exists
let db: Database.Database | undefined
if (existsSync('./schema.sql')) {
  if (!existsSync('./dev.db')) {
    console.log('📦 Initializing database from schema.sql...')
    db = new Database('./dev.db')
    const schema = readFileSync('./schema.sql', 'utf-8')
    db.exec(schema)
    console.log('✓ Database initialized')
  } else {
    db = new Database('./dev.db')
    console.log('✓ Using existing dev.db')
  }
  console.log('✅ Database features enabled')
} else {
  console.log('⚠️  No schema.sql found - database features disabled')
}

// Mock D1 Database API
class MockD1Database {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  prepare(sql: string) {
    const stmt = this.db.prepare(sql)
    return {
      bind: (...params: any[]) => ({
        all: () => {
          const startTime = Date.now()
          try {
            const results = stmt.all(...params)
            return {
              success: true,
              results,
              meta: {
                served_by: 'dev-server',
                duration: Date.now() - startTime,
                changes: 0,
                last_row_id: 0,
                changed_db: false,
                size_after: 0,
                rows_read: results.length,
                rows_written: 0
              }
            }
          } catch (error: any) {
            console.error('D1 query error:', error.message)
            throw error
          }
        },
        first: () => {
          try {
            return stmt.get(...params) || null
          } catch (error: any) {
            console.error('D1 query error:', error.message)
            return null
          }
        },
        run: () => {
          const startTime = Date.now()
          try {
            const info = stmt.run(...params)
            return {
              success: true,
              results: [],
              meta: {
                served_by: 'dev-server',
                duration: Date.now() - startTime,
                changes: info.changes,
                last_row_id: info.lastInsertRowid,
                changed_db: info.changes > 0,
                size_after: 0,
                rows_read: 0,
                rows_written: info.changes
              }
            }
          } catch (error: any) {
            console.error('D1 query error:', error.message)
            throw error
          }
        }
      })
    }
  }

  async batch(statements: any[]) {
    const results = []
    for (const stmt of statements) {
      results.push(await stmt.all())
    }
    return results
  }

  async exec(sql: string) {
    try {
      this.db.exec(sql)
      return { count: 0, duration: 0 }
    } catch (error: any) {
      console.error('D1 exec error:', error.message)
      throw error
    }
  }
}

// Mock Cloudflare Workers environment
const mockEnv = {
  DB: db ? (new MockD1Database(db) as any) : undefined,
  CACHE: undefined,
  STORAGE: undefined,
  ENVIRONMENT: 'development'
}

const server = createServer(
  getRequestListener((req) => app.fetch(req, mockEnv))
)

const io = new SocketIOServer(server, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  socket.on('chat:join', (roomId: string) => {
    socket.join(roomId)
  })
  socket.on('chat:leave', (roomId: string) => {
    socket.leave(roomId)
  })
  socket.on('chat:message', (payload: { roomId: string; message: string; senderId?: string }) => {
    io.to(payload.roomId).emit('chat:message', payload)
  })
  socket.on('webrtc:join', (roomId: string) => {
    socket.join(roomId)
    socket.to(roomId).emit('webrtc:peer-joined', { socketId: socket.id })
  })
  socket.on('webrtc:leave', (roomId: string) => {
    socket.leave(roomId)
    socket.to(roomId).emit('webrtc:peer-left', { socketId: socket.id })
  })
  socket.on('webrtc:offer', (payload: { roomId: string; sdp: unknown }) => {
    socket.to(payload.roomId).emit('webrtc:offer', payload)
  })
  socket.on('webrtc:answer', (payload: { roomId: string; sdp: unknown }) => {
    socket.to(payload.roomId).emit('webrtc:answer', payload)
  })
  socket.on('webrtc:ice-candidate', (payload: { roomId: string; candidate: unknown }) => {
    socket.to(payload.roomId).emit('webrtc:ice-candidate', payload)
  })
  socket.on(
    'call-user',
    (payload: { to: string; offer: unknown; type?: 'audio' | 'video' }) => {
      io.to(payload.to).emit('incoming-call', {
        from: socket.id,
        offer: payload.offer,
        type: payload.type ?? 'audio'
      })
    }
  )
  socket.on(
    'make-answer',
    (payload: { to: string; answer: unknown; type?: 'audio' | 'video' }) => {
      io.to(payload.to).emit('answer-made', {
        from: socket.id,
        answer: payload.answer,
        type: payload.type ?? 'audio'
      })
    }
  )
  socket.on('ice-candidate', (payload: { to: string; candidate: unknown }) => {
    io.to(payload.to).emit('ice-candidate', {
      from: socket.id,
      candidate: payload.candidate
    })
  })
  socket.on('disconnect', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('webrtc:peer-left', { socketId: socket.id })
      }
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Dev server running at http://localhost:${port}`)
  console.log('🛰️  Socket.io listening for chat + WebRTC signaling')
  if (!db) {
    console.log('💡 To enable database, create a schema.sql file')
  }
  console.log('💡 Use "npm run dev:wrangler" for full Workers emulation (requires glibc)')
})
