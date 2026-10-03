import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" className="fill-foreground" />
      <path
        d="M8.5 21.5 13.5 11l4 7 2.5-4.5 3.5 8"
        fill="none"
        className="stroke-volt"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-xl font-bold uppercase leading-none tracking-wide">
        Comeback<span className="text-volt">HQ</span>
      </span>
    </span>
  )
}
