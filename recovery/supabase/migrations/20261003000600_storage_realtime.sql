-- =============================================================================
-- 0600: Storage buckets + policies, Realtime publication
--
-- Object path conventions (first folder is always the owner id):
--   avatars            {profile_id}/{file}                         public read
--   journal-media      {athlete_id}/{journal_entry_id}/{file}      private
--   event-media        {athlete_id}/{event_or_milestone_id}/{file} private
--   medical-documents  {athlete_id}/{file}                         private
-- Private objects are served through short-lived signed URLs.
-- =============================================================================

create or replace function public.safe_uuid(p_text text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return p_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('journal-media', 'journal-media', false, 104857600,
     array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm',
           'audio/mpeg','audio/mp4','audio/webm','audio/wav']),
  ('event-media', 'event-media', false, 104857600, null),
  ('medical-documents', 'medical-documents', false, 52428800,
     array['application/pdf','image/jpeg','image/png','image/webp','application/dicom'])
on conflict (id) do nothing;

-- avatars ------------------------------------------------------------------
create policy "avatars: public read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars: owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.safe_uuid((storage.foldername(name))[1]) = auth.uid());
create policy "avatars: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.safe_uuid((storage.foldername(name))[1]) = auth.uid());
create policy "avatars: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.safe_uuid((storage.foldername(name))[1]) = auth.uid());

-- journal-media ------------------------------------------------------------
create policy "journal-media: owner all" on storage.objects for all to authenticated
  using (bucket_id = 'journal-media'
         and public.is_athlete_owner(public.safe_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'journal-media'
              and public.is_athlete_owner(public.safe_uuid((storage.foldername(name))[1])));
create policy "journal-media: shared read" on storage.objects for select to authenticated
  using (bucket_id = 'journal-media' and exists (
    select 1 from public.journal_media jm
    where jm.storage_path = name and public.can_read_shared_journal_entry(jm.journal_entry_id)));

-- event-media --------------------------------------------------------------
create policy "event-media: owner all" on storage.objects for all to authenticated
  using (bucket_id = 'event-media'
         and public.is_athlete_owner(public.safe_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'event-media'
              and public.is_athlete_owner(public.safe_uuid((storage.foldername(name))[1])));
create policy "event-media: authorised read" on storage.objects for select to authenticated
  using (bucket_id = 'event-media' and exists (
    select 1 from public.event_media em
    where em.storage_path = name
      and ((em.injury_event_id is not null and public.can_read_event(em.injury_event_id))
           or (em.milestone_id is not null and public.has_scope(em.athlete_id, 'milestones.read')))));
create policy "event-media: professional upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-media' and (
    public.has_scope(public.safe_uuid((storage.foldername(name))[1]), 'timeline.write')
    or public.has_scope(public.safe_uuid((storage.foldername(name))[1]), 'milestones.write')));

-- medical-documents --------------------------------------------------------
create policy "medical-documents: read" on storage.objects for select to authenticated
  using (bucket_id = 'medical-documents'
         and public.can_access(public.safe_uuid((storage.foldername(name))[1]), 'documents.read'));
create policy "medical-documents: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'medical-documents'
              and public.can_access(public.safe_uuid((storage.foldername(name))[1]), 'documents.write'));
create policy "medical-documents: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'medical-documents' and (
    public.is_athlete_owner(public.safe_uuid((storage.foldername(name))[1]))
    or (owner_id = auth.uid()::text
        and public.has_scope(public.safe_uuid((storage.foldername(name))[1]), 'documents.write'))));

grant execute on function public.safe_uuid(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: postgres_changes respect RLS, so subscribers only receive rows
-- they are allowed to select.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array[
    'restrictions','notifications','daily_checkins','exercise_logs','milestones',
    'team_members','injury_events','injuries','rehab_exercises','recovery_scores'
  ] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
