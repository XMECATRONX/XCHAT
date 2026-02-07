'use client'
import { useState } from 'react'
import MainApp from '@/components/MainApp'
import Registration from '@/components/Registration'

type ViewMode = 'splash' | 'register' | 'main'

const renderHudLayer = () => {
  try {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-30 backdrop-blur-md">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,245,160,0.08),rgba(0,0,0,0),rgba(0,245,160,0.08))]" />
        <div className="absolute top-5 left-6 text-[10px] tracking-[0.3em] text-[#00F5A0]/80">
          SIGNAL: STABLE
        </div>
        <div className="absolute top-5 right-6 text-[10px] tracking-[0.3em] text-[#00F5A0]/80">
          HUD: ENABLED
        </div>
      </div>
    )
  } catch (error) {
    return null
  }
}

export default function Page() {
  const [view, setView] = useState<ViewMode>('splash')

  if (view === 'main') {
    return <MainApp />
  }

  if (view === 'register') {
    return <Registration onComplete={() => setView('main')} />
  }

  return (
    <div className="min-h-screen w-screen bg-[#0B0D10] text-[#00F5A0] flex items-center justify-center relative overflow-hidden">
      {renderHudLayer()}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="text-[11px] tracking-[0.6em] uppercase text-[#00F5A0]/70 mb-4">
          XCHAT CONTROL CORE
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] uppercase text-[#00F5A0] mb-6">
          SISTEMA XCHAT: ONLINE
        </h1>
        <p className="text-sm md:text-base text-[#00F5A0]/70 max-w-xl mb-10">
          Acceso confirmado. Pulsa para abrir el panel maestro.
        </p>
        <button
          onClick={() => setView('main')}
          className="px-8 py-4 bg-[#00F5A0] text-black text-sm md:text-base font-black tracking-[0.2em] uppercase rounded-full shadow-[0_0_35px_#00F5A055] hover:shadow-[0_0_55px_#00F5A0] transition-shadow"
        >
          ACCEDER AL MANDO
        </button>
        <button
          onClick={() => setView('register')}
          className="mt-4 text-[11px] tracking-[0.3em] uppercase text-[#00F5A0]/60 hover:text-[#00F5A0] transition-colors"
        >
          Registro
        </button>
      </div>
    </div>
  )
}
