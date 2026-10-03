import type { RestrictionLevel } from '@/types/domain'

export const STANDARD_ACTIVITIES = [
  { key: 'contact', label: 'Contact' },
  { key: 'sprinting', label: 'Sprinting' },
  { key: 'change_of_direction', label: 'Change of direction' },
  { key: 'kicking', label: 'Kicking' },
  { key: 'jumping', label: 'Jumping' },
  { key: 'gym', label: 'Gym' },
  { key: 'running', label: 'Running' },
  { key: 'bike', label: 'Bike' },
  { key: 'pool', label: 'Pool' },
] as const

export const RESTRICTION_LEVELS: Record<RestrictionLevel, { label: string; meaning: string }> = {
  green: { label: 'Permitted', meaning: 'Cleared for this activity by your team' },
  yellow: { label: 'Modified', meaning: 'Allowed with modifications' },
  red: { label: 'Restricted', meaning: 'Not permitted right now' },
}

export function activityLabel(key: string, label?: string | null): string {
  if (label) return label
  const known = STANDARD_ACTIVITIES.find((a) => a.key === key)
  if (known) return known.label
  const words = key.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
