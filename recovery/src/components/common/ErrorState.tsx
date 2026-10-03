import { TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { EmptyState } from './EmptyState'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <EmptyState
      icon={TriangleAlert}
      title="We couldn't load this"
      description={message}
      action={onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    />
  )
}
