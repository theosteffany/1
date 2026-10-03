import { Users } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { StatusDot } from '@/components/common/StatusDot'
import { initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { activityLabel } from '@/domain/restrictions'
import { formatShortDate } from '@/lib/dates'
import type { StatusBoardRow } from '@/services/data/status-board'
import type { AvailabilityStatus, RestrictionLevel, ReturnToTrainingStatus } from '@/types/domain'

const AVAILABILITY: Record<AvailabilityStatus, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  available: { label: 'Available', variant: 'green' },
  modified: { label: 'Modified', variant: 'yellow' },
  unavailable: { label: 'Unavailable', variant: 'red' },
}

const RTT: Record<ReturnToTrainingStatus, string> = {
  rehab_only: 'Rehab only',
  individual_training: 'Individual training',
  modified_team_training: 'Modified team training',
  full_team_training: 'Full team training',
  match_available: 'Match available',
}

interface RestrictionChip { activity: string; label: string | null; level: RestrictionLevel }

function restrictionsOf(row: StatusBoardRow): RestrictionChip[] | null {
  return Array.isArray(row.restrictions) ? (row.restrictions as unknown as RestrictionChip[]) : null
}

/** Availability-level overview. Shows only what the status-board RPC returns. */
export function StatusBoardTable({ rows }: { rows: StatusBoardRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No athletes yet"
        description="When an athlete invites you to their team and you accept, they appear here with the information they've authorised."
      />
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left">
              {['Athlete', 'Status', 'Phase', 'Return to training', 'Restrictions', 'Next review'].map((h) => (
                <th key={h} scope="col" className="eyebrow px-5 py-3.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const restrictions = restrictionsOf(row)
              const availability = row.availability_status ? AVAILABILITY[row.availability_status] : null
              return (
                <tr key={row.athlete_id} className="transition-colors hover:bg-accent/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border">
                        {row.avatar_url && <AvatarImage src={row.avatar_url} alt="" />}
                        <AvatarFallback>{initials(row.full_name ?? '')}</AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <p className="font-medium">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground">{[row.sport, row.team_name].filter(Boolean).join(' · ') || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {availability ? <Badge variant={availability.variant}>{availability.label}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-4">{row.current_phase ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-4">{row.return_to_training_status ? RTT[row.return_to_training_status] : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-4">
                    {restrictions === null ? (
                      <span className="text-xs text-muted-foreground">Not shared</span>
                    ) : restrictions.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        {restrictions.filter((r) => r.level !== 'green').slice(0, 4).map((r) => (
                          <span key={r.activity} className="inline-flex items-center gap-1.5 text-xs">
                            <StatusDot level={r.level} />
                            {activityLabel(r.activity, r.label)}
                          </span>
                        ))}
                        {restrictions.every((r) => r.level === 'green') && <span className="text-xs text-status-green">All permitted</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 tabular">{row.next_review_on ? formatShortDate(row.next_review_on) : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
