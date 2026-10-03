import type { Entitlements } from '@/domain/entitlements'
import { checkEntitlement } from '@/domain/entitlements'

import { AI_CAPABILITIES } from './capabilities'
import { AI_DISCLAIMER, AI_POLICY, enforceOutputPolicy } from './guardrails'
import type { AiCapability, AiProvider, AiRequest, AiResult } from './types'

export class AiNotEntitledError extends Error {
  readonly capability: AiCapability

  constructor(capability: AiCapability) {
    super(`Your plan does not include ${capability.replace(/_/g, ' ')}.`)
    this.name = 'AiNotEntitledError'
    this.capability = capability
  }
}

export interface AiService {
  isAvailable(capability: AiCapability, entitlements: Entitlements): boolean
  run(request: AiRequest, entitlements: Entitlements): Promise<AiResult>
}

/**
 * The only entry point for AI in the app. It:
 *  1. checks the capability's entitlement (the server re-checks),
 *  2. wraps the request in the non-negotiable AI policy,
 *  3. enforces output guardrails and always attaches the disclaimer.
 */
export function createAiService(provider: AiProvider): AiService {
  return {
    isAvailable(capability, entitlements) {
      return provider.id !== 'disabled' && checkEntitlement(entitlements, AI_CAPABILITIES[capability].feature).enabled
    },

    async run(request, entitlements) {
      const definition = AI_CAPABILITIES[request.capability]
      if (!checkEntitlement(entitlements, definition.feature).enabled) {
        throw new AiNotEntitledError(request.capability)
      }

      const response = await provider.generate({
        capability: request.capability,
        athleteId: request.athleteId,
        system: `${AI_POLICY}\n\nAudience: ${definition.audience}.\nTask: ${definition.purpose}`,
        input: request.input ?? null,
        context: request.context ?? {},
      })

      const { content, flags } = enforceOutputPolicy(response.content)
      return { content, flags, disclaimer: AI_DISCLAIMER, model: response.model }
    },
  }
}
