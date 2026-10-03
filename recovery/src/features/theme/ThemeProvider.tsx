import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { ThemeContext, type ThemePreference } from './theme-context'

const STORAGE_KEY = 'chq-theme'

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light' || v === 'system') return v
  } catch {
    /* storage unavailable */
  }
  return 'dark'
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a0a0b' : '#fafaf9')
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      /* storage unavailable */
    }
  }, [preference, resolved])

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
