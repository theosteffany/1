-- Theo UGC portfolio — Supabase schema
-- Run this once in Supabase → SQL Editor. Safe to re-run.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Admins: only users listed here can edit content.
-- After creating your user in Authentication → Users, run:
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- Content tables
-- ─────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text not null default '',
  caption text,
  category_id uuid references public.gallery_categories (id) on delete set null,
  orientation text not null default 'portrait' check (orientation in ('portrait', 'landscape', 'square')),
  featured boolean not null default false,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text not null default '',
  description text,
  category text,
  video_url text,
  thumbnail_url text,
  orientation text not null default 'vertical' check (orientation in ('vertical', 'horizontal')),
  external_url text,
  featured boolean not null default false,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  brand text check (char_length(brand) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row level security: public can read content, only admins write.
-- ─────────────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.brands enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_items enable row level security;
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['site_settings', 'brands', 'gallery_categories', 'gallery_items', 'projects'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "anyone can send" on public.contact_messages;
create policy "anyone can send" on public.contact_messages for insert with check (read = false);
drop policy if exists "admin manage" on public.contact_messages;
create policy "admin manage" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Media storage: public read, admin upload/delete.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Starter data (placeholders — edit or delete from /admin)
-- ─────────────────────────────────────────────────────────────
insert into public.gallery_categories (name, sort_order)
select * from (values ('Lifestyle', 0), ('Fitness', 1), ('Fashion', 2), ('Travel', 3), ('Brands', 4)) v(name, sort_order)
where not exists (select 1 from public.gallery_categories);
