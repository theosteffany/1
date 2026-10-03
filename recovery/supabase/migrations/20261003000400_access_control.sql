-- =============================================================================
-- 0400: access control
--   * authorisation helper functions (SECURITY DEFINER, no RLS recursion)
--   * integrity triggers (ownership is immutable, authorship is stamped)
--   * Row Level Security policies for every table
--   * RPCs for flows that must not be expressible as plain table writes
--     (onboarding, invitations, permission changes)
--
-- Model: an athlete OWNS every row carrying their athlete_id. A professional
-- reaches an athlete's data only through an ACTIVE team_members connection
-- AND an explicit permission scope on that connection. Nothing else grants
-- access — organisation membership alone never exposes recovery data.
-- =============================================================================

alter table public.team_members add unique (id, athlete_id);
alter table public.permissions add foreign key (team_member_id, athlete_id)
  references public.team_members (id, athlete_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.current_athlete_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select a.id from public.athletes a where a.profile_id = auth.uid()
$$;

create or replace function public.current_professional_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.id from public.professionals p where p.profile_id = auth.uid()
$$;

create or replace function public.current_user_email()
returns text language sql stable security definer set search_path = '' as $$
  select lower(u.email) from auth.users u where u.id = auth.uid()
$$;

create or replace function public.is_athlete_owner(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.athletes a
    where a.id = p_athlete_id and a.profile_id = auth.uid()
  )
$$;

-- True when the caller is a professional with an ACTIVE connection to the
-- athlete that grants `p_scope`.
create or replace function public.has_scope(p_athlete_id uuid, p_scope public.permission_scope)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.permissions perm
    join public.team_members tm on tm.id = perm.team_member_id
    join public.professionals pro on pro.id = tm.professional_id
    where perm.athlete_id = p_athlete_id
      and perm.scope = p_scope
      and tm.status = 'active'
      and pro.profile_id = auth.uid()
  )
$$;

create or replace function public.can_access(p_athlete_id uuid, p_scope public.permission_scope)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_athlete_owner(p_athlete_id) or public.has_scope(p_athlete_id, p_scope)
$$;

create or replace function public.is_connected_professional(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members tm
    join public.professionals pro on pro.id = tm.professional_id
    where tm.athlete_id = p_athlete_id and tm.status = 'active' and pro.profile_id = auth.uid()
  )
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organisation_members m
    where m.organisation_id = p_org_id and m.profile_id = auth.uid() and m.status = 'active'
  )
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organisation_members m
    where m.organisation_id = p_org_id and m.profile_id = auth.uid()
      and m.status = 'active' and m.role = 'admin'
  )
$$;

-- Who may see a profile's display data (name, avatar):
-- self; athlete ↔ professional with a pending/active connection; members of a
-- shared organisation.
create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    p_profile_id = auth.uid()
    -- professional viewing a connected / inviting athlete
    or exists (
      select 1
      from public.team_members tm
      join public.athletes a on a.id = tm.athlete_id
      left join public.professionals pro on pro.id = tm.professional_id
      where a.profile_id = p_profile_id
        and (
          (tm.status = 'active' and pro.profile_id = auth.uid())
          or (tm.status = 'pending' and tm.invited_email = public.current_user_email())
        )
    )
    -- athlete viewing a connected professional
    or exists (
      select 1
      from public.team_members tm
      join public.athletes a on a.id = tm.athlete_id
      join public.professionals pro on pro.id = tm.professional_id
      where pro.profile_id = p_profile_id
        and a.profile_id = auth.uid()
        and tm.status in ('pending', 'active')
    )
    -- shared organisation
    or exists (
      select 1
      from public.organisation_members mine
      join public.organisation_members theirs on theirs.organisation_id = mine.organisation_id
      where mine.profile_id = auth.uid() and mine.status = 'active'
        and theirs.profile_id = p_profile_id and theirs.status = 'active'
    )
$$;

create or replace function public.can_read_programme(p_programme_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rehab_programmes rp
    where rp.id = p_programme_id
      and (
        public.can_access(rp.athlete_id, 'rehab.read')
        or (rp.programme_type = 'conditioning' and public.has_scope(rp.athlete_id, 'training.write'))
      )
  )
$$;

-- Athletes may edit programmes they authored (self-guided); professionals need
-- rehab.write, or training.write for conditioning programmes.
create or replace function public.can_write_programme(p_programme_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rehab_programmes rp
    where rp.id = p_programme_id
      and (
        (public.is_athlete_owner(rp.athlete_id) and rp.created_by = auth.uid())
        or public.has_scope(rp.athlete_id, 'rehab.write')
        or (rp.programme_type = 'conditioning' and public.has_scope(rp.athlete_id, 'training.write'))
      )
  )
$$;

create or replace function public.can_read_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.injury_events e
    where e.id = p_event_id
      and (
        public.is_athlete_owner(e.athlete_id)
        or (e.audience = 'team' and (public.has_scope(e.athlete_id, 'timeline.read')
                                     or public.has_scope(e.athlete_id, 'medical.read')))
        or (e.audience = 'clinical' and public.has_scope(e.athlete_id, 'medical.read'))
      )
  )
$$;

create or replace function public.can_read_shared_journal_entry(p_entry_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.journal_entries j
    where j.id = p_entry_id
      and j.visibility = 'shared'
      and public.has_scope(j.athlete_id, 'journal.shared.read')
  )
$$;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- athlete_id and authorship columns can never be changed by an UPDATE.
create or replace function public.freeze_ownership()
returns trigger language plpgsql set search_path = '' as $$
declare
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
  col text;
begin
  foreach col in array array['athlete_id', 'created_by', 'uploaded_by', 'recipient_id', 'profile_id'] loop
    if o ? col and (o -> col) is distinct from (n -> col) then
      raise exception 'Column % is immutable on %', col, tg_table_name using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'athletes','professionals','injuries','diagnoses','surgeries','injury_events','rehab_programmes',
    'rehab_phases','rehab_exercises','exercise_logs','daily_checkins','recovery_scores',
    'recovery_metrics','integration_connections','milestones','journal_entries','journal_media',
    'event_media','restrictions','medical_documents','team_members','permissions','notifications',
    'ai_insights'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.freeze_ownership()',
      t || '_freeze_ownership', t);
  end loop;
end $$;

-- restrictions.set_by always records the latest editor.
create or replace function public.stamp_restriction_setter()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.set_by := auth.uid();
  end if;
  return new;
end;
$$;
create trigger restrictions_stamp_setter before insert or update on public.restrictions
  for each row execute function public.stamp_restriction_setter();

-- journal: keep shared_at consistent with visibility.
create or replace function public.sync_journal_shared_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.visibility = 'shared' and new.shared_at is null then
    new.shared_at := now();
  elsif new.visibility = 'private' then
    new.shared_at := null;
  end if;
  return new;
end;
$$;
create trigger journal_entries_shared_at before insert or update on public.journal_entries
  for each row execute function public.sync_journal_shared_at();

-- New auth user → profile row (role is chosen during onboarding).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Organisation creator becomes its first admin.
create or replace function public.handle_new_organisation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.organisation_members (organisation_id, profile_id, role, status, invited_by)
    values (new.id, new.created_by, 'admin', 'active', new.created_by)
    on conflict (organisation_id, profile_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger organisations_add_creator after insert on public.organisations
  for each row execute function public.handle_new_organisation();

-- ---------------------------------------------------------------------------
-- Privileges. RLS decides WHICH rows; grants decide WHICH operations.
-- anon gets nothing: every product surface requires sign-in.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Server-written / append-only tables.
revoke insert, update, delete on public.notifications, public.ai_insights, public.subscriptions,
  public.plan_features, public.role_default_permissions, public.team_members, public.permissions
  from authenticated;
revoke all on public.audit_log from authenticated;
-- Column-level: recipients may only mark notifications read; athletes may only
-- change an AI insight's status (e.g. dismiss it).
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
grant update (status) on public.ai_insights to authenticated;

grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Policies — identity & organisations
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (public.can_view_profile(id));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy athletes_select on public.athletes for select to authenticated
  using (profile_id = auth.uid() or public.is_connected_professional(id)
         or public.can_view_profile(profile_id));
create policy athletes_insert on public.athletes for insert to authenticated
  with check (profile_id = auth.uid());
create policy athletes_update on public.athletes for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy professionals_select on public.professionals for select to authenticated
  using (public.can_view_profile(profile_id));
create policy professionals_insert on public.professionals for insert to authenticated
  with check (profile_id = auth.uid());
create policy professionals_update on public.professionals for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy organisations_select on public.organisations for select to authenticated
  using (public.is_org_member(id) or created_by = auth.uid());
create policy organisations_insert on public.organisations for insert to authenticated
  with check (created_by = auth.uid());
create policy organisations_update on public.organisations for update to authenticated
  using (public.is_org_admin(id)) with check (public.is_org_admin(id));
create policy organisations_delete on public.organisations for delete to authenticated
  using (public.is_org_admin(id));

create policy org_members_select on public.organisation_members for select to authenticated
  using (profile_id = auth.uid() or public.is_org_member(organisation_id));
create policy org_members_insert on public.organisation_members for insert to authenticated
  with check (public.is_org_admin(organisation_id));
create policy org_members_update on public.organisation_members for update to authenticated
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
create policy org_members_delete on public.organisation_members for delete to authenticated
  using (public.is_org_admin(organisation_id) or profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies — injuries & clinical
-- ---------------------------------------------------------------------------
create policy injuries_select on public.injuries for select to authenticated
  using (public.can_access(athlete_id, 'injury.read') or public.has_scope(athlete_id, 'medical.read'));
create policy injuries_insert on public.injuries for insert to authenticated
  with check (created_by = auth.uid()
              and (public.is_athlete_owner(athlete_id) or public.has_scope(athlete_id, 'medical.write')));
create policy injuries_update on public.injuries for update to authenticated
  using (public.is_athlete_owner(athlete_id) or public.has_scope(athlete_id, 'medical.write')
         or public.has_scope(athlete_id, 'rehab.write'))
  with check (public.is_athlete_owner(athlete_id) or public.has_scope(athlete_id, 'medical.write')
              or public.has_scope(athlete_id, 'rehab.write'));
create policy injuries_delete on public.injuries for delete to authenticated
  using (public.is_athlete_owner(athlete_id));

do $$
declare t text;
begin
  foreach t in array array['diagnoses', 'surgeries'] loop
    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated
        using (public.can_access(athlete_id, 'medical.read'));
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (created_by = auth.uid() and public.can_access(athlete_id, 'medical.write'));
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.can_access(athlete_id, 'medical.write'))
        with check (public.can_access(athlete_id, 'medical.write'));
      create policy %1$s_delete on public.%1$I for delete to authenticated
        using (public.is_athlete_owner(athlete_id)
               or (created_by = auth.uid() and public.has_scope(athlete_id, 'medical.write')));
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Policies — timeline
-- ---------------------------------------------------------------------------
create policy injury_events_select on public.injury_events for select to authenticated
  using (public.can_read_event(id));
create policy injury_events_insert on public.injury_events for insert to authenticated
  with check (
    created_by = auth.uid() and (
      public.is_athlete_owner(athlete_id)
      or (audience = 'team' and public.has_scope(athlete_id, 'timeline.write'))
      or (audience = 'clinical' and public.has_scope(athlete_id, 'medical.write'))
    ));
create policy injury_events_update on public.injury_events for update to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (created_by = auth.uid() and public.has_scope(athlete_id, 'timeline.write')))
  with check (
    public.is_athlete_owner(athlete_id)
    or (audience = 'team' and public.has_scope(athlete_id, 'timeline.write'))
    or (audience = 'clinical' and public.has_scope(athlete_id, 'medical.write')));
create policy injury_events_delete on public.injury_events for delete to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (created_by = auth.uid() and public.has_scope(athlete_id, 'timeline.write')));

-- ---------------------------------------------------------------------------
-- Policies — rehab
-- ---------------------------------------------------------------------------
create policy rehab_programmes_select on public.rehab_programmes for select to authenticated
  using (public.can_access(athlete_id, 'rehab.read')
         or (programme_type = 'conditioning' and public.has_scope(athlete_id, 'training.write')));
create policy rehab_programmes_insert on public.rehab_programmes for insert to authenticated
  with check (created_by = auth.uid() and (
    public.is_athlete_owner(athlete_id)
    or public.has_scope(athlete_id, 'rehab.write')
    or (programme_type = 'conditioning' and public.has_scope(athlete_id, 'training.write'))));
create policy rehab_programmes_update on public.rehab_programmes for update to authenticated
  using (public.can_write_programme(id))
  with check (
    (public.is_athlete_owner(athlete_id) and created_by = auth.uid())
    or public.has_scope(athlete_id, 'rehab.write')
    or (programme_type = 'conditioning' and public.has_scope(athlete_id, 'training.write')));
create policy rehab_programmes_delete on public.rehab_programmes for delete to authenticated
  using (public.can_write_programme(id));

do $$
declare t text;
begin
  foreach t in array array['rehab_phases', 'rehab_exercises'] loop
    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated
        using (public.can_read_programme(programme_id));
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (created_by = auth.uid() and public.can_write_programme(programme_id));
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.can_write_programme(programme_id))
        with check (public.can_write_programme(programme_id));
      create policy %1$s_delete on public.%1$I for delete to authenticated
        using (public.can_write_programme(programme_id));
    $f$, t);
  end loop;
end $$;

-- Adherence: athletes log; rehab.read holders review.
create policy exercise_logs_select on public.exercise_logs for select to authenticated
  using (public.can_access(athlete_id, 'rehab.read'));
create policy exercise_logs_write on public.exercise_logs for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

-- ---------------------------------------------------------------------------
-- Policies — check-ins, scores, metrics, integrations (athlete-authored)
-- ---------------------------------------------------------------------------
create policy daily_checkins_select on public.daily_checkins for select to authenticated
  using (public.can_access(athlete_id, 'checkins.read'));
create policy daily_checkins_write on public.daily_checkins for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

create policy recovery_scores_select on public.recovery_scores for select to authenticated
  using (public.can_access(athlete_id, 'metrics.read'));
create policy recovery_scores_write on public.recovery_scores for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

create policy recovery_metrics_select on public.recovery_metrics for select to authenticated
  using (public.can_access(athlete_id, 'metrics.read'));
create policy recovery_metrics_write on public.recovery_metrics for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

create policy integration_connections_owner on public.integration_connections for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

-- ---------------------------------------------------------------------------
-- Policies — milestones
-- ---------------------------------------------------------------------------
create policy milestones_select on public.milestones for select to authenticated
  using (public.can_access(athlete_id, 'milestones.read'));
create policy milestones_insert on public.milestones for insert to authenticated
  with check (created_by = auth.uid() and public.can_access(athlete_id, 'milestones.write'));
create policy milestones_update on public.milestones for update to authenticated
  using (public.can_access(athlete_id, 'milestones.write'))
  with check (public.can_access(athlete_id, 'milestones.write'));
create policy milestones_delete on public.milestones for delete to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (created_by = auth.uid() and public.has_scope(athlete_id, 'milestones.write')));

-- ---------------------------------------------------------------------------
-- Policies — journal (private unless explicitly shared)
-- ---------------------------------------------------------------------------
create policy journal_entries_owner on public.journal_entries for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));
create policy journal_entries_shared_select on public.journal_entries for select to authenticated
  using (visibility = 'shared' and public.has_scope(athlete_id, 'journal.shared.read'));

create policy journal_media_owner on public.journal_media for all to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));
create policy journal_media_shared_select on public.journal_media for select to authenticated
  using (public.can_read_shared_journal_entry(journal_entry_id));

-- ---------------------------------------------------------------------------
-- Policies — event / milestone media
-- ---------------------------------------------------------------------------
create policy event_media_select on public.event_media for select to authenticated
  using (
    public.is_athlete_owner(athlete_id)
    or (injury_event_id is not null and public.can_read_event(injury_event_id))
    or (milestone_id is not null and public.has_scope(athlete_id, 'milestones.read')));
create policy event_media_insert on public.event_media for insert to authenticated
  with check (created_by = auth.uid() and (
    public.is_athlete_owner(athlete_id)
    or (injury_event_id is not null and (public.has_scope(athlete_id, 'timeline.write')
                                         or public.has_scope(athlete_id, 'medical.write'))
        and public.can_read_event(injury_event_id))
    or (milestone_id is not null and public.has_scope(athlete_id, 'milestones.write'))));
create policy event_media_delete on public.event_media for delete to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (created_by = auth.uid() and public.is_connected_professional(athlete_id)));

-- ---------------------------------------------------------------------------
-- Policies — restrictions
-- Professionals with restrictions.write manage them. Athletes may record and
-- edit SELF-reported restrictions but cannot alter one set by a professional.
-- ---------------------------------------------------------------------------
create policy restrictions_select on public.restrictions for select to authenticated
  using (public.can_access(athlete_id, 'restrictions.read'));
create policy restrictions_insert on public.restrictions for insert to authenticated
  with check (public.is_athlete_owner(athlete_id) or public.has_scope(athlete_id, 'restrictions.write'));
create policy restrictions_update on public.restrictions for update to authenticated
  using ((public.is_athlete_owner(athlete_id) and set_by = auth.uid())
         or public.has_scope(athlete_id, 'restrictions.write'))
  with check (public.is_athlete_owner(athlete_id) or public.has_scope(athlete_id, 'restrictions.write'));
create policy restrictions_delete on public.restrictions for delete to authenticated
  using ((public.is_athlete_owner(athlete_id) and set_by = auth.uid())
         or public.has_scope(athlete_id, 'restrictions.write'));

-- ---------------------------------------------------------------------------
-- Policies — medical documents
-- ---------------------------------------------------------------------------
create policy medical_documents_select on public.medical_documents for select to authenticated
  using (public.can_access(athlete_id, 'documents.read'));
create policy medical_documents_insert on public.medical_documents for insert to authenticated
  with check (uploaded_by = auth.uid() and public.can_access(athlete_id, 'documents.write'));
create policy medical_documents_update on public.medical_documents for update to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (uploaded_by = auth.uid() and public.has_scope(athlete_id, 'documents.write')))
  with check (public.can_access(athlete_id, 'documents.write'));
create policy medical_documents_delete on public.medical_documents for delete to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (uploaded_by = auth.uid() and public.has_scope(athlete_id, 'documents.write')));

-- ---------------------------------------------------------------------------
-- Policies — team connections (writes go through RPCs below)
-- ---------------------------------------------------------------------------
create policy team_members_select on public.team_members for select to authenticated
  using (
    public.is_athlete_owner(athlete_id)
    or professional_id = public.current_professional_id()
    or (status = 'pending' and invited_email = public.current_user_email()));

create policy permissions_select on public.permissions for select to authenticated
  using (
    public.is_athlete_owner(athlete_id)
    or exists (select 1 from public.team_members tm
               where tm.id = team_member_id and tm.professional_id = public.current_professional_id())
    or exists (select 1 from public.team_members tm
               where tm.id = team_member_id and tm.status = 'pending'
                 and tm.invited_email = public.current_user_email()));

create policy role_default_permissions_select on public.role_default_permissions for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Policies — notifications, AI, subscriptions
-- ---------------------------------------------------------------------------
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated
  using (recipient_id = auth.uid());

create policy ai_insights_select on public.ai_insights for select to authenticated
  using (public.is_athlete_owner(athlete_id)
         or (audience = 'professional' and public.has_scope(athlete_id, 'insights.read')));
create policy ai_insights_update on public.ai_insights for update to authenticated
  using (public.is_athlete_owner(athlete_id)) with check (public.is_athlete_owner(athlete_id));

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (profile_id = auth.uid() or (organisation_id is not null and public.is_org_admin(organisation_id)));

create policy plan_features_select on public.plan_features for select to authenticated
  using (true);

-- audit_log: RLS enabled, no policies → service role only.
