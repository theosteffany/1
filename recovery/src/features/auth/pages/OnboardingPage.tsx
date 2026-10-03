import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, Dumbbell, HeartPulse, Stethoscope, Trophy, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { FormError, FormField } from '@/components/common/FormField'
import { FullScreenLoader } from '@/components/common/FullScreenLoader'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { experienceForRole, homePathFor, ROLE_LABELS } from '@/domain/roles'
import { cn } from '@/lib/utils'
import { completeOnboarding } from '@/services/data/profiles'
import type { AppRole } from '@/types/domain'

import { useAuth } from '../auth-context'

const ROLE_OPTIONS: { role: AppRole; icon: LucideIcon; blurb: string }[] = [
  { role: 'athlete', icon: Trophy, blurb: 'Track your own recovery' },
  { role: 'physio', icon: HeartPulse, blurb: 'Manage rehab and restrictions' },
  { role: 'sc_coach', icon: Dumbbell, blurb: 'Physical prep and training' },
  { role: 'team_coach', icon: Users, blurb: 'Availability and return to training' },
  { role: 'doctor', icon: Stethoscope, blurb: 'Clinical oversight' },
  { role: 'support_staff', icon: UserRound, blurb: 'Other authorised staff' },
  { role: 'org_admin', icon: Building2, blurb: 'Run a club or clinic' },
]

export function OnboardingPage() {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<AppRole>('athlete')
  const [fullName, setFullName] = useState<string>((user?.user_metadata.full_name as string | undefined) ?? '')
  const [details, setDetails] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (profileLoading) return <FullScreenLoader />
  if (profile?.primary_role && profile.onboarded_at) {
    const exp = experienceForRole(profile.primary_role)
    return <Navigate to={homePathFor(exp === 'organisation' ? 'professional' : exp)} replace />
  }

  const setDetail = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setDetails((d) => ({ ...d, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (fullName.trim().length < 2) {
      setError('Enter your name.')
      return
    }
    setError(null)
    setPending(true)
    try {
      const saved = await completeOnboarding({ role, fullName: fullName.trim(), details })
      await refreshProfile()
      const exp = experienceForRole(saved.primary_role ?? role)
      navigate(homePathFor(exp === 'organisation' ? 'professional' : exp), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout eyebrow="Set up" title="Who are you?" subtitle="This shapes your experience. Access to athlete data is always granted by the athlete.">
      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset>
          <legend className="sr-only">Role</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map(({ role: r, icon: Icon, blurb }) => (
              <label
                key={r}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-2xl border p-3.5 transition-colors hover:bg-accent has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                  role === r && 'border-volt bg-volt-soft hover:bg-volt-soft',
                  r === 'athlete' && 'col-span-2',
                )}
              >
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                <Icon className={cn('size-5 text-muted-foreground', role === r && 'text-volt')} />
                <span className="text-sm font-semibold leading-tight">{ROLE_LABELS[r]}</span>
                <span className="text-xs leading-snug text-muted-foreground">{blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <FormField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />

        {role === 'athlete' && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sport" placeholder="e.g. Rugby" value={details.sport ?? ''} onChange={setDetail('sport')} />
            <FormField label="Position" placeholder="Optional" value={details.position ?? ''} onChange={setDetail('position')} />
            <div className="col-span-2">
              <FormField label="Team / club" placeholder="Optional" value={details.team_name ?? ''} onChange={setDetail('team_name')} />
            </div>
          </div>
        )}
        {role !== 'athlete' && role !== 'org_admin' && (
          <FormField label="Title" placeholder="e.g. Lead Physiotherapist" value={details.title ?? ''} onChange={setDetail('title')} />
        )}
        {role === 'org_admin' && (
          <FormField label="Organisation name" placeholder="e.g. Harbour RFC" value={details.organisation_name ?? ''} onChange={setDetail('organisation_name')} />
        )}

        <FormError message={error} />
        <Button type="submit" variant="volt" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </AuthLayout>
  )
}
