'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type RegistrationStep = 'phone' | 'otp' | 'username' | 'dob' | 'consent'

type RegistrationProps = {
  onComplete: () => void
}

export default function Registration({ onComplete }: RegistrationProps) {
  const [regStep, setRegStep] = useState<RegistrationStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null)
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)

  const regSteps: RegistrationStep[] = ['phone', 'otp', 'username', 'dob', 'consent']
  const regStepIndex = regSteps.indexOf(regStep)
  const regStepLabel = `Paso ${regStepIndex + 1} / ${regSteps.length}`
  const days = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0'))
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  const years = Array.from({ length: 100 }, (_, index) => String(new Date().getFullYear() - index))
  const isPhoneValid = phone.trim().length > 0
  const isOtpValid = otp.trim().length >= 6
  const isUsernameFilled = username.trim().length > 0
  const isUsernameValid = isUsernameFilled && usernameAvailable === true && !usernameChecking
  const hasDob = Boolean(dobDay && dobMonth && dobYear)
  const birthDate = hasDob ? new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay)) : null
  const isUnderage = (() => {
    if (!birthDate) return false
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1
    }
    return age < 18
  })()

  useEffect(() => {
    if (!isUsernameFilled) {
      setUsernameChecking(false)
      setUsernameAvailable(null)
      return
    }
    setUsernameChecking(true)
    setUsernameAvailable(null)
    const handle = setTimeout(() => {
      const lowered = username.trim().toLowerCase()
      const taken = lowered.includes('admin') || lowered.includes('test')
      setUsernameAvailable(!taken)
      setUsernameChecking(false)
    }, 450)
    return () => clearTimeout(handle)
  }, [username, isUsernameFilled])

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E6E8EB] flex items-center justify-center p-8 md:p-12 lg:p-16">
      <div className="w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-black tracking-tighter text-[#00F5A0] uppercase">XCHAT</h1>
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {regStepLabel}
          </div>
        </div>

        <div className="flex flex-col">
          {regStep === 'phone' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Comienza ahora</h2>
              <p className="text-sm text-white/50 mb-8">Ingresa tu número para validar tu acceso.</p>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Teléfono +34 000 000 000"
                className="w-full bg-transparent border-b-2 border-[#00F5A0]/30 py-4 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F5A0] transition-colors mb-8"
              />
              <button
                disabled={!isPhoneValid}
                onClick={() => setRegStep('otp')}
                className={`w-full py-4 rounded-2xl text-black font-black uppercase tracking-widest transition-all ${isPhoneValid ? 'bg-[#00F5A0] shadow-[0_0_30px_#00F5A044] active:scale-95' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
              >
                Continuar
              </button>
            </div>
          )}

          {regStep === 'otp' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Verifica tu número</h2>
              <p className="text-sm text-white/50 mb-8">Ingresa el código enviado por SMS.</p>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Código de 6 dígitos"
                className="w-full bg-transparent border-b-2 border-[#00F5A0]/30 py-4 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F5A0] transition-colors mb-8"
              />
              <div className="flex flex-col gap-4">
                <button
                  disabled={!isOtpValid}
                  onClick={() => setRegStep('username')}
                  className={`w-full py-4 rounded-2xl text-black font-black uppercase tracking-widest transition-all ${isOtpValid ? 'bg-[#00F5A0] shadow-[0_0_30px_#00F5A044] active:scale-95' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
                >
                  Verificar
                </button>
                <button
                  onClick={() => setRegStep('phone')}
                  className="w-full py-4 text-sm font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Editar teléfono
                </button>
              </div>
            </div>
          )}

          {regStep === 'username' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Tu identidad</h2>
              <p className="text-sm text-white/50 mb-8">Crea un nombre de usuario único.</p>
              <div className="relative mb-8">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl text-white/40 font-bold">@</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="usuario"
                  className="w-full bg-transparent border-b-2 border-[#00F5A0]/30 py-4 pl-6 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F5A0] transition-colors"
                />
              </div>
              {isUsernameFilled && (
                <p className={`text-sm font-semibold tracking-wide mb-6 ${usernameChecking ? 'text-white/40' : usernameAvailable ? 'text-[#00F5A0]' : 'text-[#FF3B3B]'}`}>
                  {usernameChecking ? 'Comprobando disponibilidad...' : usernameAvailable ? 'Disponible' : 'No disponible'}
                </p>
              )}
              <button
                disabled={!isUsernameValid}
                onClick={() => setRegStep('dob')}
                className={`w-full py-4 rounded-2xl text-black font-black uppercase tracking-widest transition-all ${isUsernameValid ? 'bg-[#00F5A0] shadow-[0_0_30px_#00F5A044] active:scale-95' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
              >
                Continuar
              </button>
            </div>
          )}

          {regStep === 'dob' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Confirma tu edad</h2>
              <p className="text-sm text-white/50 mb-8">Debes ser mayor de edad para acceder.</p>
              <div className="grid grid-cols-3 gap-4 mb-12">
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="bg-white/5 border-b-2 border-[#00F5A0]/30 p-4 text-white focus:outline-none focus:border-[#00F5A0] appearance-none"
                >
                  <option value="" disabled>Día</option>
                  {days.map(d => <option key={d} value={d} className="bg-[#0B0D10]">{d}</option>)}
                </select>
                <select
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  className="bg-white/5 border-b-2 border-[#00F5A0]/30 p-4 text-white focus:outline-none focus:border-[#00F5A0] appearance-none"
                >
                  <option value="" disabled>Mes</option>
                  {months.map(m => <option key={m} value={m} className="bg-[#0B0D10]">{m}</option>)}
                </select>
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className="bg-white/5 border-b-2 border-[#00F5A0]/30 p-4 text-white focus:outline-none focus:border-[#00F5A0] appearance-none"
                >
                  <option value="" disabled>Año</option>
                  {years.map(y => <option key={y} value={y} className="bg-[#0B0D10]">{y}</option>)}
                </select>
              </div>
              {isUnderage && (
                <p className="text-sm font-semibold text-[#FF3B3B] mb-6">
                  Acceso denegado: Debes ser mayor de 18 años.
                </p>
              )}
              <button
                disabled={!hasDob || isUnderage}
                onClick={() => setRegStep('consent')}
                className={`w-full py-4 rounded-2xl text-black font-black uppercase tracking-widest transition-all ${hasDob && !isUnderage ? 'bg-[#00F5A0] shadow-[0_0_30px_#00F5A044] active:scale-95' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
              >
                Continuar
              </button>
            </div>
          )}

          {regStep === 'consent' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Legal y Seguridad</h2>
              <p className="text-sm text-white/50 mb-8">Al continuar, confirmas que eres mayor de edad.</p>
              <div 
                onClick={() => setConsentAccepted(!consentAccepted)}
                className="flex items-start gap-4 cursor-pointer mb-12"
              >
                <div className={`mt-1 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${consentAccepted ? 'bg-[#00F5A0] border-[#00F5A0]' : 'border-white/20'}`}>
                  {consentAccepted && <X className="w-4 h-4 text-black" />}
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Declaro bajo mi responsabilidad que la información proporcionada es verídica. Acepto los términos de uso y entiendo que el contenido es exclusivamente para adultos.
                </p>
              </div>
              <button
                disabled={!consentAccepted}
                onClick={onComplete}
                className={`w-full py-4 rounded-2xl text-black font-black uppercase tracking-widest transition-all ${consentAccepted ? 'bg-[#00F5A0] shadow-[0_0_30px_#00F5A044] active:scale-95' : 'bg-white/10 opacity-50'}`}
              >
                Entrar a XCHAT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
