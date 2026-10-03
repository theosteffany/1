import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullScreenLoader } from '@/components/common/FullScreenLoader'
import { experienceForRole, homePathFor, type Experience } from '@/domain/roles'

import { useAuth } from './auth-context'

/** Requires a session. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { initialising, session } = useAuth()
  const location = useLocation()
  if (initialising) return <FullScreenLoader />
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return children ?? <Outlet />
}

/**
 * Requires a completed onboarding AND the right experience for the route.
 * UX routing only — data access is enforced by RLS regardless of route.
 */
export function RequireExperience({ experience }: { experience: Experience }) {
  const { profile, profileLoading } = useAuth()
  if (profileLoading) return <FullScreenLoader />
  if (!profile?.primary_role || !profile.onboarded_at) return <Navigate to="/onboarding" replace />
  const actual = experienceForRole(profile.primary_role)
  // Organisation admins use the professional shell until Phase 7.
  const resolved: Experience = actual === 'organisation' ? 'professional' : actual
  if (resolved !== experience) return <Navigate to={homePathFor(resolved)} replace />
  return <Outlet />
}

/** Sends a signed-in user to the right place; signed-out users to sign in. */
export function RootRedirect() {
  const { initialising, session, profile, profileLoading } = useAuth()
  if (initialising || profileLoading) return <FullScreenLoader />
  if (!session) return <Navigate to="/sign-in" replace />
  if (!profile?.primary_role || !profile.onboarded_at) return <Navigate to="/onboarding" replace />
  const exp = experienceForRole(profile.primary_role)
  return <Navigate to={homePathFor(exp === 'organisation' ? 'professional' : exp)} replace />
}

/** For sign-in / sign-up: bounce signed-in users home. */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { initialising, session } = useAuth()
  if (initialising) return <FullScreenLoader />
  if (session) return <Navigate to="/" replace />
  return children
}
