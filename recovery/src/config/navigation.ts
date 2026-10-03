import type { LucideIcon } from 'lucide-react'
import { Activity, Dumbbell, Flag, House, LayoutGrid, NotebookPen, UserRound, Users } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Shown in the mobile bottom bar (max 5). Others live in the header menu. */
  primary?: boolean
  end?: boolean
}

export const ATHLETE_NAV: NavItem[] = [
  { to: '/app', label: 'Home', icon: House, primary: true, end: true },
  { to: '/app/recovery', label: 'Recovery', icon: Activity, primary: true },
  { to: '/app/rehab', label: 'Rehab', icon: Dumbbell, primary: true },
  { to: '/app/journal', label: 'Journal', icon: NotebookPen, primary: true },
  { to: '/app/milestones', label: 'Milestones', icon: Flag, primary: true },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
]

export const PROFESSIONAL_NAV: NavItem[] = [
  { to: '/pro', label: 'Athletes', icon: LayoutGrid, primary: true, end: true },
  { to: '/pro/profile', label: 'Profile', icon: UserRound, primary: true },
]
