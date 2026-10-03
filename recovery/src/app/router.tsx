import { lazy, Suspense } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { FullScreenLoader } from '@/components/common/FullScreenLoader'
import { SetupScreen } from '@/components/common/SetupScreen'
import { HomePage } from '@/features/athlete/home/HomePage'
import { JournalPage, MilestonesPage, RecoveryPage, RehabPage, TeamPage } from '@/features/athlete/pages'
import { RedirectIfSignedIn, RequireAuth, RequireExperience, RootRedirect } from '@/features/auth/guards'
import { OnboardingPage } from '@/features/auth/pages/OnboardingPage'
import { SignInPage } from '@/features/auth/pages/SignInPage'
import { SignUpPage } from '@/features/auth/pages/SignUpPage'
import { DashboardPage } from '@/features/professional/pages/DashboardPage'
import { ProfilePage } from '@/features/shared/ProfilePage'
import { AthleteLayout, ProfessionalLayout } from '@/features/shared/ShellLayouts'
import { env } from '@/lib/env'

import { NotFoundPage } from './NotFoundPage'

// Design previews with fixture data — development builds only.
const PreviewRoutes = import.meta.env.DEV ? lazy(() => import('@/dev/PreviewRoutes')) : null
const devRoutes: RouteObject[] = PreviewRoutes
  ? [{ path: '/dev/*', element: <Suspense fallback={<FullScreenLoader />}><PreviewRoutes /></Suspense> }]
  : []

const appRoutes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  { path: '/sign-in', element: <RedirectIfSignedIn><SignInPage /></RedirectIfSignedIn> },
  { path: '/sign-up', element: <RedirectIfSignedIn><SignUpPage /></RedirectIfSignedIn> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <RequireExperience experience="athlete" />,
        children: [
          {
            path: '/app',
            element: <AthleteLayout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'recovery', element: <RecoveryPage /> },
              { path: 'rehab', element: <RehabPage /> },
              { path: 'journal', element: <JournalPage /> },
              { path: 'milestones', element: <MilestonesPage /> },
              { path: 'team', element: <TeamPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RequireExperience experience="professional" />,
        children: [
          {
            path: '/pro',
            element: <ProfessionalLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

const setupRoutes: RouteObject[] = [{ path: '*', element: <SetupScreen /> }]

export const router = createBrowserRouter([...devRoutes, ...(env.configured ? appRoutes : setupRoutes)])
