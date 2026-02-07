import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'xchat',
  description: 'Built with Next.js and Hono'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="relative min-h-screen w-full">
            <div className="pointer-events-none absolute inset-0 z-40 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            <div className="pointer-events-none absolute inset-0 z-40 opacity-15 mix-blend-soft-light bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:3px_3px]" />
            <div className="pointer-events-none absolute top-4 left-4 text-[10px] opacity-50 z-40">LAT 34.0522 N / LONG 118.2437 W</div>
            <div className="pointer-events-none absolute top-4 right-4 text-[10px] opacity-50 z-40">SENSORS: ACTIVE</div>
            <div className="relative z-10">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
