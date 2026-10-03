import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { queryKeys } from '@/services/data/query-keys'
import { getStatusBoard } from '@/services/data/status-board'
import { useRealtimeInvalidation } from '@/services/realtime/use-realtime-invalidation'

import { StatusBoardTable } from '../StatusBoardTable'

export function DashboardPage() {
  const { user } = useAuth()
  const key = queryKeys.statusBoard(user?.id ?? 'anonymous')
  const query = useQuery({ queryKey: key, queryFn: getStatusBoard, enabled: !!user })

  // RLS filters realtime events to athletes this professional may see.
  useRealtimeInvalidation(`board:${user?.id}`, [{ table: 'restrictions' }, { table: 'injuries' }, { table: 'team_members' }], key, !!user)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Professional"
        title="Your athletes"
        description="Live availability, phase and restrictions for every athlete who has added you to their team."
      />
      {query.isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <StatusBoardTable rows={query.data} />
      )}
    </div>
  )
}
