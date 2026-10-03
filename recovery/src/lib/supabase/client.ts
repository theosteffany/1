import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

export type TypedSupabaseClient = SupabaseClient<Database>

let client: TypedSupabaseClient | null = null

/**
 * The single browser Supabase client. Uses the public anon key only — every
 * read and write is authorised by Row Level Security in the database.
 */
export function getSupabase(): TypedSupabaseClient {
  if (!env.configured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  client ??= createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}
