import type { PermissionScope, ProfessionalRole } from '@/types/domain'

export type ScopeSensitivity = 'standard' | 'clinical' | 'personal'

export interface ScopeMeta {
  label: string
  description: string
  sensitivity: ScopeSensitivity
}

/**
 * Human-readable catalogue of permission scopes, used when an athlete reviews
 * what a professional can see. Enforcement lives in the database (RLS); this
 * file only describes it.
 */
export const SCOPES: Record<PermissionScope, ScopeMeta> = {
  'availability.read': { label: 'Availability', description: 'Availability, current phase, return-to-training status and next review date.', sensitivity: 'standard' },
  'injury.read': { label: 'Injury summary', description: 'Injury region, side and status — not diagnosis.', sensitivity: 'standard' },
  'restrictions.read': { label: 'View restrictions', description: 'Green / yellow / red training restrictions.', sensitivity: 'standard' },
  'restrictions.write': { label: 'Set restrictions', description: 'Create and change training restrictions.', sensitivity: 'standard' },
  'rehab.read': { label: 'View rehab', description: 'Rehab programmes, exercises and adherence.', sensitivity: 'standard' },
  'rehab.write': { label: 'Manage rehab', description: 'Create programmes, phases and exercises.', sensitivity: 'standard' },
  'training.write': { label: 'Manage training', description: 'Create conditioning programmes.', sensitivity: 'standard' },
  'checkins.read': { label: 'Daily check-ins', description: 'Pain, swelling, sleep, mood and other daily check-in detail.', sensitivity: 'personal' },
  'metrics.read': { label: 'Recovery metrics', description: 'Recovery score trend and tracked metrics.', sensitivity: 'standard' },
  'milestones.read': { label: 'View milestones', description: 'Milestones and target dates.', sensitivity: 'standard' },
  'milestones.write': { label: 'Manage milestones', description: 'Create and complete milestones.', sensitivity: 'standard' },
  'timeline.read': { label: 'View timeline', description: 'Non-clinical recovery timeline events.', sensitivity: 'standard' },
  'timeline.write': { label: 'Add to timeline', description: 'Add recovery events to the timeline.', sensitivity: 'standard' },
  'medical.read': { label: 'Clinical records', description: 'Diagnoses, surgeries and clinical timeline events.', sensitivity: 'clinical' },
  'medical.write': { label: 'Edit clinical records', description: 'Add diagnoses, surgeries and clinical events.', sensitivity: 'clinical' },
  'documents.read': { label: 'Medical documents', description: 'Scan reports, letters and other documents.', sensitivity: 'clinical' },
  'documents.write': { label: 'Upload documents', description: 'Upload medical documents.', sensitivity: 'clinical' },
  'journal.shared.read': { label: 'Shared journal entries', description: 'Only journal entries you explicitly share. Private entries are never visible.', sensitivity: 'personal' },
  'insights.read': { label: 'AI summaries', description: 'Informational AI summaries prepared for professionals.', sensitivity: 'standard' },
}

/**
 * Default scope sets per role. MUST mirror `public.role_default_permissions`
 * (verified by permissions.test.ts against the migration).
 */
export const ROLE_DEFAULT_SCOPES: Record<ProfessionalRole, readonly PermissionScope[]> = {
  physio: [
    'availability.read', 'injury.read', 'restrictions.read', 'restrictions.write', 'rehab.read', 'rehab.write',
    'checkins.read', 'metrics.read', 'milestones.read', 'milestones.write', 'timeline.read', 'timeline.write',
    'medical.read', 'documents.read', 'documents.write', 'journal.shared.read', 'insights.read',
  ],
  doctor: [
    'availability.read', 'injury.read', 'restrictions.read', 'restrictions.write', 'rehab.read', 'checkins.read',
    'metrics.read', 'milestones.read', 'timeline.read', 'timeline.write', 'medical.read', 'medical.write',
    'documents.read', 'documents.write', 'journal.shared.read', 'insights.read',
  ],
  sc_coach: [
    'availability.read', 'injury.read', 'restrictions.read', 'rehab.read', 'training.write', 'metrics.read',
    'milestones.read', 'timeline.read', 'journal.shared.read',
  ],
  team_coach: ['availability.read', 'restrictions.read', 'milestones.read'],
  support_staff: ['availability.read'],
}

export function hasScope(scopes: readonly PermissionScope[], scope: PermissionScope): boolean {
  return scopes.includes(scope)
}
