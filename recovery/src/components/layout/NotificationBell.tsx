import { Bell } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'
import { listNotifications, markAllNotificationsRead } from '@/services/data/notifications'
import { queryKeys } from '@/services/data/query-keys'
import { useRealtimeInvalidation } from '@/services/realtime/use-realtime-invalidation'

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

export function NotificationBell() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = queryKeys.notifications(user?.id ?? 'anonymous')

  const { data = [] } = useQuery({ queryKey: key, queryFn: () => listNotifications(), enabled: !!user })
  useRealtimeInvalidation(
    `notifications:${user?.id}`,
    [{ table: 'notifications', filter: `recipient_id=eq.${user?.id}` }],
    key,
    !!user,
  )

  const markRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const unread = data.filter((n) => !n.read_at).length

  return (
    <DropdownMenu onOpenChange={(open) => !open && unread > 0 && markRead.mutate()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative">
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-volt ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold text-foreground">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        {data.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {data.slice(0, 12).map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-volt')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular">{timeAgo(n.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
