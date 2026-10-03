import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { Profile } from '@/types/domain'

export interface AuthContextValue {
  /** True until the initial session has been restored. */
  initialising: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
