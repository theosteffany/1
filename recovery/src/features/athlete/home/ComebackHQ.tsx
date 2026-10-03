import { ArrowRight, Check, Dumbbell, Flag, HeartPulse, NotebookPen, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Disclaimer } from '@/components/common/Disclaimer'
import { ScoreRing } from '@/components/common/ScoreRing'
import { StatusDot } from '@/components/common/StatusDot'
import { initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RECOVERY_SCORE_DISCLAIMER } from '@/domain/recovery-score'
import { activityLabel } from '@/domain/restrictions'
import { ROLE_LABELS } from '@/domain/roles'
import { daysBetween, formatShortDate, localISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { AthleteHomeData } from '@/services/data/athlete-home'
import { recoveryDay } from '@/domain/recovery-day'

export interface ComebackHQProps {
  firstName: string
  data: AthleteHomeData
  today?: string
}

/** Athlete "Comeback HQ" dashboard. Purely presentational. */
export function ComebackHQ({ firstName, data, today = localISODate() }: ComebackHQProps) {
  const { injury, latestScore, previousScore } = data
  const day = injury ? recoveryDay(injury.injured_on, today) : null
  const score = latestScore ? Number(latestScore.score) : null
  const delta = latestScore && previousScore ? Number(latestScore.score) - Number(previousScore.score) : null

  return (
    <div className="space-y-5 sm:space-y-6">
      <p className="text-sm text-muted-foreground">
        {greeting()}, <span className="text-foreground">{firstName}</span>
      </p>

      {/* Hero */}
      <Card className="relative gap-6 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Your comeback</p>
            {injury && day !== null ? (
              <>
                <h1 className="mt-2 font-display text-7xl font-extrabold uppercase leading-[0.85] tabular sm:text-8xl">
                  Day <span className="text-volt">{day}</span>
                </h1>
                <p className="mt-4 truncate text-sm text-muted-foreground">
                  {injury.title}
                  {injury.side && injury.side !== 'not_applicable' ? ` · ${injury.side}` : ''}
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-2 font-display text-6xl font-extrabold uppercase leading-[0.85] sm:text-7xl">
                  Day <span className="text-volt">1</span> starts here
                </h1>
                <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                  Add your injury to start your recovery timeline. Everything else builds from it.
                </p>
                <Button asChild variant="volt" className="mt-5">
                  <Link to="/app/recovery"><Plus /> Add your injury</Link>
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-3">
            <ScoreRing value={score} label="Recovery" />
            {delta !== null && Math.abs(delta) >= 0.5 && (
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular', delta > 0 ? 'text-status-green' : 'text-status-red')}>
                {delta > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {delta > 0 ? '+' : ''}{delta.toFixed(0)} since last check-in
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <div>
            <p className="eyebrow">Current phase</p>
            <p className="mt-1 font-display text-2xl font-bold uppercase leading-none">{data.currentPhase ?? 'Not set'}</p>
          </div>
          {injury && (
            <Badge variant={injury.availability_status === 'available' ? 'green' : injury.availability_status === 'modified' ? 'yellow' : 'red'}>
              {injury.availability_status === 'available' ? 'Available' : injury.availability_status === 'modified' ? 'Modified training' : 'Unavailable'}
            </Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-5">
        {/* Today's focus */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <p className="eyebrow">Today's focus</p>
              <CardTitle className="mt-1.5">{formatShortDate(today)}</CardTitle>
            </div>
          </CardHeader>
          <ul className="-mx-2 flex flex-col">
            <FocusRow to="/app/recovery" icon={HeartPulse} title="Morning check-in" meta="Under a minute" done={data.checkedInToday} />
            <FocusRow
              to="/app/rehab"
              icon={Dumbbell}
              title="Rehab session"
              meta={data.rehabTasksToday.total ? `${data.rehabTasksToday.done} of ${data.rehabTasksToday.total} exercises` : 'Nothing scheduled'}
              done={data.rehabTasksToday.total > 0 && data.rehabTasksToday.done >= data.rehabTasksToday.total}
              progress={data.rehabTasksToday.total ? (data.rehabTasksToday.done / data.rehabTasksToday.total) * 100 : undefined}
            />
            <FocusRow to="/app/journal" icon={NotebookPen} title="Recovery journal" meta="Private unless you share it" done={false} />
          </ul>
        </Card>

        {/* Next milestone */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="eyebrow">Next milestone</p>
            <Flag className="size-4 text-muted-foreground" />
          </CardHeader>
          {data.nextMilestone ? (
            <div className="flex flex-1 flex-col justify-between gap-6">
              <div>
                <p className="font-display text-3xl font-bold uppercase leading-none">{data.nextMilestone.title}</p>
                {data.nextMilestone.target_on && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Target {formatShortDate(data.nextMilestone.target_on)}
                    {daysBetween(today, data.nextMilestone.target_on) >= 0 && ` · ${daysBetween(today, data.nextMilestone.target_on)} days`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground tabular">
                  <span>Milestones</span>
                  <span>{data.milestones.achieved} / {data.milestones.total}</span>
                </div>
                <Progress value={data.milestones.total ? (data.milestones.achieved / data.milestones.total) * 100 : 0} />
              </div>
            </div>
          ) : (
            <EmptyHint to="/app/milestones" text="Set your first milestone — first pain-free walk, first run, first match." />
          )}
        </Card>

        {/* Team */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <p className="eyebrow">Your team</p>
            <Link to="/app/team" className="text-xs font-medium text-muted-foreground hover:text-foreground">Manage</Link>
          </CardHeader>
          {data.team.length ? (
            <ul className="flex flex-wrap gap-x-6 gap-y-4">
              {data.team.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar className="size-10 border">
                    {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint to="/app/team" text="Invite your physio, S&C coach, coach or doctor so everyone works from the same plan." />
          )}
        </Card>

        {/* Restrictions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="eyebrow">Restrictions</p>
          </CardHeader>
          {data.restrictions.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
              {data.restrictions.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <StatusDot level={r.level} />
                  <span className="truncate">{activityLabel(r.activity, r.label)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No restrictions recorded. Your physio can set them once connected.</p>
          )}
        </Card>
      </div>

      <Disclaimer>{RECOVERY_SCORE_DISCLAIMER}</Disclaimer>
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function FocusRow({ to, icon: Icon, title, meta, done, progress }: { to: string; icon: LucideIcon; title: string; meta: string; done: boolean; progress?: number }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-accent">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl border', done ? 'border-transparent bg-volt text-volt-foreground' : 'bg-secondary text-muted-foreground')}>
          {done ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm font-medium', done && 'text-muted-foreground line-through decoration-1')}>{title}</span>
          <span className="block text-xs text-muted-foreground">{meta}</span>
          {progress !== undefined && !done && <Progress value={progress} className="mt-2 h-1" />}
        </span>
        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  )
}

function EmptyHint({ to, text }: { to: string; text: string }) {
  return (
    <Link to={to} className="group flex items-start justify-between gap-4 text-sm text-muted-foreground hover:text-foreground">
      <span>{text}</span>
      <ArrowRight className="mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
