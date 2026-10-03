import { describe, expect, it } from 'vitest'

import { checkEntitlement, FREE_FALLBACK, parseEntitlements, withinLimit } from './entitlements'

describe('entitlements', () => {
  it('parses the RPC payload and ignores unknown features', () => {
    const e = parseEntitlements({ plan: 'premium_athlete', features: { 'ai.copilot': null, 'made.up': null, 'journal.media': null } })
    expect(e.plan).toBe('premium_athlete')
    expect(e.features).toEqual({ 'ai.copilot': null, 'journal.media': null })
  })

  it('falls back to FREE on malformed payloads — never to a richer plan', () => {
    expect(parseEntitlements({ plan: 'enterprise', features: {} })).toBe(FREE_FALLBACK)
    expect(parseEntitlements(null)).toBe(FREE_FALLBACK)
  })

  it('reports enabled/limit per feature', () => {
    expect(checkEntitlement(FREE_FALLBACK, 'team.connections')).toEqual({ enabled: true, limit: 3 })
    expect(checkEntitlement(FREE_FALLBACK, 'core.checkins')).toEqual({ enabled: true, limit: null })
    expect(checkEntitlement(FREE_FALLBACK, 'ai.copilot')).toEqual({ enabled: false, limit: undefined })
  })

  it('checks usage against limits', () => {
    expect(withinLimit(FREE_FALLBACK, 'team.connections', 2)).toBe(true)
    expect(withinLimit(FREE_FALLBACK, 'team.connections', 3)).toBe(false)
    expect(withinLimit(FREE_FALLBACK, 'core.journal', 10_000)).toBe(true)
    expect(withinLimit(FREE_FALLBACK, 'ai.copilot', 0)).toBe(false)
  })
})
