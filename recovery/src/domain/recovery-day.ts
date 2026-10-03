import { daysBetween, localISODate } from '@/lib/dates'

/**
 * "Day N" of the comeback. The day of injury is Day 1.
 * Returns null for future dates (bad data) rather than a negative day.
 */
export function recoveryDay(injuredOn: string, today: string = localISODate()): number | null {
  const diff = daysBetween(injuredOn, today)
  return diff < 0 ? null : diff + 1
}
