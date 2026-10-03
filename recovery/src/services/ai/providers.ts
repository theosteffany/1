import type { TypedSupabaseClient } from '@/lib/supabase/client'

import type { AiProvider, ProviderRequest, ProviderResponse } from './types'

export class AiUnavailableError extends Error {
  constructor(message = 'AI features are not available yet.') {
    super(message)
    this.name = 'AiUnavailableError'
  }
}

/** Default provider until an AI backend is deployed. */
export class DisabledAiProvider implements AiProvider {
  readonly id = 'disabled'

  generate(): Promise<ProviderResponse> {
    return Promise.reject(new AiUnavailableError())
  }
}

/**
 * Calls a Supabase Edge Function (`ai-gateway`) that holds the model API key,
 * re-checks the caller's entitlement and permissions server-side, and logs the
 * result to `public.ai_insights`. Not deployed in Phase 1.
 */
export class EdgeFunctionAiProvider implements AiProvider {
  readonly id = 'edge-function'
  private readonly supabase: TypedSupabaseClient
  private readonly functionName: string

  constructor(supabase: TypedSupabaseClient, functionName = 'ai-gateway') {
    this.supabase = supabase
    this.functionName = functionName
  }

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const { data, error } = await this.supabase.functions.invoke<ProviderResponse>(this.functionName, { body: request })
    if (error || !data) throw new AiUnavailableError(error?.message)
    return data
  }
}
