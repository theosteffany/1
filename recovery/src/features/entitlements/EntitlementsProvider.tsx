import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import { FREE_FALLBACK } from '@/domain/entitlements'
import { useAuth } from '@/features/auth/auth-context'
import { getMyEntitlements } from '@/services/data/entitlements'
import { queryKeys } from '@/services/data/query-keys'

import { EntitlementsContext } from './entitlements-context'

/**
 * Loads the user's entitlements once and provides them app-wide. Falls back to
 * FREE while loading or on error — never to a more permissive plan.
 */
export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data } = useQuery({
    queryKey: queryKeys.entitlements(user?.id ?? 'anonymous'),
    queryFn: getMyEntitlements,
    enabled: !!user,
    staleTime: 5 * 60_000,
  })
  return <EntitlementsContext.Provider value={data ?? FREE_FALLBACK}>{children}</EntitlementsContext.Provider>
}
