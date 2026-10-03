// Fixture data for design previews (development only). Not used in production.
import type { AthleteHomeData } from '@/services/data/athlete-home'
import type { StatusBoardRow } from '@/services/data/status-board'

const now = new Date().toISOString()
const iso = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}
const base = { created_at: now, updated_at: now }
const athleteId = 'a0000000-0000-0000-0000-000000000001'

export const athleteHomeFixture: AthleteHomeData = {
  athlete: {
    ...base, id: athleteId, profile_id: 'p1', sport: 'Rugby', position: 'Wing', team_name: 'Harbour RFC',
    date_of_birth: null, dominant_side: 'right', recovery_score_config: {},
  },
  injury: {
    ...base, id: 'i1', athlete_id: athleteId, title: 'ACL reconstruction', body_region: 'knee', side: 'left',
    mechanism: null, injured_on: iso(-41), status: 'active', is_primary: true, availability_status: 'unavailable',
    return_to_training_status: 'rehab_only', expected_return_on: iso(180), next_review_on: iso(6), created_by: null,
  },
  latestScore: { ...base, id: 's2', athlete_id: athleteId, checkin_id: null, score_date: iso(0), score: 82, components: {}, algorithm_version: 'v1' },
  previousScore: { ...base, id: 's1', athlete_id: athleteId, checkin_id: null, score_date: iso(-1), score: 77, components: {}, algorithm_version: 'v1' },
  currentPhase: 'Strength & Control',
  checkedInToday: true,
  rehabTasksToday: { total: 6, done: 2 },
  nextMilestone: {
    ...base, id: 'm3', athlete_id: athleteId, injury_id: 'i1', milestone_type: 'first_run', title: 'First running session',
    status: 'planned', target_on: iso(19), achieved_on: null, notes: null, sort_order: 3, created_by: null,
  },
  milestones: { achieved: 3, total: 10 },
  team: [
    { id: 't1', role: 'physio', name: 'Pat Morgan', avatarUrl: null },
    { id: 't2', role: 'sc_coach', name: 'Sam Okafor', avatarUrl: null },
    { id: 't3', role: 'team_coach', name: 'Casey Reid', avatarUrl: null },
  ],
  restrictions: (
    [['contact', 'red'], ['sprinting', 'red'], ['change_of_direction', 'red'], ['running', 'yellow'], ['gym', 'yellow'], ['bike', 'green'], ['pool', 'green']] as const
  ).map(([activity, level], i) => ({
    ...base, id: `r${i}`, athlete_id: athleteId, injury_id: 'i1', activity, label: null, level, notes: null,
    effective_from: iso(-10), review_on: iso(6), set_by: null,
  })),
}

export const statusBoardFixture: StatusBoardRow[] = [
  {
    athlete_id: athleteId, full_name: 'Alex Turner', avatar_url: null, sport: 'Rugby', team_name: 'Harbour RFC',
    availability_status: 'unavailable', return_to_training_status: 'rehab_only', current_phase: 'Strength & Control',
    next_review_on: iso(6), expected_return_on: iso(180), updated_at: now, next_milestone: { title: 'First running session' },
    restrictions: [{ activity: 'contact', label: null, level: 'red' }, { activity: 'sprinting', label: null, level: 'red' }, { activity: 'running', label: null, level: 'yellow' }],
  },
  {
    athlete_id: 'a2', full_name: 'Jordan Blake', avatar_url: null, sport: 'Rugby', team_name: 'Harbour RFC',
    availability_status: 'modified', return_to_training_status: 'modified_team_training', current_phase: 'Return to Performance',
    next_review_on: iso(2), expected_return_on: iso(14), updated_at: now, next_milestone: null,
    restrictions: [{ activity: 'contact', label: null, level: 'yellow' }],
  },
  {
    athlete_id: 'a3', full_name: 'Morgan Lee', avatar_url: null, sport: 'Rugby', team_name: 'Harbour RFC',
    availability_status: 'available', return_to_training_status: 'match_available', current_phase: null,
    next_review_on: null, expected_return_on: null, updated_at: now, next_milestone: null, restrictions: null,
  },
]
