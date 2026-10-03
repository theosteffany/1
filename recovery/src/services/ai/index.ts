import { createAiService } from './ai-service'
import { DisabledAiProvider } from './providers'

export { AI_CAPABILITIES } from './capabilities'
export { AI_DISCLAIMER, AI_POLICY, enforceOutputPolicy } from './guardrails'
export { AiNotEntitledError, createAiService, type AiService } from './ai-service'
export { AiUnavailableError, DisabledAiProvider, EdgeFunctionAiProvider } from './providers'
export type * from './types'

/**
 * App-wide AI service. Phase 1 ships with AI disabled; Phase 6 swaps in
 * `new EdgeFunctionAiProvider(getSupabase())` here — no UI changes needed.
 */
export const ai = createAiService(new DisabledAiProvider())
