import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { Logo, LogoMark } from '@/components/common/Logo'
import type { NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

/**
 * Responsive application frame.
 *  - mobile: compact top bar + bottom tab bar (primary items)
 *  - desktop (lg+): fixed sidebar with every item, wide content area
 */
export function AppShell({
  nav,
  headerActions,
  sidebarFooter,
  children,
  wide = false,
}: {
  nav: NavItem[]
  headerActions?: ReactNode
  sidebarFooter?: ReactNode
  children: ReactNode
  /** Desktop-first surfaces (professional dashboards) use the full width. */
  wide?: boolean
}) {
  const primary = nav.filter((n) => n.primary)
  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Main" className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  isActive && 'bg-accent text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-[18px]', isActive && 'text-volt')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {sidebarFooter}
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl lg:ml-64">
        <div className={cn('mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:h-16', !wide && 'max-w-5xl')}>
          <LogoMark className="size-7 lg:hidden" />
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1.5">{headerActions}</div>
        </div>
      </header>

      <main className={cn('mx-auto px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:pb-16 lg:pt-10', !wide && 'max-w-5xl')}>
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {primary.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors',
                    isActive && 'text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-volt-soft')}>
                      <item.icon className={cn('size-5', isActive && 'text-volt')} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
