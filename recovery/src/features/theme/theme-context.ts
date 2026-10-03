import { createContext, useContext } from 'react'

export type ThemePreference = 'dark' | 'light' | 'system'

export interface ThemeContextValue {
  preference: ThemePreference
  resolved: 'dark' | 'light'
  setPreference: (p: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
