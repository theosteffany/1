import type { Feature } from '@/domain/entitlements'

/**
 * Every AI capability the product will offer. UI code calls the AI service
 * with one of these — it never talks to a model provider directly.
 */
export type AiCapability =
  | 'recovery_copilot'
  | 'recovery_trend_summary'
  | 'journal_summary'
  | 'document_summary'
  | 'milestone_suggestion'
  | 'athlete_progress_summary'
  | 'professional_progress_summary'

export type AiAudience = 'athlete' | 'professional'

export interface AiCapabilityDefinition {
  audience: AiAudience
  /** Entitlement required to use the capability. */
  feature: Feature
  /** What the capability is for — included in the system prompt. */
  purpose: string
}

export interface AiRequest {
  capability: AiCapability
  athleteId: string
  /** Free text from the user (Copilot question) or null for summaries. */
  input?: string | null
  /** Structured, already-authorised context the caller fetched via RLS. */
  context?: Record<string, unknown>
}

export interface ProviderRequest {
  capability: AiCapability
  athleteId: string
  system: string
  input: string | null
  context: Record<string, unknown>
}

export interface ProviderResponse {
  content: string
  model?: string
}

/**
 * A model backend. Implementations run model calls SERVER-SIDE (e.g. a
 * Supabase Edge Function) so API keys never reach the browser.
 */
export interface AiProvider {
  readonly id: string
  generate(request: ProviderRequest): Promise<ProviderResponse>
}

export interface AiResult {
  content: string
  disclaimer: string
  /** Guardrail rules that fired and caused content to be withheld/adjusted. */
  flags: GuardrailFlag[]
  model?: string
}

export type GuardrailFlag = 'diagnosis' | 'clearance' | 'restriction_override' | 'unsafe_return'
