-- =============================================================================
-- 0200: recovery domain — injuries, clinical records, rehab, check-ins,
--       metrics, milestones, journal, restrictions, media
--
-- Convention: every athlete-owned row carries `athlete_id` (denormalised where
-- needed) so that Row Level Security can be evaluated with a single,
-- indexed lookup and without joins through parent tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- injuries
-- ---------------------------------------------------------------------------
create table public.injuries (
  id                         uuid primary key default gen_random_uuid(),
  athlete_id                 uuid not null references public.athletes (id) on delete cascade,
  title                      text not null check (char_length(title) between 1 and 160),
  body_region                text,
  side                       public.body_side,
  mechanism                  text,
  injured_on                 date not null,
  status                     public.injury_status not null default 'active',
  is_primary                 boolean not null default true,
  -- Availability block (exposed to coaches via get_athlete_status_board()).
  availability_status        public.availability_status not null default 'unavailable',
  return_to_training_status  public.return_to_training_status not null default 'rehab_only',
  expected_return_on         date,
  next_review_on             date,
  created_by                 uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index injuries_athlete_idx on public.injuries (athlete_id, status);
-- At most one primary active injury per athlete ("the active injury" on Home).
create unique index injuries_one_primary_active_idx
  on public.injuries (athlete_id) where is_primary and status = 'active';

-- ---------------------------------------------------------------------------
-- clinical records
-- ---------------------------------------------------------------------------
create table public.diagnoses (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  injury_id     uuid not null references public.injuries (id) on delete cascade,
  diagnosis     text not null,
  grade         text,
  diagnosed_on  date,
  diagnosed_by  text,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index diagnoses_athlete_idx on public.diagnoses (athlete_id);
create index diagnoses_injury_idx on public.diagnoses (injury_id);

create table public.surgeries (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  injury_id     uuid not null references public.injuries (id) on delete cascade,
  procedure     text not null,
  surgeon       text,
  facility      text,
  performed_on  date,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index surgeries_athlete_idx on public.surgeries (athlete_id);
create index surgeries_injury_idx on public.surgeries (injury_id);

-- ---------------------------------------------------------------------------
-- timeline
-- ---------------------------------------------------------------------------
create table public.injury_events (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.athletes (id) on delete cascade,
  injury_id    uuid references public.injuries (id) on delete cascade,
  event_type   public.timeline_event_type not null,
  title        text not null check (char_length(title) between 1 and 160),
  description  text,
  occurred_on  date not null,
  audience     public.event_audience not null default 'team',
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index injury_events_athlete_idx on public.injury_events (athlete_id, occurred_on desc);
create index injury_events_injury_idx on public.injury_events (injury_id);

-- ---------------------------------------------------------------------------
-- rehab & conditioning programmes
-- ---------------------------------------------------------------------------
create table public.rehab_programmes (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid not null references public.athletes (id) on delete cascade,
  injury_id      uuid references public.injuries (id) on delete set null,
  programme_type public.programme_type not null default 'rehab',
  title          text not null check (char_length(title) between 1 and 160),
  description    text,
  status         public.programme_status not null default 'active',
  starts_on      date,
  ends_on        date,
  -- Future: sport-specific return-to-play protocol this programme follows.
  protocol_key   text,
  created_by     uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index rehab_programmes_athlete_idx on public.rehab_programmes (athlete_id, status);

create table public.rehab_phases (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  programme_id  uuid not null references public.rehab_programmes (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  goals         text,
  sort_order    integer not null default 0,
  status        public.phase_status not null default 'upcoming',
  starts_on     date,
  ends_on       date,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index rehab_phases_programme_idx on public.rehab_phases (programme_id, sort_order);
create index rehab_phases_athlete_idx on public.rehab_phases (athlete_id);
create unique index rehab_phases_one_current_idx
  on public.rehab_phases (programme_id) where status = 'current';

create table public.rehab_exercises (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references public.athletes (id) on delete cascade,
  programme_id      uuid not null references public.rehab_programmes (id) on delete cascade,
  phase_id          uuid references public.rehab_phases (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 160),
  sets              smallint check (sets between 0 and 100),
  reps              smallint check (reps between 0 and 1000),
  duration_seconds  integer check (duration_seconds between 0 and 86400),
  tempo             text,
  load              text,
  instructions      text,
  video_url         text,
  notes             text,
  -- ISO weekdays (1 = Monday … 7 = Sunday) the exercise is scheduled. Empty = daily.
  schedule_days     smallint[] not null default '{}'
                    check (schedule_days <@ array[1,2,3,4,5,6,7]::smallint[]),
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index rehab_exercises_programme_idx on public.rehab_exercises (programme_id, sort_order);
create index rehab_exercises_athlete_idx on public.rehab_exercises (athlete_id) where is_active;
create index rehab_exercises_phase_idx on public.rehab_exercises (phase_id);

create table public.exercise_logs (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  exercise_id   uuid not null references public.rehab_exercises (id) on delete cascade,
  performed_on  date not null default current_date,
  status        public.exercise_log_status not null,
  sets_done     smallint check (sets_done between 0 and 100),
  reps_done     smallint check (reps_done between 0 and 1000),
  pain          smallint check (pain between 0 and 10),
  difficulty    smallint check (difficulty between 0 and 10),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (exercise_id, performed_on)
);
create index exercise_logs_athlete_idx on public.exercise_logs (athlete_id, performed_on desc);

-- ---------------------------------------------------------------------------
-- daily check-ins, scores, metrics
-- ---------------------------------------------------------------------------
create table public.daily_checkins (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  injury_id     uuid references public.injuries (id) on delete set null,
  checkin_date  date not null default current_date,
  pain          smallint not null check (pain between 0 and 10),
  swelling      smallint not null check (swelling between 0 and 10),
  stiffness     smallint not null check (stiffness between 0 and 10),
  energy        smallint not null check (energy between 0 and 10),
  sleep         smallint not null check (sleep between 0 and 10),
  mood          smallint not null check (mood between 0 and 10),
  confidence    smallint not null check (confidence between 0 and 10),
  notes         text check (char_length(notes) <= 2000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (athlete_id, checkin_date)
);
create index daily_checkins_athlete_idx on public.daily_checkins (athlete_id, checkin_date desc);

-- Personal tracking metric — NOT a medical assessment.
create table public.recovery_scores (
  id                 uuid primary key default gen_random_uuid(),
  athlete_id         uuid not null references public.athletes (id) on delete cascade,
  checkin_id         uuid references public.daily_checkins (id) on delete cascade,
  score_date         date not null,
  score              numeric(5,2) not null check (score between 0 and 100),
  components         jsonb not null default '{}'::jsonb,
  algorithm_version  text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (athlete_id, score_date)
);
comment on table public.recovery_scores is 'Personal recovery tracking score. Not a medical diagnosis or clearance.';

-- Generic time-series store. Designed for future wearables (HRV, sleep, GPS
-- load), camera-based ROM, etc. `metric_key` is namespaced, e.g. 'hrv.rmssd',
-- 'sleep.duration_min', 'gps.total_distance_m', 'rom.knee_flexion_deg'.
create table public.recovery_metrics (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.athletes (id) on delete cascade,
  metric_key   text not null check (metric_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'),
  value        numeric not null,
  unit         text,
  recorded_at  timestamptz not null,
  source       public.data_source not null default 'manual',
  provider     text,                -- e.g. 'apple_health', 'garmin', 'whoop'
  external_id  text,                -- provider record id, for idempotent sync
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index recovery_metrics_athlete_key_idx on public.recovery_metrics (athlete_id, metric_key, recorded_at desc);
create unique index recovery_metrics_external_idx
  on public.recovery_metrics (athlete_id, provider, external_id) where external_id is not null;

-- Future: wearable / data-provider connections (Apple Health, Garmin, WHOOP …).
create table public.integration_connections (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  provider        text not null,
  status          text not null default 'disconnected'
                  check (status in ('connected', 'disconnected', 'error')),
  scopes          text[] not null default '{}',
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (athlete_id, provider)
);

-- ---------------------------------------------------------------------------
-- milestones
-- ---------------------------------------------------------------------------
create table public.milestones (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  injury_id       uuid references public.injuries (id) on delete set null,
  milestone_type  public.milestone_type not null default 'custom',
  title           text not null check (char_length(title) between 1 and 160),
  status          public.milestone_status not null default 'planned',
  target_on       date,
  achieved_on     date,
  notes           text,
  sort_order      integer not null default 0,
  created_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check ((status = 'achieved') = (achieved_on is not null))
);
create index milestones_athlete_idx on public.milestones (athlete_id, status, sort_order);

-- ---------------------------------------------------------------------------
-- journal (PRIVATE by default)
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references public.athletes (id) on delete cascade,
  injury_id     uuid references public.injuries (id) on delete set null,
  milestone_id  uuid references public.milestones (id) on delete set null,
  entry_date    date not null default current_date,
  title         text check (char_length(title) <= 160),
  body          text check (char_length(body) <= 20000),
  mood          smallint check (mood between 0 and 10),
  visibility    public.journal_visibility not null default 'private',
  shared_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((visibility = 'shared') = (shared_at is not null))
);
create index journal_entries_athlete_idx on public.journal_entries (athlete_id, entry_date desc);

create table public.journal_media (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references public.athletes (id) on delete cascade,
  journal_entry_id  uuid not null references public.journal_entries (id) on delete cascade,
  media_type        public.media_type not null check (media_type <> 'document'),
  storage_path      text not null unique,   -- bucket 'journal-media', '{athlete_id}/{entry_id}/{file}'
  mime_type         text,
  duration_seconds  numeric,
  size_bytes        bigint,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index journal_media_entry_idx on public.journal_media (journal_entry_id);
create index journal_media_athlete_idx on public.journal_media (athlete_id);

-- Media attached to timeline events or milestones (bucket 'event-media').
create table public.event_media (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references public.athletes (id) on delete cascade,
  injury_event_id   uuid references public.injury_events (id) on delete cascade,
  milestone_id      uuid references public.milestones (id) on delete cascade,
  media_type        public.media_type not null,
  storage_path      text not null unique,   -- '{athlete_id}/{event_or_milestone_id}/{file}'
  mime_type         text,
  duration_seconds  numeric,
  size_bytes        bigint,
  created_by        uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (num_nonnulls(injury_event_id, milestone_id) = 1)
);
create index event_media_event_idx on public.event_media (injury_event_id);
create index event_media_milestone_idx on public.event_media (milestone_id);

-- ---------------------------------------------------------------------------
-- restrictions (traffic-light)
-- ---------------------------------------------------------------------------
create table public.restrictions (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  injury_id       uuid references public.injuries (id) on delete set null,
  -- Activity key: standard ('contact','sprinting','change_of_direction','kicking',
  -- 'jumping','gym','running','bike','pool') or a sport-specific custom key.
  activity        text not null check (activity ~ '^[a-z][a-z0-9_]{1,40}$'),
  label           text,
  level           public.restriction_level not null,
  notes           text,
  effective_from  date not null default current_date,
  review_on       date,
  set_by          uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (athlete_id, activity)
);

-- ---------------------------------------------------------------------------
-- medical documents
-- ---------------------------------------------------------------------------
create table public.medical_documents (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid not null references public.athletes (id) on delete cascade,
  injury_id      uuid references public.injuries (id) on delete set null,
  title          text not null check (char_length(title) between 1 and 200),
  document_type  public.document_type not null default 'other',
  document_date  date,
  storage_path   text not null unique,    -- bucket 'medical-documents', '{athlete_id}/{file}'
  mime_type      text,
  size_bytes     bigint,
  uploaded_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index medical_documents_athlete_idx on public.medical_documents (athlete_id, document_date desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'injuries','diagnoses','surgeries','injury_events','rehab_programmes','rehab_phases',
    'rehab_exercises','exercise_logs','daily_checkins','recovery_scores','recovery_metrics',
    'integration_connections','milestones','journal_entries','journal_media','event_media',
    'restrictions','medical_documents'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Tenant-integrity constraints
-- Composite foreign keys guarantee a child row always belongs to the SAME
-- athlete as its parent, so a professional authorised for athlete A can never
-- attach rows to athlete B's records by forging `athlete_id`.
-- ---------------------------------------------------------------------------
alter table public.injuries          add unique (id, athlete_id);
alter table public.injury_events     add unique (id, athlete_id);
alter table public.rehab_programmes  add unique (id, athlete_id);
alter table public.rehab_phases      add unique (id, athlete_id);
alter table public.rehab_exercises   add unique (id, athlete_id);
alter table public.daily_checkins    add unique (id, athlete_id);
alter table public.milestones        add unique (id, athlete_id);
alter table public.journal_entries   add unique (id, athlete_id);

alter table public.diagnoses add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete cascade;
alter table public.surgeries add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete cascade;
alter table public.injury_events add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete cascade;
alter table public.rehab_programmes add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
alter table public.rehab_phases add foreign key (programme_id, athlete_id)
  references public.rehab_programmes (id, athlete_id) on delete cascade;
alter table public.rehab_exercises add foreign key (programme_id, athlete_id)
  references public.rehab_programmes (id, athlete_id) on delete cascade;
alter table public.rehab_exercises add foreign key (phase_id, athlete_id)
  references public.rehab_phases (id, athlete_id) on delete cascade;
alter table public.exercise_logs add foreign key (exercise_id, athlete_id)
  references public.rehab_exercises (id, athlete_id) on delete cascade;
alter table public.daily_checkins add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
alter table public.recovery_scores add foreign key (checkin_id, athlete_id)
  references public.daily_checkins (id, athlete_id) on delete cascade;
alter table public.milestones add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
alter table public.journal_entries add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
alter table public.journal_entries add foreign key (milestone_id, athlete_id)
  references public.milestones (id, athlete_id) on delete set null (milestone_id);
alter table public.journal_media add foreign key (journal_entry_id, athlete_id)
  references public.journal_entries (id, athlete_id) on delete cascade;
alter table public.event_media add foreign key (injury_event_id, athlete_id)
  references public.injury_events (id, athlete_id) on delete cascade;
alter table public.event_media add foreign key (milestone_id, athlete_id)
  references public.milestones (id, athlete_id) on delete cascade;
alter table public.restrictions add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
alter table public.medical_documents add foreign key (injury_id, athlete_id)
  references public.injuries (id, athlete_id) on delete set null (injury_id);
