import { describe, expect, it } from 'vitest'

import { daysBetween } from '@/lib/dates'

import { recoveryDay } from './recovery-day'

describe('recoveryDay', () => {
  it('counts the injury date as Day 1', () => {
    expect(recoveryDay('2026-10-03', '2026-10-03')).toBe(1)
    expect(recoveryDay('2026-08-23', '2026-10-03')).toBe(42)
  })

  it('handles DST and month boundaries without drift', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2)
  })

  it('returns null for a future injury date', () => {
    expect(recoveryDay('2026-10-04', '2026-10-03')).toBeNull()
  })

  it('accepts timestamps as well as dates', () => {
    expect(recoveryDay('2026-10-01T23:00:00Z', '2026-10-03')).toBe(3)
  })
})
