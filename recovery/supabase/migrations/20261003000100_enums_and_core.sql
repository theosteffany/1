-- =============================================================================
-- Recovery Platform — Phase 1 foundation
-- 0100: enums, shared trigger functions, identity & organisation tables
--
-- Identity model
--   auth.users            Supabase Auth ("users" in the product spec)
--   public.profiles       1:1 with auth.users — display data + primary role
--   public.athletes       athlete-specific data (a profile MAY also be a professional)
--   public.professionals  professional-specific data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'athlete', 'physio', 'sc_coach', 'team_coach', 'doctor', 'support_staff', 'org_admin'
);

create type public.professional_role as enum (
  'physio', 'sc_coach', 'team_coach', 'doctor', 'support_staff'
);

-- Granular permission scopes granted to a professional for ONE athlete.
-- Adding a scope later: `alter type public.permission_scope add value '...'`.
create type public.permission_scope as enum (
  'availability.read',     -- availability, current phase, return-to-training status, next review
  'injury.read',           -- injury summary (region, side, status) — not diagnosis
  'restrictions.read',
  'restrictions.write',
  'rehab.read',            -- programmes, phases, exercises, adherence logs
  'rehab.write',
  'training.write',        -- S&C: create/maintain conditioning programmes
  'checkins.read',         -- daily check-in detail
  'metrics.read',          -- recovery scores + recovery metrics (incl. future wearables)
  'milestones.read',
  'milestones.write',
  'timeline.read',         -- non-clinical ("team") timeline events
  'timeline.write',
  'medical.read',          -- diagnoses, surgeries, clinical timeline events
  'medical.write',
  'documents.read',        -- medical document vault
  'documents.write',
  'journal.shared.read',   -- journal entries the athlete EXPLICITLY shared
  'insights.read'          -- AI insights addressed to professionals
);

create type public.connection_status as enum ('pending', 'active', 'declined', 'revoked');
create type public.org_kind as enum ('club', 'clinic', 'team', 'academy', 'other');
create type public.org_member_role as enum ('admin', 'professional', 'athlete');
create type public.membership_status as enum ('invited', 'active', 'removed');

create type public.body_side as enum ('left', 'right', 'bilateral', 'not_applicable');
create type public.injury_status as enum ('active', 'recovered', 'archived');
create type public.availability_status as enum ('available', 'modified', 'unavailable');
create type public.return_to_training_status as enum (
  'rehab_only', 'individual_training', 'modified_team_training', 'full_team_training', 'match_available'
);

create type public.timeline_event_type as enum (
  'injury', 'diagnosis', 'imaging', 'surgery', 'specialist_appointment', 'physiotherapy',
  'rehab_milestone', 'training_milestone', 'return_to_run', 'return_to_contact',
  'return_to_play', 'note', 'other'
);
-- Who may see a timeline event (in addition to the athlete):
--   private  — athlete only
--   team     — professionals with timeline.read
--   clinical — professionals with medical.read
create type public.event_audience as enum ('private', 'team', 'clinical');

create type public.programme_type as enum ('rehab', 'conditioning');
create type public.programme_status as enum ('draft', 'active', 'completed', 'archived');
create type public.phase_status as enum ('upcoming', 'current', 'completed');
create type public.exercise_log_status as enum ('completed', 'partial', 'skipped');

create type public.milestone_type as enum (
  'pain_free_walk', 'full_rom', 'first_bike', 'first_gym', 'first_run', 'first_sprint',
  'first_change_of_direction', 'first_team_training', 'return_to_contact', 'first_match', 'custom'
);
create type public.milestone_status as enum ('planned', 'achieved', 'deferred');

create type public.journal_visibility as enum ('private', 'shared');
create type public.media_type as enum ('photo', 'video', 'voice', 'document');

create type public.restriction_level as enum ('green', 'yellow', 'red');

create type public.document_type as enum (
  'imaging_report', 'surgical_report', 'clinical_letter', 'referral', 'scan_image', 'other'
);

create type public.notification_type as enum (
  'rehab_programme_created', 'exercise_assigned', 'rehab_completed', 'restriction_changed',
  'milestone_completed', 'professional_comment', 'connection_created', 'recovery_trend_alert'
);

create type public.data_source as enum ('manual', 'checkin', 'wearable', 'gps', 'camera', 'import');

create type public.ai_insight_type as enum (
  'copilot_message', 'recovery_trend_summary', 'journal_summary', 'document_summary',
  'milestone_suggestion', 'athlete_progress_summary', 'professional_progress_summary'
);
create type public.ai_audience as enum ('athlete', 'professional');
create type public.ai_insight_status as enum ('pending', 'ready', 'failed', 'dismissed');

create type public.subscription_plan as enum ('free', 'premium_athlete', 'pro_clinic');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                        uuid primary key references auth.users (id) on delete cascade,
  full_name                 text not null default '' check (char_length(full_name) <= 120),
  avatar_url                text,
  primary_role              public.app_role,            -- null until onboarding completes
  timezone                  text not null default 'UTC',
  notification_preferences  jsonb not null default '{}'::jsonb,
  onboarded_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
comment on table public.profiles is 'Public profile for each auth.users row. "users" in the product spec maps to auth.users.';

-- ---------------------------------------------------------------------------
-- athletes / professionals
-- ---------------------------------------------------------------------------
create table public.athletes (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null unique references public.profiles (id) on delete cascade,
  sport                  text,
  position               text,
  team_name              text,
  date_of_birth          date,
  dominant_side          public.body_side,
  -- Weights/inversions for the personal recovery score. See src/domain/recovery-score.ts.
  recovery_score_config  jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.professionals (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null unique references public.profiles (id) on delete cascade,
  professional_role    public.professional_role not null,
  title                text,
  registration_number  text,
  bio                  text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- organisations
-- ---------------------------------------------------------------------------
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 160),
  slug        text unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  kind        public.org_kind not null default 'other',
  logo_url    text,
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.organisation_members (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  role             public.org_member_role not null,
  status           public.membership_status not null default 'active',
  invited_by       uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organisation_id, profile_id)
);
create index organisation_members_profile_idx on public.organisation_members (profile_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers for this file's tables
-- ---------------------------------------------------------------------------
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger athletes_updated_at before update on public.athletes
  for each row execute function public.set_updated_at();
create trigger professionals_updated_at before update on public.professionals
  for each row execute function public.set_updated_at();
create trigger organisations_updated_at before update on public.organisations
  for each row execute function public.set_updated_at();
create trigger organisation_members_updated_at before update on public.organisation_members
  for each row execute function public.set_updated_at();
