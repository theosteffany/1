import { getSupabase } from '@/lib/supabase/client'
import { unwrap } from '@/lib/supabase/errors'
import type { Json } from '@/types/database.types'
import type { AppRole, Profile } from '@/types/domain'

export async function getProfile(userId: string): Promise<Profile | null> {
  return unwrap(await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle())
}

export interface OnboardingInput {
  role: AppRole
  fullName: string
  details: Record<string, string>
}

export async function completeOnboarding(input: OnboardingInput): Promise<Profile> {
  return unwrap(
    await getSupabase().rpc('complete_onboarding', {
      p_role: input.role,
      p_full_name: input.fullName,
      p_details: input.details as Json,
    }),
  )
}
