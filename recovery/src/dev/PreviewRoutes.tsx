import { Bell } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ATHLETE_NAV, PROFESSIONAL_NAV } from '@/config/navigation'
import { ComebackHQ } from '@/features/athlete/home/ComebackHQ'
import { StatusBoardTable } from '@/features/professional/StatusBoardTable'

import { athleteHomeFixture, statusBoardFixture } from './fixtures'

function StaticHeader() {
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell className="size-[18px]" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-volt ring-2 ring-background" />
      </Button>
      <Avatar className="size-9 border"><AvatarFallback>AT</AvatarFallback></Avatar>
    </>
  )
}

/** /dev/athlete and /dev/pro — fixture-driven design previews (dev only). */
export default function PreviewRoutes() {
  return (
    <Routes>
      <Route
        path="athlete"
        element={
          <AppShell nav={ATHLETE_NAV} headerActions={<StaticHeader />}>
            <ComebackHQ firstName="Alex" data={athleteHomeFixture} />
          </AppShell>
        }
      />
      <Route
        path="athlete-empty"
        element={
          <AppShell nav={ATHLETE_NAV} headerActions={<StaticHeader />}>
            <ComebackHQ
              firstName="Alex"
              data={{
                ...athleteHomeFixture, injury: null, latestScore: null, previousScore: null, currentPhase: null,
                checkedInToday: false, rehabTasksToday: { total: 0, done: 0 }, nextMilestone: null,
                milestones: { achieved: 0, total: 0 }, team: [], restrictions: [],
              }}
            />
          </AppShell>
        }
      />
      <Route
        path="pro"
        element={
          <AppShell wide nav={PROFESSIONAL_NAV} headerActions={<StaticHeader />}>
            <div className="space-y-8">
              <PageHeader eyebrow="Professional" title="Your athletes" description="Live availability, phase and restrictions for every athlete who has added you to their team." />
              <StatusBoardTable rows={statusBoardFixture} />
            </div>
          </AppShell>
        }
      />
    </Routes>
  )
}
