-- =============================================================================
-- 0300: team connections, permissions, notifications, AI, subscriptions, audit
-- =============================================================================

-- ---------------------------------------------------------------------------
-- team_members — one row per athlete ↔ professional connection
-- ---------------------------------------------------------------------------
create table public.team_members (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references public.athletes (id) on delete cascade,
  professional_id  uuid references public.professionals (id) on delete cascade, -- null until accepted
  invited_email    text not null check (invited_email = lower(invited_email) and invited_email like '%_@_%'),
  role             public.professional_role not null,
  status           public.connection_status not null default 'pending',
  organisation_id  uuid references public.organisations (id) on delete set null,
  invited_by       uuid references public.profiles (id) on delete set null default auth.uid(),
  accepted_at      timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (status <> 'active' or professional_id is not null)
);
create index team_members_athlete_idx on public.team_members (athlete_id, status);
create index team_members_professional_idx on public.team_members (professional_id, status);
create index team_members_email_idx on public.team_members (invited_email) where status = 'pending';
create unique index team_members_live_email_idx
  on public.team_members (athlete_id, invited_email) where status in ('pending', 'active');

-- Granted scopes per connection.
create table public.permissions (
  id              uuid primary key default gen_random_uuid(),
  team_member_id  uuid not null references public.team_members (id) on delete cascade,
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  scope           public.permission_scope not null,
  granted_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (team_member_id, scope)
);
create index permissions_athlete_scope_idx on public.permissions (athlete_id, scope);

-- Default scope set per professional role ("minimum necessary access").
-- Applied when an athlete invites a professional; the athlete can then adjust.
create table public.role_default_permissions (
  role        public.professional_role not null,
  scope       public.permission_scope not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (role, scope)
);

insert into public.role_default_permissions (role, scope) values
  -- Physio: manages rehab, restrictions, milestones, timeline; clinical read.
  ('physio','availability.read'),('physio','injury.read'),
  ('physio','restrictions.read'),('physio','restrictions.write'),
  ('physio','rehab.read'),('physio','rehab.write'),
  ('physio','checkins.read'),('physio','metrics.read'),
  ('physio','milestones.read'),('physio','milestones.write'),
  ('physio','timeline.read'),('physio','timeline.write'),
  ('physio','medical.read'),('physio','documents.read'),('physio','documents.write'),
  ('physio','journal.shared.read'),('physio','insights.read'),
  -- Doctor / specialist: clinical.
  ('doctor','availability.read'),('doctor','injury.read'),
  ('doctor','restrictions.read'),('doctor','restrictions.write'),
  ('doctor','rehab.read'),('doctor','checkins.read'),('doctor','metrics.read'),
  ('doctor','milestones.read'),('doctor','timeline.read'),('doctor','timeline.write'),
  ('doctor','medical.read'),('doctor','medical.write'),
  ('doctor','documents.read'),('doctor','documents.write'),('doctor','journal.shared.read'),
  ('doctor','insights.read'),
  -- S&C: physical/training information, no clinical detail.
  ('sc_coach','availability.read'),('sc_coach','injury.read'),
  ('sc_coach','restrictions.read'),('sc_coach','rehab.read'),('sc_coach','training.write'),
  ('sc_coach','metrics.read'),('sc_coach','milestones.read'),('sc_coach','timeline.read'),
  ('sc_coach','journal.shared.read'),
  -- Team coach: availability only.
  ('team_coach','availability.read'),('team_coach','restrictions.read'),('team_coach','milestones.read'),
  -- Other support staff: availability only.
  ('support_staff','availability.read');

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  athlete_id    uuid references public.athletes (id) on delete cascade,
  type          public.notification_type not null,
  title         text not null,
  body          text,
  data          jsonb not null default '{}'::jsonb,
  -- Noise control: identical (recipient, dedupe_key) notifications are dropped.
  dedupe_key    text,
  actor_id      uuid references public.profiles (id) on delete set null,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
create unique index notifications_dedupe_idx
  on public.notifications (recipient_id, dedupe_key) where dedupe_key is not null;

-- ---------------------------------------------------------------------------
-- AI insights — informational/educational output only
-- ---------------------------------------------------------------------------
create table public.ai_insights (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  insight_type    public.ai_insight_type not null,
  audience        public.ai_audience not null default 'athlete',
  status          public.ai_insight_status not null default 'pending',
  title           text,
  content         text,
  source_refs     jsonb not null default '[]'::jsonb,   -- [{table, id}] the insight was built from
  model           text,
  prompt_version  text,
  disclaimer      text not null default
    'Informational only. Not a diagnosis, medical clearance or substitute for your medical team.',
  requested_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index ai_insights_athlete_idx on public.ai_insights (athlete_id, created_at desc);

-- ---------------------------------------------------------------------------
-- subscriptions & entitlements
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  profile_id                uuid references public.profiles (id) on delete cascade,
  organisation_id           uuid references public.organisations (id) on delete cascade,
  plan                      public.subscription_plan not null,
  status                    public.subscription_status not null default 'active',
  seats                     integer check (seats > 0),
  current_period_end        timestamptz,
  provider                  text,                -- e.g. 'stripe'
  provider_customer_id      text,
  provider_subscription_id  text unique,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (num_nonnulls(profile_id, organisation_id) = 1)
);
create index subscriptions_profile_idx on public.subscriptions (profile_id) where profile_id is not null;
create index subscriptions_org_idx on public.subscriptions (organisation_id) where organisation_id is not null;

-- Central feature catalogue per plan. Plans are cumulative in the app layer
-- (pro_clinic ⊇ premium_athlete ⊇ free), but rows are explicit here so the
-- database can answer has_entitlement() without application code.
create table public.plan_features (
  plan         public.subscription_plan not null,
  feature      text not null check (feature ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'),
  limit_value  integer,          -- null = unlimited
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (plan, feature)
);

with features(feature, tier, free_limit) as (values
  -- core (all plans)
  ('core.checkins', 'free', null), ('core.rehab', 'free', null), ('core.journal', 'free', null),
  ('core.milestones', 'free', null), ('core.timeline', 'free', null), ('core.team', 'free', null),
  ('journal.media', 'free', 20), ('team.connections', 'free', 3),
  -- premium athlete
  ('analytics.advanced', 'premium_athlete', null), ('ai.copilot', 'premium_athlete', null),
  ('ai.insights', 'premium_athlete', null), ('milestones.advanced', 'premium_athlete', null),
  ('documents.vault', 'premium_athlete', null), ('timeline.advanced', 'premium_athlete', null),
  ('trends.detection', 'premium_athlete', null), ('dashboard.personalised', 'premium_athlete', null),
  ('story.generation', 'premium_athlete', null),
  -- pro / clinic
  ('org.multi_athlete', 'pro_clinic', null), ('org.multi_professional', 'pro_clinic', null),
  ('org.dashboard', 'pro_clinic', null), ('programme.builder', 'pro_clinic', null),
  ('exercise.library', 'pro_clinic', null), ('exercise.custom', 'pro_clinic', null),
  ('analytics.org', 'pro_clinic', null), ('reporting', 'pro_clinic', null),
  ('org.permissions', 'pro_clinic', null), ('admin.controls', 'pro_clinic', null),
  ('billing', 'pro_clinic', null)
), plans(plan, rank) as (values
  ('free'::public.subscription_plan, 0), ('premium_athlete', 1), ('pro_clinic', 2)
), tiers(tier, rank) as (values ('free', 0), ('premium_athlete', 1), ('pro_clinic', 2))
insert into public.plan_features (plan, feature, limit_value)
select p.plan, f.feature, case when p.plan = 'free' then f.free_limit end
from features f
join tiers t on t.tier = f.tier
join plans p on p.rank >= t.rank;

-- ---------------------------------------------------------------------------
-- audit log (append-only; written by triggers, readable by service role only)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  row_id      uuid,
  athlete_id  uuid,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id    uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_athlete_idx on public.audit_log (athlete_id, created_at desc);
create index audit_log_row_idx on public.audit_log (table_name, row_id);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (table_name, row_id, athlete_id, action, actor_id, old_data, new_data)
  values (
    tg_table_name,
    (rec ->> 'id')::uuid,
    (rec ->> 'athlete_id')::uuid,
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'injuries','diagnoses','surgeries','restrictions','medical_documents',
    'rehab_programmes','team_members','permissions','subscriptions'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'team_members','permissions','role_default_permissions','notifications','ai_insights',
    'subscriptions','plan_features'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end $$;
