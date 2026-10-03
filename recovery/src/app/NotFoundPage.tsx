import { Link } from 'react-router-dom'

import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-6 px-6">
      <Logo />
      <p className="font-display text-8xl font-extrabold leading-none text-volt">404</p>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
    </main>
  )
}
