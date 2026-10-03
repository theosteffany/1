-- =============================================================================
-- 0500: RPCs, entitlements, notifications, coach status board
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Entitlements
-- A user's effective plan is the highest active plan among their own
-- subscription and those of organisations they actively belong to.
-- ---------------------------------------------------------------------------
create or replace function public.current_plan()
returns public.subscription_plan language sql stable security definer set search_path = '' as $$
  select coalesce(max(s.plan), 'free'::public.subscription_plan)
  from public.subscriptions s
  where s.status in ('active', 'trialing')
    and (s.current_period_end is null or s.current_period_end > now())
    and (
      s.profile_id = auth.uid()
      or s.organisation_id in (
        select m.organisation_id from public.organisation_members m
        where m.profile_id = auth.uid() and m.status = 'active'
      )
    )
$$;

create or replace function public.has_entitlement(p_feature text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.plan_features f
    where f.plan = public.current_plan() and f.feature = p_feature
  )
$$;

create or replace function public.entitlement_limit(p_feature text)
returns integer language sql stable security definer set search_path = '' as $$
  select f.limit_value from public.plan_features f
  where f.plan = public.current_plan() and f.feature = p_feature
$$;

-- { "plan": "free", "features": { "core.checkins": null, "journal.media": 20, … } }
create or replace function public.get_my_entitlements()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'plan', public.current_plan(),
    'features', coalesce(
      (select jsonb_object_agg(f.feature, f.limit_value)
       from public.plan_features f where f.plan = public.current_plan()),
      '{}'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify(
  p_recipient uuid,
  p_athlete uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_data jsonb default '{}'::jsonb,
  p_dedupe_key text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Never notify people about their own actions.
  if p_recipient is null or p_recipient = auth.uid() then
    return;
  end if;
  insert into public.notifications (recipient_id, athlete_id, type, title, body, data, dedupe_key, actor_id)
  values (p_recipient, p_athlete, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb), p_dedupe_key, auth.uid())
  on conflict (recipient_id, dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

-- Notify the athlete and every active professional holding `p_scope`.
create or replace function public.notify_athlete_circle(
  p_athlete uuid,
  p_scope public.permission_scope,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_data jsonb,
  p_dedupe_key text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  perform public.notify(
    (select a.profile_id from public.athletes a where a.id = p_athlete),
    p_athlete, p_type, p_title, p_body, p_data, p_dedupe_key);

  for r in
    select distinct pro.profile_id
    from public.permissions perm
    join public.team_members tm on tm.id = perm.team_member_id and tm.status = 'active'
    join public.professionals pro on pro.id = tm.professional_id
    where perm.athlete_id = p_athlete and perm.scope = p_scope
  loop
    perform public.notify(r.profile_id, p_athlete, p_type, p_title, p_body, p_data, p_dedupe_key);
  end loop;
end;
$$;

create or replace function public.on_restriction_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.level is not distinct from old.level then
    return new;  -- notes/date edits are not worth a notification
  end if;
  perform public.notify_athlete_circle(
    new.athlete_id, 'restrictions.read', 'restriction_changed',
    initcap(replace(coalesce(new.label, new.activity), '_', ' ')) || ' → ' || upper(new.level::text),
    new.notes,
    jsonb_build_object('restriction_id', new.id, 'activity', new.activity, 'level', new.level,
                       'previous_level', case when tg_op = 'UPDATE' then old.level end),
    'restriction:' || new.id || ':' || new.level || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  return new;
end;
$$;
create trigger restrictions_notify after insert or update on public.restrictions
  for each row execute function public.on_restriction_change();

create or replace function public.on_milestone_achieved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'achieved' and (tg_op = 'INSERT' or old.status is distinct from 'achieved') then
    perform public.notify_athlete_circle(
      new.athlete_id, 'milestones.read', 'milestone_completed',
      'Milestone achieved: ' || new.title, null,
      jsonb_build_object('milestone_id', new.id),
      'milestone:' || new.id);
  end if;
  return new;
end;
$$;
create trigger milestones_notify after insert or update on public.milestones
  for each row execute function public.on_milestone_achieved();

create or replace function public.on_programme_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify(
    (select a.profile_id from public.athletes a where a.id = new.athlete_id),
    new.athlete_id, 'rehab_programme_created', 'New programme: ' || new.title, new.description,
    jsonb_build_object('programme_id', new.id), 'programme:' || new.id);
  return new;
end;
$$;
create trigger rehab_programmes_notify after insert on public.rehab_programmes
  for each row execute function public.on_programme_created();

-- Exercise assignments are batched: at most one notification per programme per day.
create or replace function public.on_exercise_assigned()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify(
    (select a.profile_id from public.athletes a where a.id = new.athlete_id),
    new.athlete_id, 'exercise_assigned', 'Your rehab programme was updated', null,
    jsonb_build_object('programme_id', new.programme_id),
    'exercises:' || new.programme_id || ':' || current_date);
  return new;
end;
$$;
create trigger rehab_exercises_notify after insert on public.rehab_exercises
  for each row execute function public.on_exercise_assigned();

create or replace function public.mark_all_notifications_read()
returns void language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null
$$;

-- ---------------------------------------------------------------------------
-- Onboarding
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_role public.app_role,
  p_full_name text,
  p_details jsonb default '{}'::jsonb
) returns public.profiles language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'Name is required' using errcode = '22023';
  end if;

  insert into public.profiles (id, full_name, primary_role, onboarded_at)
  values (uid, left(trim(p_full_name), 120), p_role, now())
  on conflict (id) do update
    set full_name = excluded.full_name,
        primary_role = excluded.primary_role,
        onboarded_at = coalesce(public.profiles.onboarded_at, now())
  returning * into result;

  if p_role = 'athlete' then
    insert into public.athletes (profile_id, sport, position, team_name)
    values (uid, nullif(p_details ->> 'sport', ''), nullif(p_details ->> 'position', ''),
            nullif(p_details ->> 'team_name', ''))
    on conflict (profile_id) do update
      set sport = excluded.sport, position = excluded.position, team_name = excluded.team_name;
  elsif p_role in ('physio', 'sc_coach', 'team_coach', 'doctor', 'support_staff') then
    insert into public.professionals (profile_id, professional_role, title)
    values (uid, p_role::text::public.professional_role, nullif(p_details ->> 'title', ''))
    on conflict (profile_id) do update
      set professional_role = excluded.professional_role, title = excluded.title;
  elsif p_role = 'org_admin' then
    if coalesce(p_details ->> 'organisation_name', '') <> '' then
      insert into public.organisations (name, kind, created_by)
      values (left(p_details ->> 'organisation_name', 160),
              coalesce(nullif(p_details ->> 'organisation_kind', '')::public.org_kind, 'other'), uid);
    end if;
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Team connections
-- ---------------------------------------------------------------------------
create or replace function public.invite_team_member(
  p_email text,
  p_role public.professional_role,
  p_scopes public.permission_scope[] default null
) returns public.team_members language plpgsql security definer set search_path = '' as $$
declare
  v_athlete uuid := public.current_athlete_id();
  v_email text := lower(trim(p_email));
  v_limit integer;
  v_count integer;
  v_row public.team_members;
  v_invitee uuid;
begin
  if v_athlete is null then
    raise exception 'Only athletes can invite team members' using errcode = '42501';
  end if;
  if v_email = public.current_user_email() then
    raise exception 'You cannot invite yourself' using errcode = '22023';
  end if;

  -- Entitlement: connection limit for the athlete's plan (null = unlimited).
  v_limit := public.entitlement_limit('team.connections');
  if v_limit is not null then
    select count(*) into v_count from public.team_members
    where athlete_id = v_athlete and status in ('pending', 'active');
    if v_count >= v_limit then
      raise exception 'Your plan allows % team connections', v_limit using errcode = 'P0001',
        hint = 'entitlement:team.connections';
    end if;
  end if;

  insert into public.team_members (athlete_id, invited_email, role, status, invited_by)
  values (v_athlete, v_email, p_role, 'pending', auth.uid())
  returning * into v_row;

  insert into public.permissions (team_member_id, athlete_id, scope, granted_by)
  select v_row.id, v_athlete, s, auth.uid()
  from unnest(coalesce(p_scopes,
       array(select d.scope from public.role_default_permissions d where d.role = p_role))) as s
  on conflict do nothing;

  select u.id into v_invitee from auth.users u where lower(u.email) = v_email;
  perform public.notify(
    v_invitee, v_athlete, 'connection_created',
    (select coalesce(nullif(p.full_name, ''), 'An athlete') from public.profiles p where p.id = auth.uid())
      || ' invited you to their recovery team',
    null, jsonb_build_object('team_member_id', v_row.id), 'invite:' || v_row.id);

  return v_row;
end;
$$;

create or replace function public.accept_team_invite(p_team_member_id uuid)
returns public.team_members language plpgsql security definer set search_path = '' as $$
declare
  v_pro uuid := public.current_professional_id();
  v_row public.team_members;
begin
  if v_pro is null then
    raise exception 'Complete your professional profile first' using errcode = '42501';
  end if;

  update public.team_members
     set status = 'active', professional_id = v_pro, accepted_at = now()
   where id = p_team_member_id
     and status = 'pending'
     and invited_email = public.current_user_email()
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  perform public.notify(
    (select a.profile_id from public.athletes a where a.id = v_row.athlete_id),
    v_row.athlete_id, 'connection_created',
    (select coalesce(nullif(p.full_name, ''), 'A professional') from public.profiles p where p.id = auth.uid())
      || ' joined your team',
    null, jsonb_build_object('team_member_id', v_row.id), 'accepted:' || v_row.id);

  return v_row;
end;
$$;

create or replace function public.decline_team_invite(p_team_member_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.team_members set status = 'declined'
   where id = p_team_member_id and status = 'pending'
     and invited_email = public.current_user_email();
  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Athlete revokes (or cancels) a connection. Takes effect immediately for RLS.
create or replace function public.revoke_team_member(p_team_member_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.team_members set status = 'revoked', revoked_at = now()
   where id = p_team_member_id and status in ('pending', 'active')
     and public.is_athlete_owner(athlete_id);
  if not found then
    raise exception 'Connection not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Athlete replaces the scope set on a connection.
create or replace function public.set_team_member_permissions(
  p_team_member_id uuid,
  p_scopes public.permission_scope[]
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_athlete uuid;
begin
  select tm.athlete_id into v_athlete from public.team_members tm
  where tm.id = p_team_member_id and tm.status in ('pending', 'active')
    and public.is_athlete_owner(tm.athlete_id);
  if v_athlete is null then
    raise exception 'Connection not found' using errcode = 'P0002';
  end if;

  delete from public.permissions
   where team_member_id = p_team_member_id and not (scope = any (coalesce(p_scopes, '{}')));
  insert into public.permissions (team_member_id, athlete_id, scope, granted_by)
  select p_team_member_id, v_athlete, s, auth.uid() from unnest(coalesce(p_scopes, '{}')) as s
  on conflict (team_member_id, scope) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Coach / staff status board — the ONLY route through which availability-only
-- roles see injury-derived data. Returns no diagnosis, notes or clinical text.
-- Restrictions and milestones are included only when separately authorised.
-- ---------------------------------------------------------------------------
create or replace function public.get_athlete_status_board()
returns table (
  athlete_id uuid,
  full_name text,
  avatar_url text,
  sport text,
  team_name text,
  availability_status public.availability_status,
  return_to_training_status public.return_to_training_status,
  current_phase text,
  next_review_on date,
  expected_return_on date,
  restrictions jsonb,
  next_milestone jsonb,
  updated_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select
    a.id,
    p.full_name,
    p.avatar_url,
    a.sport,
    a.team_name,
    i.availability_status,
    i.return_to_training_status,
    (select ph.name from public.rehab_phases ph
       join public.rehab_programmes rp on rp.id = ph.programme_id
      where rp.athlete_id = a.id and rp.status = 'active' and ph.status = 'current'
      order by rp.programme_type, ph.updated_at desc limit 1),
    i.next_review_on,
    i.expected_return_on,
    case when public.can_access(a.id, 'restrictions.read') then
      (select coalesce(jsonb_agg(jsonb_build_object(
                'activity', r.activity, 'label', r.label, 'level', r.level, 'review_on', r.review_on)
              order by r.activity), '[]'::jsonb)
         from public.restrictions r where r.athlete_id = a.id)
    end,
    case when public.can_access(a.id, 'milestones.read') then
      (select jsonb_build_object('title', m.title, 'target_on', m.target_on, 'milestone_type', m.milestone_type)
         from public.milestones m
        where m.athlete_id = a.id and m.status = 'planned'
        order by m.target_on nulls last, m.sort_order limit 1)
    end,
    greatest(i.updated_at, a.updated_at)
  from public.athletes a
  join public.profiles p on p.id = a.profile_id
  left join public.injuries i
    on i.athlete_id = a.id and i.status = 'active' and i.is_primary
  where public.can_access(a.id, 'availability.read')
$$;

-- Grants for functions created in this file.
revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
-- Internal helpers should not be callable directly over the API.
revoke execute on function public.notify(uuid, uuid, public.notification_type, text, text, jsonb, text) from authenticated;
revoke execute on function public.notify_athlete_circle(uuid, public.permission_scope, public.notification_type, text, text, jsonb, text) from authenticated;
