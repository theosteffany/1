import { cn } from '@/lib/utils'

/** Circular 0–100 progress ring used for the recovery score. */
export function ScoreRing({
  value,
  size = 132,
  stroke = 10,
  label,
  className,
}: {
  value: number | null
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="stroke-volt transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl font-bold leading-none tabular">
            {value === null ? '—' : Math.round(value)}
            {value !== null && <span className="text-lg text-muted-foreground">%</span>}
          </div>
          {label && <div className="eyebrow mt-1 !text-[10px]">{label}</div>}
        </div>
      </div>
    </div>
  )
}
