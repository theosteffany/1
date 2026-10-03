import type { AppRole, ProfessionalRole } from '@/types/domain'

export const PROFESSIONAL_ROLES = ['physio', 'sc_coach', 'team_coach', 'doctor', 'support_staff'] as const satisfies readonly ProfessionalRole[]

export const ROLE_LABELS: Record<AppRole, string> = {
  athlete: 'Athlete',
  physio: 'Physio',
  sc_coach: 'S&C Coach',
  team_coach: 'Coach',
  doctor: 'Doctor / Specialist',
  support_staff: 'Support Staff',
  org_admin: 'Organisation Admin',
}

export function isProfessionalRole(role: AppRole | null | undefined): role is ProfessionalRole {
  return !!role && (PROFESSIONAL_ROLES as readonly string[]).includes(role)
}

/** Which top-level experience a role lands in. */
export type Experience = 'athlete' | 'professional' | 'organisation'

export function experienceForRole(role: AppRole): Experience {
  if (role === 'athlete') return 'athlete'
  if (role === 'org_admin') return 'organisation'
  return 'professional'
}

/** Landing route for an experience. Organisation admins use the professional shell until Phase 7. */
export function homePathFor(experience: Experience): string {
  return experience === 'athlete' ? '/app' : '/pro'
}
