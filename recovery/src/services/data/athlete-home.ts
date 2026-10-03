import { localISODate } from '@/lib/dates'
import { getSupabase } from '@/lib/supabase/client'
import { unwrap } from '@/lib/supabase/errors'
import type { Athlete, Injury, Milestone, ProfessionalRole, RecoveryScore, Restriction } from '@/types/domain'

export interface TeamMemberSummary {
  id: string
  role: ProfessionalRole
  name: string
  avatarUrl: string | null
}

export interface AthleteHomeData {
  athlete: Athlete
  injury: Injury | null
  latestScore: RecoveryScore | null
  previousScore: RecoveryScore | null
  currentPhase: string | null
  checkedInToday: boolean
  rehabTasksToday: { total: number; done: number }
  nextMilestone: Milestone | null
  milestones: { achieved: number; total: number }
  team: TeamMemberSummary[]
  restrictions: Restriction[]
}

/** ISO weekday 1 (Mon) … 7 (Sun). */
function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1
}

/** Everything the Comeback HQ screen needs, fetched in parallel under RLS. */
export async function getAthleteHome(userId: string): Promise<AthleteHomeData | null> {
  const sb = getSupabase()
  const athlete = unwrap(await sb.from('athletes').select('*').eq('profile_id', userId).maybeSingle())
  if (!athlete) return null

  const today = localISODate()
  const athleteId = athlete.id

  const [injuries, scores, checkin, programmes, milestones, team, restrictions] = await Promise.all([
    sb.from('injuries').select('*').eq('athlete_id', athleteId).eq('status', 'active')
      .order('is_primary', { ascending: false }).order('injured_on', { ascending: false }).limit(1),
    sb.from('recovery_scores').select('*').eq('athlete_id', athleteId).order('score_date', { ascending: false }).limit(2),
    sb.from('daily_checkins').select('id').eq('athlete_id', athleteId).eq('checkin_date', today).maybeSingle(),
    sb.from('rehab_programmes').select('id, programme_type').eq('athlete_id', athleteId).eq('status', 'active'),
    sb.from('milestones').select('*').eq('athlete_id', athleteId)
      .order('target_on', { ascending: true, nullsFirst: false }).order('sort_order'),
    sb.from('team_members')
      .select('id, role, professionals(profiles(full_name, avatar_url))')
      .eq('athlete_id', athleteId).eq('status', 'active'),
    sb.from('restrictions').select('*').eq('athlete_id', athleteId).order('activity'),
  ])

  const programmeRows = unwrap(programmes)
  const programmeIds = programmeRows.map((p) => p.id)

  let currentPhase: string | null = null
  const tasks = { total: 0, done: 0 }
  if (programmeIds.length > 0) {
    const weekday = isoWeekday(new Date())
    const [phases, exercises, logs] = await Promise.all([
      sb.from('rehab_phases').select('name, programme_id').in('programme_id', programmeIds).eq('status', 'current'),
      sb.from('rehab_exercises').select('id').in('programme_id', programmeIds).eq('is_active', true)
        .or(`schedule_days.eq.{},schedule_days.cs.{${weekday}}`),
      sb.from('exercise_logs').select('exercise_id, status').eq('athlete_id', athleteId).eq('performed_on', today),
    ])
    const phaseRows = unwrap(phases)
    // Prefer the rehab programme's phase over a conditioning programme's.
    const rehabIds = new Set(programmeRows.filter((p) => p.programme_type === 'rehab').map((p) => p.id))
    currentPhase = (phaseRows.find((p) => rehabIds.has(p.programme_id)) ?? phaseRows[0])?.name ?? null

    const exerciseIds = new Set(unwrap(exercises).map((e) => e.id))
    tasks.total = exerciseIds.size
    tasks.done = unwrap(logs).filter((l) => exerciseIds.has(l.exercise_id) && l.status !== 'skipped').length
  }

  const scoreRows = unwrap(scores)
  const milestoneRows = unwrap(milestones)

  return {
    athlete,
    injury: unwrap(injuries)[0] ?? null,
    latestScore: scoreRows[0] ?? null,
    previousScore: scoreRows[1] ?? null,
    currentPhase,
    checkedInToday: unwrap(checkin) !== null,
    rehabTasksToday: tasks,
    nextMilestone: milestoneRows.find((m) => m.status === 'planned') ?? null,
    milestones: {
      achieved: milestoneRows.filter((m) => m.status === 'achieved').length,
      total: milestoneRows.filter((m) => m.status !== 'deferred').length,
    },
    team: unwrap(team).map((t) => ({
      id: t.id,
      role: t.role,
      name: t.professionals?.profiles?.full_name || 'Team member',
      avatarUrl: t.professionals?.profiles?.avatar_url ?? null,
    })),
    restrictions: unwrap(restrictions),
  }
}
