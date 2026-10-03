import { parseEntitlements, type Entitlements } from '@/domain/entitlements'
import { getSupabase } from '@/lib/supabase/client'
import { unwrap } from '@/lib/supabase/errors'

export async function getMyEntitlements(): Promise<Entitlements> {
  return parseEntitlements(unwrap(await getSupabase().rpc('get_my_entitlements')))
}
