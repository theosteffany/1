import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { getAthleteHome } from '@/services/data/athlete-home'
import { queryKeys } from '@/services/data/query-keys'
import { useRealtimeInvalidation } from '@/services/realtime/use-realtime-invalidation'

import { ComebackHQ } from './ComebackHQ'

export function HomePage() {
  const { user, profile } = useAuth()
  const key = queryKeys.athleteHome(user?.id ?? 'anonymous')
  const query = useQuery({ queryKey: key, queryFn: () => getAthleteHome(user!.id), enabled: !!user })

  const athleteId = query.data?.athlete.id
  // Live updates from the team (restriction changes, new programme, milestones).
  useRealtimeInvalidation(
    `home:${athleteId}`,
    [
      { table: 'restrictions', filter: `athlete_id=eq.${athleteId}` },
      { table: 'milestones', filter: `athlete_id=eq.${athleteId}` },
      { table: 'injuries', filter: `athlete_id=eq.${athleteId}` },
      { table: 'rehab_exercises', filter: `athlete_id=eq.${athleteId}` },
      { table: 'team_members', filter: `athlete_id=eq.${athleteId}` },
    ],
    key,
    !!athleteId,
  )

  if (query.isPending) return <HomeSkeleton />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (!query.data) return <ErrorState error={new Error('Athlete profile not found.')} />

  const firstName = profile?.full_name.split(' ')[0] || 'athlete'
  return <ComebackHQ firstName={firstName} data={query.data} />
}

function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-56 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}
