import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'

import { getSupabase } from '@/lib/supabase/client'
import { getProfile } from '@/services/data/profiles'
import { queryKeys } from '@/services/data/query-keys'

import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setInitialising(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'SIGNED_OUT') queryClient.clear()
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [queryClient])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: queryKeys.profile(userId ?? 'anonymous'),
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })

  const refreshProfile = useCallback(async () => {
    if (userId) await queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
  }, [queryClient, userId])

  const value = useMemo<AuthContextValue>(
    () => ({
      initialising,
      session,
      user: session?.user ?? null,
      profile: profileQuery.data ?? null,
      profileLoading: !!userId && profileQuery.isPending,
      refreshProfile,
      async signIn(email, password) {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp({ email, password, fullName }) {
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/onboarding` },
        })
        if (error) throw error
        return { needsConfirmation: !data.session }
      },
      async signOut() {
        await getSupabase().auth.signOut()
      },
    }),
    [initialising, session, userId, profileQuery.data, profileQuery.isPending, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
