'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminDashboard from '@/components/AdminDashboard'

const MASTER_KEY = 'XCHAT-PRIME-777'

function generateTotpCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function XAdminPage() {
  const [step, setStep] = useState<'key' | 'totp' | 'dashboard'>('key')
  const [masterKey, setMasterKey] = useState('')
  const [totpInput, setTotpInput] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpExpiresAt, setTotpExpiresAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const timeLeft = useMemo(() => {
    if (!totpExpiresAt) return 0
    return Math.max(0, Math.ceil((totpExpiresAt - Date.now()) / 1000))
  }, [totpExpiresAt, tick])

  useEffect(() => {
    if (!totpExpiresAt) return
    const timer = window.setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [totpExpiresAt])

  const issueTotp = () => {
    const code = generateTotpCode()
    setTotpCode(code)
    setTotpExpiresAt(Date.now() + 30_000)
    setTotpInput('')
    setError(null)
    setStep('totp')
  }

  const handleMasterKey = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (masterKey.trim() !== MASTER_KEY) {
      setError('Master key invalida. Acceso denegado.')
      return
    }
    issueTotp()
  }

  const handleTotp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!totpCode || !totpExpiresAt || Date.now() > totpExpiresAt) {
      setError('El codigo expiro. Solicita uno nuevo.')
      return
    }
    if (totpInput.trim() !== totpCode) {
      setError('Codigo incorrecto. Reintenta.')
      return
    }
    setError(null)
    setStep('dashboard')
  }

  return (
    <div className="min-h-screen bg-[#07090D] text-white flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,0,229,0.15),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,225,255,0.2),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,_rgba(255,255,255,0.04)_0%,_transparent_40%,_rgba(0,225,255,0.08)_100%)]" />

      {step !== 'dashboard' && (
        <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,225,255,0.15)]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">X-ADMIN</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Master Access Gate</h1>
            <p className="text-xs text-white/50 mt-2">Two-step entry with simulated TOTP validation.</p>
          </div>

          {step === 'key' && (
            <form className="space-y-4" onSubmit={handleMasterKey}>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
                Master Key
                <input
                  value={masterKey}
                  onChange={(event) => setMasterKey(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30"
                  placeholder="Enter master key"
                />
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/50">
                Demo key: {MASTER_KEY}
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button className="w-full rounded-full bg-[#00E1FF] px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-black shadow-[0_0_18px_rgba(0,225,255,0.35)]">
                Validate Key
              </button>
            </form>
          )}

          {step === 'totp' && (
            <form className="space-y-4" onSubmit={handleTotp}>
              <div className="rounded-2xl border border-[#FF00E5]/30 bg-[#120012]/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Secure channel</p>
                <p className="mt-2 text-lg font-black text-[#FF00E5]">{totpCode}</p>
                <p className="text-xs text-white/40 mt-1">Simulated TOTP expires in {timeLeft}s.</p>
              </div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
                TOTP Code
                <input
                  value={totpInput}
                  onChange={(event) => setTotpInput(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30"
                  placeholder="Enter 6-digit code"
                />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex flex-col gap-2">
                <button className="w-full rounded-full bg-[#FF00E5] px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-black shadow-[0_0_18px_rgba(255,0,229,0.35)]">
                  Confirm Access
                </button>
                <button
                  type="button"
                  onClick={issueTotp}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white/70"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {step === 'dashboard' && (
        <>
          <AdminDashboard onClose={() => {
            setStep('key')
            setMasterKey('')
            setTotpInput('')
            setTotpCode('')
            setTotpExpiresAt(null)
            setError(null)
          }} />
          <button
            type="button"
            onClick={() => {
              setStep('key')
              setMasterKey('')
              setTotpInput('')
              setTotpCode('')
              setTotpExpiresAt(null)
              setError(null)
            }}
            className="fixed top-6 right-6 z-[130] rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70"
          >
            Lock Session
          </button>
        </>
      )}
    </div>
  )
}
