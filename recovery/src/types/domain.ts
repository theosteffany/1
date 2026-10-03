import type { Enums, Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type Athlete = Tables<'athletes'>
export type Professional = Tables<'professionals'>
export type Injury = Tables<'injuries'>
export type DailyCheckin = Tables<'daily_checkins'>
export type RecoveryScore = Tables<'recovery_scores'>
export type Milestone = Tables<'milestones'>
export type Restriction = Tables<'restrictions'>
export type TeamMember = Tables<'team_members'>
export type Notification = Tables<'notifications'>
export type RehabPhase = Tables<'rehab_phases'>
export type RehabExercise = Tables<'rehab_exercises'>

export type AppRole = Enums<'app_role'>
export type ProfessionalRole = Enums<'professional_role'>
export type PermissionScope = Enums<'permission_scope'>
export type RestrictionLevel = Enums<'restriction_level'>
export type AvailabilityStatus = Enums<'availability_status'>
export type ReturnToTrainingStatus = Enums<'return_to_training_status'>
export type SubscriptionPlan = Enums<'subscription_plan'>
