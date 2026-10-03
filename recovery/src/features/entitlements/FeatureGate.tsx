import type { ReactNode } from 'react'

import type { Feature } from '@/domain/entitlements'

import { useEntitlement } from './entitlements-context'

/**
 * Renders children only when the user is entitled to `feature`.
 * Gating here is presentation only; anything sensitive is ALSO enforced
 * server-side (RLS / RPC / edge function).
 */
export function FeatureGate({ feature, children, fallback = null }: { feature: Feature; children: ReactNode; fallback?: ReactNode }) {
  const { enabled } = useEntitlement(feature)
  return <>{enabled ? children : fallback}</>
}
