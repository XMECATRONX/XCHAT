// This file will be regenerated when modules are added
// Run: nxcode generate

'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeName = 'ruby-shadow' | 'rose-silk'

type ThemeContextValue = {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [theme, setTheme] = useState<ThemeName>('ruby-shadow')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme((current) => (current === 'ruby-shadow' ? 'rose-silk' : 'ruby-shadow'))
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within Providers')
  }
  return context
}
