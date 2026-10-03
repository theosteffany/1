import { Activity, Dumbbell, Flag, NotebookPen, Users } from 'lucide-react'

import { PlaceholderPage } from './PlaceholderPage'

export function RecoveryPage() {
  return (
    <PlaceholderPage
      eyebrow="Recovery"
      title="Your timeline"
      description="Daily check-ins, recovery score trends and every event from injury to return to play."
      icon={Activity}
      phase="Phase 2"
    />
  )
}

export function RehabPage() {
  return (
    <PlaceholderPage
      eyebrow="Rehab"
      title="Today's session"
      description="Assigned exercises with sets, reps, tempo and demos. Log each as completed, partial or skipped."
      icon={Dumbbell}
      phase="Phase 2"
    />
  )
}

export function JournalPage() {
  return (
    <PlaceholderPage
      eyebrow="Journal"
      title="Your journal"
      description="Text, photo, video and voice notes. Every entry is private unless you choose to share it."
      icon={NotebookPen}
      phase="Phase 2"
    />
  )
}

export function MilestonesPage() {
  return (
    <PlaceholderPage
      eyebrow="Milestones"
      title="The road back"
      description="First pain-free walk to first match. Set targets, mark them done, add notes and media."
      icon={Flag}
      phase="Phase 2"
    />
  )
}

export function TeamPage() {
  return (
    <PlaceholderPage
      eyebrow="Team"
      title="Your team"
      description="Invite your physio, S&C coach, coach and doctor. You decide exactly what each of them can see, and can revoke access at any time."
      icon={Users}
      phase="Phase 3"
    />
  )
}
