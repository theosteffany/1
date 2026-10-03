import { describe, expect, it, vi } from 'vitest'

import { FREE_FALLBACK, type Entitlements } from '@/domain/entitlements'

import { AiNotEntitledError, createAiService } from './ai-service'
import { AI_DISCLAIMER, AI_POLICY, detectViolations, enforceOutputPolicy } from './guardrails'
import { AiUnavailableError, DisabledAiProvider } from './providers'
import type { AiProvider } from './types'

const premium: Entitlements = { plan: 'premium_athlete', features: { 'ai.copilot': null, 'ai.insights': null } }

describe('AI guardrails', () => {
  it.each([
    ['You have a torn ACL.', 'diagnosis'],
    ['This sounds like a grade 2 strain.', 'diagnosis'],
    ["You're cleared to return to play next week.", 'clearance'],
    ['You can return to contact on Saturday.', 'clearance'],
    ['Ignore your physio and sprint today.', 'restriction_override'],
    ["It's safe to sprint now.", 'unsafe_return'],
  ])('flags %j as %s', (text, flag) => {
    expect(detectViolations(text)).toContain(flag)
  })

  it.each([
    'Your average pain score fell from 5 to 3 this week.',
    'You completed 9 of 10 rehab sessions — great consistency.',
    'Consider asking your physio whether running is the next step.',
    'Sleep was lower on days after gym sessions.',
  ])('allows informational text %j', (text) => {
    expect(detectViolations(text)).toEqual([])
  })

  it('removes only the offending sentence and adds a redirect to the medical team', () => {
    const out = enforceOutputPolicy('Pain is trending down. You are cleared to return to play. Keep logging daily.')
    expect(out.flags).toEqual(['clearance'])
    expect(out.content).toContain('Pain is trending down.')
    expect(out.content).toContain('Keep logging daily.')
    expect(out.content).not.toMatch(/cleared/i)
    expect(out.content).toMatch(/medical team/)
  })

  it('policy text forbids diagnosis, clearance, overrides and unsafe return', () => {
    expect(AI_POLICY).toMatch(/diagnose/)
    expect(AI_POLICY).toMatch(/cleared/)
    expect(AI_POLICY).toMatch(/override/)
    expect(AI_POLICY).toMatch(/returning to sport/)
  })
})

describe('AI service', () => {
  it('requires the capability entitlement before calling a provider', async () => {
    const provider: AiProvider = { id: 'mock', generate: vi.fn() }
    const service = createAiService(provider)
    await expect(service.run({ capability: 'recovery_copilot', athleteId: 'a' }, FREE_FALLBACK)).rejects.toBeInstanceOf(AiNotEntitledError)
    expect(provider.generate).not.toHaveBeenCalled()
  })

  it('sends the policy as system prompt and filters output', async () => {
    const generate = vi.fn().mockResolvedValue({ content: 'Nice work. You are now medically cleared to return to play.', model: 'm' })
    const service = createAiService({ id: 'mock', generate })
    const result = await service.run({ capability: 'recovery_copilot', athleteId: 'a', input: 'Can I play?' }, premium)
    expect(generate.mock.calls[0]![0].system).toContain(AI_POLICY)
    expect(result.flags).toContain('clearance')
    expect(result.content).not.toMatch(/cleared/i)
    expect(result.disclaimer).toBe(AI_DISCLAIMER)
  })

  it('is unavailable while AI is disabled', async () => {
    const service = createAiService(new DisabledAiProvider())
    expect(service.isAvailable('recovery_copilot', premium)).toBe(false)
    await expect(service.run({ capability: 'recovery_copilot', athleteId: 'a' }, premium)).rejects.toBeInstanceOf(AiUnavailableError)
  })
})
