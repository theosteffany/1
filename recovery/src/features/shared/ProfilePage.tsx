import { Sparkles } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PLAN_LABELS } from '@/domain/entitlements'
import { ROLE_LABELS } from '@/domain/roles'
import { useAuth } from '@/features/auth/auth-context'
import { useEntitlements } from '@/features/entitlements/entitlements-context'
import { useTheme, type ThemePreference } from '@/features/theme/theme-context'
import { cn } from '@/lib/utils'

export function ProfilePage() {
  const { profile, user, signOut } = useAuth()
  const entitlements = useEntitlements()
  const { preference, setPreference } = useTheme()
  const name = profile?.full_name ?? ''

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title="Profile" />

      <Card className="flex-row items-center gap-5">
        <Avatar className="size-16 border">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
          <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name || 'Unnamed'}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          {profile?.primary_role && <Badge variant="secondary" className="mt-2">{ROLE_LABELS[profile.primary_role]}</Badge>}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Plan</CardTitle>
              <CardDescription className="mt-1">Features are unlocked centrally by your plan.</CardDescription>
            </div>
            <Sparkles className="size-4 text-volt" />
          </CardHeader>
          <p className="font-display text-3xl font-bold uppercase">{PLAN_LABELS[entitlements.plan]}</p>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription className="mt-1">Dark mode is the default.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {(['dark', 'light', 'system'] as ThemePreference[]).map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={preference === p}
                onClick={() => setPreference(p)}
                className={cn('rounded-xl border px-3 py-2.5 text-sm capitalize transition-colors hover:bg-accent', preference === p && 'border-volt bg-volt-soft')}
              >
                {p}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
    </div>
  )
}
