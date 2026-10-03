import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

/** Route scaffold for sections delivered in later phases. */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
  phase,
}: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  phase: string
}) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState icon={icon} title="Coming soon" description={`This section arrives in ${phase}. The data model and permissions behind it are already in place.`} />
    </div>
  )
}
