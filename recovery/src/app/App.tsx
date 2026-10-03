import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/features/auth/AuthProvider'
import { EntitlementsProvider } from '@/features/entitlements/EntitlementsProvider'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { env } from '@/lib/env'
import { queryClient } from '@/lib/query-client'

import { router } from './router'

function DataProviders({ children }: { children: ReactNode }) {
  if (!env.configured) return children
  return (
    <AuthProvider>
      <EntitlementsProvider>{children}</EntitlementsProvider>
    </AuthProvider>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DataProviders>
          <RouterProvider router={router} />
        </DataProviders>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
