import { LogoMark } from './Logo'

export function FullScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid min-h-dvh place-items-center bg-background">
      <LogoMark className="size-10 animate-pulse" />
    </div>
  )
}
