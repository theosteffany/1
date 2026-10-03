import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

import { getSupabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type TableName = keyof Database['public']['Tables']

export interface RealtimeSubscription {
  table: TableName
  /** PostgREST-style filter, e.g. `athlete_id=eq.<uuid>`. */
  filter?: string
}

/**
 * Subscribes to Postgres changes and invalidates the given queries when a
 * matching row changes. Realtime evaluates RLS per subscriber, so a client
 * only ever receives events for rows it is allowed to read.
 */
export function useRealtimeInvalidation(
  channelName: string,
  subscriptions: RealtimeSubscription[],
  queryKey: QueryKey,
  enabled = true,
): void {
  const queryClient = useQueryClient()
  // Stable dependency for array/object inputs.
  const subsKey = JSON.stringify(subscriptions)
  const keyString = JSON.stringify(queryKey)

  useEffect(() => {
    if (!enabled) return
    const supabase = getSupabase()
    const subs = JSON.parse(subsKey) as RealtimeSubscription[]
    const key = JSON.parse(keyString) as QueryKey
    let channel = supabase.channel(channelName)
    for (const sub of subs) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: sub.table, ...(sub.filter ? { filter: sub.filter } : {}) },
        () => void queryClient.invalidateQueries({ queryKey: key }),
      )
    }
    channel.subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [channelName, subsKey, keyString, enabled, queryClient])
}
