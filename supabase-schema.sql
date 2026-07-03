create table if not exists public.album_settings (
  id bigint generated always as identity primary key,
  title text not null,
  artist text not null,
  release_note text,
  cover_url text,
  theme text,
  is_private boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id bigint generated always as identity primary key,
  track_number integer not null,
  title text not null,
  duration text,
  audio_url text,
  download_url text,
  lyrics text,
  credits text,
  is_active boolean not null default true
);

create table if not exists public.access_codes (
  id bigint generated always as identity primary key,
  code text not null unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.album_settings enable row level security;
alter table public.tracks enable row level security;
alter table public.access_codes enable row level security;

drop policy if exists "public_read_album_settings" on public.album_settings;
create policy "public_read_album_settings"
on public.album_settings
for select
to anon
using (true);

drop policy if exists "public_read_active_tracks" on public.tracks;
create policy "public_read_active_tracks"
on public.tracks
for select
to anon
using (is_active = true);

drop policy if exists "public_read_active_access_codes" on public.access_codes;
create policy "public_read_active_access_codes"
on public.access_codes
for select
to anon
using (is_active = true);
