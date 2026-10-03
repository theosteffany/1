import { getSupabase } from '@/lib/supabase/client'
import { unwrap } from '@/lib/supabase/errors'
import type { Functions } from '@/types/database.types'

export type StatusBoardRow = Functions<'get_athlete_status_board'>['Returns'][number]

/**
 * Athletes the signed-in professional is authorised to see availability for.
 * Server-side function: only returns data permitted by the caller's scopes.
 */
export async function getStatusBoard(): Promise<StatusBoardRow[]> {
  return unwrap(await getSupabase().rpc('get_athlete_status_board'))
}
