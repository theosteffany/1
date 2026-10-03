import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Small, calm notice used wherever tracking or AI output could be mistaken for medical advice. */
export function Disclaimer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
