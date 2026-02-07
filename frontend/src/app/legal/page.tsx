'use client'

export default function LegalPage() {
  const docs = [
    {
      title: 'Terminos de Uso',
      desc: 'Condiciones generales para uso de XCHAT y servicios asociados.'
    },
    {
      title: 'Politica de Privacidad',
      desc: 'Tratamiento de datos personales, retencion y seguridad.'
    },
    {
      title: 'Politica KYC / AML',
      desc: 'Verificacion de identidad y cumplimiento regulatorio.'
    },
    {
      title: 'Riesgos de Token XT',
      desc: 'Riesgos asociados a activos digitales y volatilidad.'
    },
    {
      title: 'X-Launchpad Venta Privada',
      desc: 'Terminos de la venta privada, vesting y distribucion.'
    }
  ]

  return (
    <div className="min-h-screen w-full bg-[#050608] text-[#E6E8EB] px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#00F5A0]/60">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Documentos y Politicas</h1>
          <p className="text-sm text-white/60 max-w-2xl">
            Revisa los documentos clave antes de operar con XCHAT y participar en el X-Launchpad.
          </p>
        </div>

        <div className="grid gap-4">
          {docs.map(doc => (
            <div key={doc.title} className="bg-white/5 border border-white/10 rounded-[28px] p-6">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#00F5A0]">{doc.title}</h2>
              <p className="text-sm text-white/60 mt-2">{doc.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="bg-[#00F5A0] text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
          >
            Volver a XCHAT
          </a>
        </div>
      </div>
    </div>
  )
}
