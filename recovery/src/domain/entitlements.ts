import { z } from 'zod'

import type { SubscriptionPlan } from '@/types/domain'

/**
 * Feature catalogue. The database (`public.plan_features`) is the source of
 * truth for which plan unlocks what; this list types the keys and provides a
 * safe fallback (FREE) if entitlements cannot be loaded.
 *
 * UI code must ask `useEntitlement('feature')` / `<FeatureGate>` — never check
 * a plan name directly.
 */
export const FEATURES = [
  // core — every plan
  'core.checkins', 'core.rehab', 'core.journal', 'core.milestones', 'core.timeline', 'core.team',
  'journal.media', 'team.connections',
  // premium athlete
  'analytics.advanced', 'ai.copilot', 'ai.insights', 'milestones.advanced', 'documents.vault',
  'timeline.advanced', 'trends.detection', 'dashboard.personalised', 'story.generation',
  // pro / clinic
  'org.multi_athlete', 'org.multi_professional', 'org.dashboard', 'programme.builder', 'exercise.library',
  'exercise.custom', 'analytics.org', 'reporting', 'org.permissions', 'admin.controls', 'billing',
] as const
export type Feature = (typeof FEATURES)[number]

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  premium_athlete: 'Premium Athlete',
  pro_clinic: 'Pro / Clinic',
}

export interface Entitlements {
  plan: SubscriptionPlan
  /** feature → limit (null = unlimited). Absent = not entitled. */
  features: Partial<Record<Feature, number | null>>
}

export const FREE_FALLBACK: Entitlements = {
  plan: 'free',
  features: {
    'core.checkins': null, 'core.rehab': null, 'core.journal': null, 'core.milestones': null,
    'core.timeline': null, 'core.team': null, 'journal.media': 20, 'team.connections': 3,
  },
}

const schema = z.object({
  plan: z.enum(['free', 'premium_athlete', 'pro_clinic']),
  features: z.record(z.string(), z.number().int().nullable()),
})

/** Parses the `get_my_entitlements()` RPC payload; unknown feature keys are ignored. */
export function parseEntitlements(raw: unknown): Entitlements {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return FREE_FALLBACK
  const features: Entitlements['features'] = {}
  for (const [key, limit] of Object.entries(parsed.data.features)) {
    if ((FEATURES as readonly string[]).includes(key)) features[key as Feature] = limit
  }
  return { plan: parsed.data.plan, features }
}

export interface EntitlementCheck {
  enabled: boolean
  /** null = unlimited; undefined when not enabled. */
  limit: number | null | undefined
}

export function checkEntitlement(ent: Entitlements, feature: Feature): EntitlementCheck {
  if (!(feature in ent.features)) return { enabled: false, limit: undefined }
  return { enabled: true, limit: ent.features[feature] ?? null }
}

/** True if `used` more items fit within the feature's limit. */
export function withinLimit(ent: Entitlements, feature: Feature, used: number): boolean {
  const { enabled, limit } = checkEntitlement(ent, feature)
  if (!enabled) return false
  return limit === null || limit === undefined || used < limit
}
