import { createContext, useContext } from 'react'

import { checkEntitlement, FREE_FALLBACK, type EntitlementCheck, type Entitlements, type Feature } from '@/domain/entitlements'

export const EntitlementsContext = createContext<Entitlements>(FREE_FALLBACK)

export function useEntitlements(): Entitlements {
  return useContext(EntitlementsContext)
}

/** The single way UI code asks "can this user use X?". */
export function useEntitlement(feature: Feature): EntitlementCheck {
  return checkEntitlement(useEntitlements(), feature)
}
