'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

type ViewerRole = 'USER' | 'XTTOR'

type LiveStreamingProps = {
  viewerRole: ViewerRole
  userId?: string | null
}

const liveEvent = {
  id: 'nova-77',
  title: 'Neon Pulse Session',
  host: 'NovaX',
  price: 8
}

export function LiveStreaming({ viewerRole, userId }: LiveStreamingProps) {
  const [hasTicket, setHasTicket] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const ticketKey = useMemo(() => {
    if (userId) return `xchat-ticket-${userId}-${liveEvent.id}`
    return `xchat-ticket-guest-${liveEvent.id}`
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(ticketKey)
    if (stored === 'purchased') {
      setHasTicket(true)
    }
  }, [ticketKey])

  const handlePurchase = async () => {
    setStatus(null)
    setIsPurchasing(true)
    try {
      await api.post('/api/ledger/append', {
        amount: liveEvent.price,
        type: 'CALL'
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem(ticketKey, 'purchased')
      }
      setHasTicket(true)
      setStatus('Ticket confirmed. Enjoy the stream.')
    } catch (error) {
      setStatus('Ticket purchase failed. Try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <section className="card live-card">
      <div className="split-row">
        <div>
          <h2>Live Streaming</h2>
          <p>Premium sessions with encrypted ticket access.</p>
        </div>
        <span className="live-status">
          <span className="live-badge" />
          Live Now
        </span>
      </div>

      <div className="list-item">
        <div>
          <strong>{liveEvent.title}</strong>
          <p className="pill" style={{ marginTop: '6px' }}>
            Host: {liveEvent.host}
          </p>
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{liveEvent.price} XTK</div>
          <div className="pill" style={{ marginTop: '6px' }}>
            Ticket
          </div>
        </div>
      </div>

      {viewerRole === 'XTTOR' ? (
        <button className="action" type="button">
          Launch Creator Control Room
        </button>
      ) : (
        <button
          className="action"
          type="button"
          onClick={handlePurchase}
          disabled={hasTicket || isPurchasing}
        >
          {hasTicket ? 'Ticket Unlocked' : isPurchasing ? 'Processing...' : 'Buy Ticket'}
        </button>
      )}

      {status ? <p>{status}</p> : null}
    </section>
  )
}
