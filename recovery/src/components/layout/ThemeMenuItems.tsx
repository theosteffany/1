import { Monitor, Moon, Sun } from 'lucide-react'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useTheme, type ThemePreference } from '@/features/theme/theme-context'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeMenuItems() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="grid grid-cols-3 gap-1 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <DropdownMenuItem
          key={value}
          onSelect={(e) => {
            e.preventDefault()
            setPreference(value)
          }}
          className={cn('flex-col gap-1 py-2 text-xs', preference === value && 'bg-accent text-foreground [&_svg]:text-volt')}
        >
          <Icon />
          {label}
        </DropdownMenuItem>
      ))}
    </div>
  )
}
