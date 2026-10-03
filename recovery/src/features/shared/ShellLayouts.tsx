import { Outlet } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { UserMenu } from '@/components/layout/UserMenu'
import { ATHLETE_NAV, PROFESSIONAL_NAV, type NavItem } from '@/config/navigation'
import { useAuth } from '@/features/auth/auth-context'

function ShellHeaderActions({ menuLinks }: { menuLinks: NavItem[] }) {
  const { profile, signOut } = useAuth()
  return (
    <>
      <NotificationBell />
      <UserMenu
        name={profile?.full_name ?? ''}
        avatarUrl={profile?.avatar_url}
        role={profile?.primary_role}
        links={menuLinks}
        onSignOut={() => void signOut()}
      />
    </>
  )
}

export function AthleteLayout() {
  return (
    <AppShell nav={ATHLETE_NAV} headerActions={<ShellHeaderActions menuLinks={ATHLETE_NAV.filter((n) => !n.primary)} />}>
      <Outlet />
    </AppShell>
  )
}

export function ProfessionalLayout() {
  return (
    <AppShell wide nav={PROFESSIONAL_NAV} headerActions={<ShellHeaderActions menuLinks={[]} />}>
      <Outlet />
    </AppShell>
  )
}
