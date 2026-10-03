import { getSupabase } from '@/lib/supabase/client'
import { unwrap } from '@/lib/supabase/errors'
import type { Notification } from '@/types/domain'

export async function listNotifications(limit = 30): Promise<Notification[]> {
  return unwrap(
    await getSupabase().from('notifications').select('*').order('created_at', { ascending: false }).limit(limit),
  )
}

export async function markAllNotificationsRead(): Promise<void> {
  unwrap(await getSupabase().rpc('mark_all_notifications_read'))
}
