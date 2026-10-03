import type { RestrictionLevel } from '@/types/domain'
import { cn } from '@/lib/utils'

const COLOURS: Record<RestrictionLevel, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
}

export function StatusDot({ level, className }: { level: RestrictionLevel; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', COLOURS[level], className)} />
}
