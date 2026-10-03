import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NavItem } from '@/config/navigation'
import { ROLE_LABELS } from '@/domain/roles'
import { initials } from '@/lib/format'

import { ThemeMenuItems } from './ThemeMenuItems'

export function UserMenu({
  name,
  avatarUrl,
  role,
  links,
  onSignOut,
}: {
  name: string
  avatarUrl?: string | null
  role?: keyof typeof ROLE_LABELS | null
  links: NavItem[]
  onSignOut: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Account menu">
        <Avatar className="size-9 border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-foreground">
          <div className="truncate text-sm font-semibold">{name || 'Your account'}</div>
          {role && <div className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((l) => (
          <DropdownMenuItem key={l.to} asChild>
            <Link to={l.to}>
              <l.icon />
              {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {links.length > 0 && <DropdownMenuSeparator />}
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
