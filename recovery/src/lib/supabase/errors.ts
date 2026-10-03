import type { PostgrestError } from '@supabase/supabase-js'

export class DataError extends Error {
  readonly code: string | undefined
  readonly hint: string | undefined

  constructor(message: string, code?: string, hint?: string) {
    super(message)
    this.name = 'DataError'
    this.code = code
    this.hint = hint
  }

  /** True when the database refused an action because of the user's plan. */
  get isEntitlementError(): boolean {
    return this.hint?.startsWith('entitlement:') ?? false
  }
}

type SuccessData<R> = R extends { error: null; data: infer D } ? D : never

/** Unwraps a Supabase response, throwing a typed error on failure. */
export function unwrap<R extends { data: unknown; error: PostgrestError | null }>(result: R): SuccessData<R> {
  if (result.error) {
    throw new DataError(result.error.message, result.error.code, result.error.hint ?? undefined)
  }
  return result.data as SuccessData<R>
}
