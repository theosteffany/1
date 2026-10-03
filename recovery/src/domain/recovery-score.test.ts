import { describe, expect, it } from 'vitest'

import { computeRecoveryScore, parseScoreConfig, type CheckinValues } from './recovery-score'

const best: CheckinValues = { pain: 0, swelling: 0, stiffness: 0, energy: 10, sleep: 10, mood: 10, confidence: 10 }
const worst: CheckinValues = { pain: 10, swelling: 10, stiffness: 10, energy: 0, sleep: 0, mood: 0, confidence: 0 }

describe('computeRecoveryScore', () => {
  it('scores the best possible check-in 100 and the worst 0', () => {
    expect(computeRecoveryScore(best)?.score).toBe(100)
    expect(computeRecoveryScore(worst)?.score).toBe(0)
  })

  it('inverts symptom metrics (lower pain is better)', () => {
    const r = computeRecoveryScore({ ...best, pain: 10 })!
    expect(r.components.pain?.normalised).toBe(0)
    expect(r.components.energy?.normalised).toBe(1)
    expect(r.score).toBeLessThan(100)
  })

  it('weights pain more heavily by default', () => {
    const painOnly = computeRecoveryScore({ ...best, pain: 10 })!.score
    const moodOnly = computeRecoveryScore({ ...best, mood: 0 })!.score
    expect(painOnly).toBeLessThan(moodOnly)
  })

  it('respects disabled metrics and custom weights', () => {
    const config = parseScoreConfig({ metrics: { pain: { enabled: false }, sleep: { weight: 0 } } })
    const r = computeRecoveryScore({ ...best, pain: 10, sleep: 0 }, config)!
    expect(r.score).toBe(100)
    expect(r.components.pain).toBeUndefined()
    expect(r.components.sleep).toBeUndefined()
  })

  it('clamps out-of-range values', () => {
    expect(computeRecoveryScore({ ...best, energy: 42 })?.score).toBe(100)
  })

  it('returns null when every metric is disabled', () => {
    const config = parseScoreConfig({
      metrics: Object.fromEntries(Object.keys(best).map((k) => [k, { enabled: false }])),
    })
    expect(computeRecoveryScore(best, config)).toBeNull()
  })

  it('falls back to defaults on malformed stored config', () => {
    expect(parseScoreConfig({ metrics: { pain: { weight: 'heavy' } } })).toEqual({ metrics: {} })
    expect(parseScoreConfig(null)).toEqual({ metrics: {} })
  })

  it('records the algorithm version', () => {
    expect(computeRecoveryScore(best)?.algorithmVersion).toBe('v1')
  })
})
