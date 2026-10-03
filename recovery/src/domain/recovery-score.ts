import { z } from 'zod'

/**
 * Personal recovery score.
 *
 * A self-tracking metric that summarises the athlete's own daily check-in into
 * a single 0–100 number so trends are easy to see. It is NOT a medical
 * assessment, diagnosis or clearance and must always be presented as such.
 */
export const RECOVERY_SCORE_DISCLAIMER =
  'Your recovery score is a personal tracking metric based on your own check-ins. It is not a medical assessment or clearance.'

export const ALGORITHM_VERSION = 'v1'

export const CHECKIN_METRICS = ['pain', 'swelling', 'stiffness', 'energy', 'sleep', 'mood', 'confidence'] as const
export type CheckinMetric = (typeof CHECKIN_METRICS)[number]

/** Metrics where a LOWER reading is better (0 = none). */
const INVERTED: ReadonlySet<CheckinMetric> = new Set(['pain', 'swelling', 'stiffness'])

const metricConfig = z.object({
  enabled: z.boolean().default(true),
  weight: z.number().min(0).max(10).default(1),
})

export const recoveryScoreConfigSchema = z.object({
  metrics: z.partialRecord(z.enum(CHECKIN_METRICS), metricConfig).default({}),
})
export type RecoveryScoreConfig = z.infer<typeof recoveryScoreConfigSchema>

/** Default emphasis: symptoms matter a little more than wellbeing. */
export const DEFAULT_WEIGHTS: Record<CheckinMetric, number> = {
  pain: 1.5,
  swelling: 1,
  stiffness: 1,
  energy: 1,
  sleep: 1,
  mood: 1,
  confidence: 1,
}

export type CheckinValues = Record<CheckinMetric, number>

export interface ScoreComponent {
  /** Normalised 0–1 where 1 is best. */
  normalised: number
  weight: number
}

export interface RecoveryScoreResult {
  score: number
  components: Partial<Record<CheckinMetric, ScoreComponent>>
  algorithmVersion: string
}

/** Parses an athlete's stored config (jsonb), falling back to defaults on bad data. */
export function parseScoreConfig(raw: unknown): RecoveryScoreConfig {
  const parsed = recoveryScoreConfigSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : { metrics: {} }
}

export function computeRecoveryScore(values: CheckinValues, config: RecoveryScoreConfig = { metrics: {} }): RecoveryScoreResult | null {
  const components: Partial<Record<CheckinMetric, ScoreComponent>> = {}
  let weighted = 0
  let totalWeight = 0

  for (const metric of CHECKIN_METRICS) {
    const cfg = config.metrics[metric]
    if (cfg?.enabled === false) continue
    const weight = cfg?.weight ?? DEFAULT_WEIGHTS[metric]
    if (weight <= 0) continue

    const raw = values[metric]
    if (!Number.isFinite(raw)) continue
    const clamped = Math.min(10, Math.max(0, raw))
    const normalised = INVERTED.has(metric) ? (10 - clamped) / 10 : clamped / 10

    components[metric] = { normalised: round(normalised, 3), weight }
    weighted += normalised * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return null
  return { score: round((weighted / totalWeight) * 100, 1), components, algorithmVersion: ALGORITHM_VERSION }
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
