'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw, Shield, X, Zap } from 'lucide-react'
import { api } from '@/lib/api'

interface AdminTransaction {
  id: number
  amount: string
  type: string
  createdAt: string
  fromUserId: number | null
  toUserId: number | null
}

interface AdminEarningsResponse {
  totalGross: string
  totalEarnings: string
  earningsRate: number
  transactions: AdminTransaction[]
}

const FALLBACK_SERIES = [0.25, 0.4, 0.3, 0.55, 0.7, 0.5, 0.65, 0.8]

function formatAmount(amount: string, digits = 2) {
  const parsed = Number.parseFloat(amount)
  if (!Number.isFinite(parsed)) return '0.00 XT'
  return `${parsed.toFixed(digits)} XT`
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const day = date.toLocaleDateString('en-CA')
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} ${time}`
}

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AdminEarningsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setError(null)
    try {
      const response = await api.get<AdminEarningsResponse>('/api/admin/earnings')
      setData(response)
    } catch {
      setError('No se pudo cargar el panel admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
    const interval = window.setInterval(fetchData, 15000)
    return () => window.clearInterval(interval)
  }, [])

  const series = useMemo(() => {
    if (!data?.transactions?.length) return FALLBACK_SERIES
    const amounts = data.transactions.slice(0, 8).map((item) => {
      const value = Number.parseFloat(item.amount)
      return Number.isFinite(value) ? value : 0
    })
    const max = Math.max(...amounts, 1)
    return amounts.map((value) => Math.max(value / max, 0.15))
  }, [data])

  const transactions = data?.transactions ?? []

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,160,0.15),_transparent_55%)]" />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#00F5A0]/30 bg-[#0B0D10]/95 shadow-[0_0_60px_rgba(0,245,160,0.15)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">God Mode</p>
            <h2 className="text-2xl font-black text-[#00F5A0]">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#00F5A0]/25 bg-gradient-to-br from-[#0F141A] via-[#0B0D10] to-[#111820] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Ganancias Totales (8%)</p>
                  <p className="mt-2 text-3xl font-black text-white">
                    {loading ? 'Cargando...' : formatAmount(data?.totalEarnings ?? '0', 2)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Base de ingresos: {formatAmount(data?.totalGross ?? '0', 2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#00F5A0]/20 text-[#00F5A0] flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end gap-2 h-24">
                  {series.map((value, index) => (
                    <div
                      key={`bar-${index}`}
                      className="flex-1 rounded-full bg-gradient-to-t from-[#00F5A0] to-[#00E1FF]"
                      style={{ height: `${Math.round(value * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40">
                  <span>Realtime</span>
                  <span>Ledger feed</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11141A]/80 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Transacciones recientes</h3>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Live</span>
              </div>
              <div className="mt-4 space-y-3">
                {transactions.length === 0 && !loading ? (
                  <p className="text-xs text-white/40">Sin actividad registrada.</p>
                ) : (
                  transactions.slice(0, 6).map((item) => (
                    <div
                      key={`txn-${item.id}`}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{item.type}</p>
                        <p className="text-[10px] text-white/40">{formatTimestamp(item.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#00F5A0]">{formatAmount(item.amount, 4)}</p>
                        <p className="text-[10px] text-white/40">
                          {item.fromUserId ?? '--'} {"->"} {item.toUserId ?? '--'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <p className="text-xs text-white/40">Sincronizando ledger...</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#11141A]/70 p-6">
              <h3 className="text-sm font-bold text-white">System Status</h3>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                  <span className="flex items-center gap-2 text-white/70"><Shield className="h-4 w-4 text-[#00F5A0]" /> Ledger Sync</span>
                  <span className="text-[#00F5A0]">OK</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                  <span className="flex items-center gap-2 text-white/70"><Zap className="h-4 w-4 text-[#00F5A0]" /> Payments</span>
                  <span className="text-[#00F5A0]">Stable</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                  <span className="flex items-center gap-2 text-white/70"><Activity className="h-4 w-4 text-[#00F5A0]" /> Streaming</span>
                  <span className="text-[#00F5A0]">Nominal</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#00E1FF]/20 bg-gradient-to-br from-[#0B0F14] to-[#0C121A] p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Security</p>
              <h3 className="mt-2 text-lg font-bold text-white">Acceso restringido</h3>
              <p className="mt-2 text-xs text-white/60">
                Este panel muestra el 8% de ingresos netos basado en el ledger.
              </p>
              {error && (
                <p className="mt-4 text-xs text-red-400">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
