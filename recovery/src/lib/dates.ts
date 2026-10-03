/** Today's date in the user's local timezone as YYYY-MM-DD (matches SQL `date`). */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Whole days from `from` to `to` (both YYYY-MM-DD), timezone-safe. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(...ymd(from))
  const b = Date.UTC(...ymd(to))
  return Math.round((b - a) / 86_400_000)
}

function ymd(iso: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) throw new RangeError(`Invalid ISO date: ${iso}`)
  return [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
