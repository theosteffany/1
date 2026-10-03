import { useId, type ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function FormField({ label, hint, error, ...inputProps }: ComponentProps<typeof Input> & { label: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${id}-msg` : undefined} {...inputProps} />
      {(error || hint) && (
        <p id={`${id}-msg`} className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      {message}
    </p>
  )
}
