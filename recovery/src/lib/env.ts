import { z } from 'zod'

const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
})

function normaliseUrl(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  // Accept a pasted dashboard URL or trailing slash; Supabase wants the bare origin.
  return raw.trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '')
}

const parsed = schema.safeParse({
  VITE_SUPABASE_URL: normaliseUrl(import.meta.env.VITE_SUPABASE_URL),
  VITE_SUPABASE_ANON_KEY: typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string'
    ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
    : undefined,
})

export const env = parsed.success
  ? { configured: true as const, supabaseUrl: parsed.data.VITE_SUPABASE_URL, supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY }
  : { configured: false as const, supabaseUrl: '', supabaseAnonKey: '' }
