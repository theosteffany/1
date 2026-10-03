-- =============================================================================
-- Row Level Security & permission tests.
-- Runs against plain Postgres + supabase_stub.sql (see scripts/db-test.sh).
-- Each `tests.ok` / `tests.throws` raises on failure, aborting the run.
-- =============================================================================
\set ON_ERROR_STOP 1

create schema tests;
grant usage on schema tests to authenticated, anon;

create function tests.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAILED: %', p_msg;
  end if;
  raise notice 'ok  %', p_msg;
end $$;

create function tests.throws(p_sql text, p_msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok  % (%)', p_msg, sqlerrm;
    return;
  end;
  raise exception 'FAILED (no error): %', p_msg;
end $$;

-- Mutations that RLS silently filters return 0 rows rather than raising.
create function tests.affected(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on all functions in schema tests to authenticated, anon;

create function tests.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), false);
$$;
grant execute on function tests.login(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@athlete.test', '{"full_name":"Alice Athlete"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@athlete.test',   '{"full_name":"Bob Athlete"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'pat@physio.test',    '{"full_name":"Pat Physio"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'casey@coach.test',   '{"full_name":"Casey Coach"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'sam@sc.test',        '{"full_name":"Sam S&C"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'doc@doctor.test',    '{"full_name":"Dr Dee"}'),
  ('00000000-0000-0000-0000-0000000000ff', 'mallory@evil.test',  '{"full_name":"Mallory"}');

select tests.ok((select count(*) from public.profiles) = 7, 'auth signup trigger creates profiles');

-- anon has no access at all
set role anon;
select tests.throws('select * from public.profiles', 'anon cannot read profiles');
select tests.throws('select * from public.daily_checkins', 'anon cannot read check-ins');
reset role;

-- Onboarding ---------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select public.complete_onboarding('athlete', 'Alice Athlete', '{"sport":"Rugby","position":"Wing"}');
select tests.login('00000000-0000-0000-0000-00000000000b');
select public.complete_onboarding('athlete', 'Bob Athlete', '{"sport":"Football"}');
select tests.login('00000000-0000-0000-0000-0000000000a1');
select public.complete_onboarding('physio', 'Pat Physio');
select tests.login('00000000-0000-0000-0000-0000000000a2');
select public.complete_onboarding('team_coach', 'Casey Coach');
select tests.login('00000000-0000-0000-0000-0000000000a3');
select public.complete_onboarding('sc_coach', 'Sam S&C');
select tests.login('00000000-0000-0000-0000-0000000000a4');
select public.complete_onboarding('doctor', 'Dr Dee');
select tests.login('00000000-0000-0000-0000-0000000000ff');
select public.complete_onboarding('physio', 'Mallory');
reset role;

select tests.ok((select count(*) from public.athletes) = 2, 'two athletes onboarded');
select tests.ok((select count(*) from public.professionals) = 5, 'five professionals onboarded');

-- Alice's data ---------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');

insert into public.injuries (id, athlete_id, title, body_region, side, injured_on)
values ('10000000-0000-0000-0000-000000000001', public.current_athlete_id(), 'ACL reconstruction', 'knee', 'left', current_date - 42);

insert into public.diagnoses (athlete_id, injury_id, diagnosis)
values (public.current_athlete_id(), '10000000-0000-0000-0000-000000000001', 'Complete ACL rupture');

insert into public.daily_checkins (athlete_id, injury_id, pain, swelling, stiffness, energy, sleep, mood, confidence)
values (public.current_athlete_id(), '10000000-0000-0000-0000-000000000001', 3, 2, 4, 7, 8, 7, 6);

insert into public.recovery_scores (athlete_id, score_date, score, algorithm_version)
values (public.current_athlete_id(), current_date, 72.5, 'v1');

insert into public.journal_entries (athlete_id, title, body) values
  (public.current_athlete_id(), 'Private thoughts', 'Nervous about the run.');
insert into public.journal_entries (athlete_id, title, body, visibility) values
  (public.current_athlete_id(), 'Shared update', 'Knee felt solid today.', 'shared');

insert into public.milestones (athlete_id, title, milestone_type, target_on)
values (public.current_athlete_id(), 'First run', 'first_run', current_date + 14);

insert into public.restrictions (athlete_id, activity, level, notes)
values (public.current_athlete_id(), 'pool', 'green', 'Self-reported: pool is fine');

insert into public.medical_documents (athlete_id, title, document_type, storage_path)
values (public.current_athlete_id(), 'MRI report', 'imaging_report',
        public.current_athlete_id() || '/mri.pdf');

insert into public.injury_events (athlete_id, injury_id, event_type, title, occurred_on, audience) values
  (public.current_athlete_id(), '10000000-0000-0000-0000-000000000001', 'injury', 'Injured in match', current_date - 42, 'team'),
  (public.current_athlete_id(), '10000000-0000-0000-0000-000000000001', 'surgery', 'ACL surgery', current_date - 35, 'clinical'),
  (public.current_athlete_id(), null, 'note', 'Private reflection', current_date - 1, 'private');

select tests.ok((select shared_at is not null from public.journal_entries where title = 'Shared update'),
  'shared_at stamped when an entry is shared');
select tests.ok((select visibility = 'private' from public.journal_entries where title = 'Private thoughts'),
  'journal entries default to PRIVATE');
reset role;

insert into storage.objects (bucket_id, name)
select 'medical-documents', a.id || '/mri.pdf' from public.athletes a
where a.profile_id = '00000000-0000-0000-0000-00000000000a';

-- Invitations ----------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select public.invite_team_member('Pat@Physio.test', 'physio');
select public.invite_team_member('casey@coach.test', 'team_coach');
select public.invite_team_member('sam@sc.test', 'sc_coach');
select tests.throws($$select public.invite_team_member('doc@doctor.test', 'doctor')$$,
  'free plan limits team connections to 3 (entitlement enforced in DB)');
select tests.throws($$insert into public.team_members (athlete_id, invited_email, role) values (public.current_athlete_id(), 'x@y.z', 'physio')$$,
  'team_members cannot be written directly');
select tests.throws($$insert into public.permissions (team_member_id, athlete_id, scope) select id, athlete_id, 'medical.read' from public.team_members limit 1$$,
  'permissions cannot be written directly');

select tests.ok(
  (select array_agg(scope order by scope)::text[] from public.permissions p
     join public.team_members tm on tm.id = p.team_member_id where tm.role = 'team_coach')
  = array['availability.read','restrictions.read','milestones.read']::text[]
  or (select count(*) from public.permissions p join public.team_members tm on tm.id = p.team_member_id
        where tm.role = 'team_coach') = 3,
  'team coach receives availability-only default scopes');

-- Pending invite grants nothing yet
select tests.login('00000000-0000-0000-0000-0000000000a1');
select tests.ok((select count(*) from public.team_members) = 1, 'physio sees their pending invite');
select tests.ok((select count(*) from public.profiles where full_name = 'Alice Athlete') = 1,
  'physio can see the inviting athlete''s name');
select tests.ok((select count(*) from public.daily_checkins) = 0, 'pending invite grants no check-in access');

-- Mallory cannot accept someone else's invite
select tests.login('00000000-0000-0000-0000-0000000000ff');
select tests.ok((select count(*) from public.team_members) = 0, 'outsider sees no invites');
select tests.throws(
  $$select public.accept_team_invite((select id from public.team_members limit 1))$$,
  'outsider cannot accept an invite');
reset role;
select tests.ok((select count(*) from public.team_members where status = 'active') = 0, 'no invite was accepted by outsider');

-- Physio accepts
set role authenticated;
select tests.login('00000000-0000-0000-0000-0000000000a1');
select public.accept_team_invite((select id from public.team_members where invited_email = 'pat@physio.test'));

select tests.ok((select count(*) from public.daily_checkins) = 1, 'physio reads check-ins');
select tests.ok((select count(*) from public.recovery_scores) = 1, 'physio reads recovery scores');
select tests.ok((select count(*) from public.diagnoses) = 1, 'physio reads diagnoses (medical.read)');
select tests.ok((select count(*) from public.journal_entries) = 1, 'physio reads ONLY the shared journal entry');
select tests.ok((select title from public.journal_entries) = 'Shared update', 'the visible journal entry is the shared one');
select tests.ok((select count(*) from public.injury_events) = 2, 'physio sees team + clinical events, not private');
select tests.ok((select count(*) from public.medical_documents) = 1, 'physio reads medical documents');
select tests.ok((select count(*) from storage.objects) = 1, 'physio can read the document object in storage');
select tests.throws($$insert into public.diagnoses (athlete_id, injury_id, diagnosis)
  values ((select athlete_id from public.injuries limit 1), '10000000-0000-0000-0000-000000000001', 'x')$$,
  'physio without medical.write cannot add diagnoses');

-- Physio sets restrictions and builds a programme
insert into public.restrictions (athlete_id, activity, level, notes)
select athlete_id, 'sprinting', 'red', 'No sprinting until week 12' from public.injuries limit 1;
insert into public.restrictions (athlete_id, activity, level)
select athlete_id, 'contact', 'red' from public.injuries limit 1;

insert into public.rehab_programmes (id, athlete_id, injury_id, title)
select '20000000-0000-0000-0000-000000000001', athlete_id, id, 'ACL phase plan' from public.injuries limit 1;
insert into public.rehab_phases (athlete_id, programme_id, name, status)
select athlete_id, id, 'Strength & Control', 'current' from public.rehab_programmes;
insert into public.rehab_exercises (athlete_id, programme_id, name, sets, reps)
select athlete_id, id, 'Split squat', 3, 10 from public.rehab_programmes;
insert into public.rehab_exercises (athlete_id, programme_id, name, sets, reps)
select athlete_id, id, 'Single-leg bridge', 3, 12 from public.rehab_programmes;

update public.injuries set availability_status = 'unavailable', return_to_training_status = 'rehab_only',
  next_review_on = current_date + 7;

select tests.throws($$update public.injuries set athlete_id = (select id from public.athletes where sport = 'Football')$$,
  'athlete_id is immutable');
select tests.throws($$insert into public.daily_checkins (athlete_id, pain, swelling, stiffness, energy, sleep, mood, confidence)
  select athlete_id, 1,1,1,1,1,1,1 from public.injuries limit 1$$,
  'professionals cannot author athlete check-ins');
reset role;

-- Cross-tenant integrity: a programme for Bob, then the physio (authorised for
-- Alice only) tries to attach a phase to it using Alice's athlete_id.
insert into public.rehab_programmes (id, athlete_id, title, created_by)
select '20000000-0000-0000-0000-00000000000b', a.id, 'Bob plan', a.profile_id
from public.athletes a where a.profile_id = '00000000-0000-0000-0000-00000000000b';

set role authenticated;
select tests.login('00000000-0000-0000-0000-0000000000a1');
select tests.throws($$insert into public.rehab_phases (athlete_id, programme_id, name)
  select athlete_id, '20000000-0000-0000-0000-00000000000b', 'Injected' from public.injuries limit 1$$,
  'cannot attach rows to another athlete''s programme (RLS + composite FK)');
select tests.ok((select count(*) from public.rehab_programmes) = 1, 'physio cannot see Bob''s programme');
reset role;

-- Notifications: athlete notified of restriction change + new programme;
-- exercise notifications batched to one per programme per day.
select tests.ok((select count(*) from public.notifications n join public.profiles p on p.id = n.recipient_id
  where p.full_name = 'Alice Athlete' and n.type = 'restriction_changed') = 2,
  'athlete notified of each restriction change');
select tests.ok((select count(*) from public.notifications n join public.profiles p on p.id = n.recipient_id
  where p.full_name = 'Alice Athlete' and n.type = 'exercise_assigned') = 1,
  'exercise assignment notifications are batched');
select tests.ok((select count(*) from public.notifications n join public.profiles p on p.id = n.recipient_id
  where p.full_name = 'Pat Physio' and n.type = 'restriction_changed') = 0,
  'actors are not notified of their own changes');
select tests.ok((select count(*) from public.notifications n join public.profiles p on p.id = n.recipient_id
  where p.full_name = 'Alice Athlete' and n.type = 'connection_created') = 1,
  'athlete notified when a professional joins');

-- Coach --------------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-0000000000a2');
select public.accept_team_invite((select id from public.team_members where invited_email = 'casey@coach.test'));
select tests.ok((select count(*) from public.daily_checkins) = 0, 'coach cannot read check-ins');
select tests.ok((select count(*) from public.journal_entries) = 0, 'coach cannot read journal, even shared');
select tests.ok((select count(*) from public.diagnoses) = 0, 'coach cannot read diagnoses');
select tests.ok((select count(*) from public.injuries) = 0, 'coach cannot read injury records');
select tests.ok((select count(*) from public.medical_documents) = 0, 'coach cannot read medical documents');
select tests.ok((select count(*) from storage.objects) = 0, 'coach cannot read document objects');
select tests.ok((select count(*) from public.injury_events) = 0, 'coach cannot read the timeline');
select tests.ok((select count(*) from public.recovery_scores) = 0, 'coach cannot read recovery scores');
select tests.ok((select count(*) from public.restrictions) = 3, 'coach reads restrictions');
select tests.ok((select count(*) from public.get_athlete_status_board()) = 1, 'coach status board shows one athlete');
select tests.ok((select current_phase from public.get_athlete_status_board()) = 'Strength & Control',
  'status board shows current phase');
select tests.ok((select availability_status::text from public.get_athlete_status_board()) = 'unavailable',
  'status board shows availability');
select tests.ok((select jsonb_array_length(restrictions) from public.get_athlete_status_board()) = 3,
  'status board includes authorised restrictions');
select tests.ok((select next_milestone ->> 'title' from public.get_athlete_status_board()) = 'First run',
  'status board includes next milestone');
select tests.ok((select tests.affected($$update public.restrictions set level = 'green'$$)) = 0,
  'coach cannot change restrictions');
reset role;

-- Realtime-style fan-out: coach now gets restriction notifications
set role authenticated;
select tests.login('00000000-0000-0000-0000-0000000000a1');
update public.restrictions set level = 'yellow', notes = 'Build-up sprints at 70%' where activity = 'sprinting';
select tests.login('00000000-0000-0000-0000-0000000000a2');
select tests.ok((select count(*) from public.notifications where type = 'restriction_changed') = 1,
  'coach notified of restriction change');
select tests.throws($$update public.notifications set title = 'hacked'$$,
  'notification content cannot be edited by recipients');
select tests.ok((select tests.affected($$update public.notifications set read_at = now()$$)) >= 1,
  'recipient can mark notification read');
select tests.throws($$insert into public.notifications (recipient_id, type, title) values (auth.uid(), 'professional_comment', 'x')$$,
  'clients cannot create notifications');
reset role;

-- S&C ------------------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-0000000000a3');
select public.accept_team_invite((select id from public.team_members where invited_email = 'sam@sc.test'));
select tests.ok((select count(*) from public.injuries) = 1, 'S&C reads injury summary');
select tests.ok((select count(*) from public.diagnoses) = 0, 'S&C cannot read diagnoses');
select tests.ok((select count(*) from public.recovery_scores) = 1, 'S&C reads recovery metrics');
select tests.ok((select count(*) from public.daily_checkins) = 0, 'S&C cannot read check-in detail');
select tests.ok((select count(*) from public.rehab_exercises) = 2, 'S&C reads rehab programme (adherence)');
select tests.ok((select count(*) from public.injury_events) = 1, 'S&C sees team events only');
select tests.ok((select tests.affected($$update public.rehab_exercises set sets = 5$$)) = 0,
  'S&C cannot edit the physio''s rehab programme');
insert into public.rehab_programmes (athlete_id, programme_type, title)
select athlete_id, 'conditioning', 'Upper body conditioning' from public.injuries limit 1;
select tests.throws($$insert into public.rehab_programmes (athlete_id, programme_type, title)
  select athlete_id, 'rehab', 'Rogue rehab' from public.injuries limit 1$$,
  'S&C cannot create rehab programmes');
reset role;

-- Athlete --------------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select tests.ok((select count(*) from public.restrictions) = 3, 'athlete sees all their restrictions');
select tests.ok((select tests.affected($$update public.restrictions set level = 'green' where activity = 'contact'$$)) = 0,
  'athlete cannot override a professional''s restriction');
select tests.ok((select tests.affected($$update public.restrictions set level = 'yellow' where activity = 'pool'$$)) = 1,
  'athlete can edit their self-reported restriction');
select tests.ok((select count(*) from public.profiles) = 4, 'athlete sees self + connected professionals');
select tests.ok((select count(*) from public.rehab_programmes) = 2, 'athlete sees rehab + conditioning programmes');
select tests.ok((select tests.affected($$delete from public.rehab_programmes$$)) = 0,
  'athlete cannot delete programmes authored by professionals');
select tests.ok((select (public.get_my_entitlements() ->> 'plan')) = 'free', 'athlete on free plan');
select tests.ok((select (public.get_my_entitlements() -> 'features' ->> 'team.connections')::int) = 3,
  'entitlements expose plan limits');
reset role;

-- Bob ------------------------------------------------------------------------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.ok((select count(*) from public.daily_checkins) = 0, 'other athlete sees no check-ins');
select tests.ok((select count(*) from public.journal_entries) = 0, 'other athlete sees no journal');
select tests.ok((select count(*) from public.restrictions) = 0, 'other athlete sees no restrictions');
select tests.ok((select count(*) from public.get_athlete_status_board() where full_name = 'Alice Athlete') = 0,
  'other athlete cannot see Alice on the status board');
select tests.ok((select count(*) from storage.objects) = 0, 'other athlete cannot read documents');
select tests.ok((select count(*) from public.profiles) = 1, 'other athlete sees only own profile');
select tests.throws('select * from public.audit_log', 'audit log not readable by clients');
reset role;

-- Premium subscription lifts the connection limit
insert into public.subscriptions (profile_id, plan, status)
values ('00000000-0000-0000-0000-00000000000a', 'premium_athlete', 'active');
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select tests.ok((public.get_my_entitlements() ->> 'plan') = 'premium_athlete', 'premium plan resolved');
select tests.ok(public.has_entitlement('ai.copilot'), 'premium includes ai.copilot');
select tests.ok(not public.has_entitlement('programme.builder'), 'premium excludes pro features');
select public.invite_team_member('doc@doctor.test', 'doctor');
select tests.ok((select count(*) from public.team_members where status = 'pending') = 1, 'premium can invite a 4th professional');

-- Athlete narrows the physio's scopes, then revokes
select public.set_team_member_permissions(
  (select id from public.team_members where invited_email = 'pat@physio.test'),
  array['availability.read','restrictions.read','restrictions.write']::public.permission_scope[]);
select tests.login('00000000-0000-0000-0000-0000000000a1');
select tests.ok((select count(*) from public.daily_checkins) = 0, 'narrowed scopes remove check-in access immediately');
select tests.ok((select count(*) from public.restrictions) = 3, 'narrowed scopes keep restriction access');
select tests.login('00000000-0000-0000-0000-00000000000a');
select public.revoke_team_member((select id from public.team_members where invited_email = 'pat@physio.test'));
select tests.login('00000000-0000-0000-0000-0000000000a1');
select tests.ok((select count(*) from public.restrictions) = 0, 'revoked professional loses all access');
select tests.ok((select count(*) from public.get_athlete_status_board()) = 0, 'revoked professional loses status board');
select tests.ok((select count(*) from public.profiles where full_name = 'Alice Athlete') = 0,
  'revoked professional can no longer see the athlete profile');
select tests.throws($$select public.revoke_team_member((select id from public.team_members limit 1))$$,
  'professionals cannot revoke connections');
reset role;

select tests.ok((select count(*) from public.audit_log where table_name = 'team_members') >= 5,
  'connection changes are audited');

\echo 'All RLS tests passed.'
