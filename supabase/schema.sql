-- Our Little World — Database Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- ENABLE EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- WORLDS
-- ============================================================
create table public.worlds (
  id uuid default uuid_generate_v4() primary key,
  name text not null default 'Our Little World',
  tagline text,
  anniversary_date date,
  cover_photo_url text,
  theme_color text default '#d94f6c',
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id) on delete cascade not null
);

alter table public.worlds enable row level security;

-- ============================================================
-- WORLD MEMBERS
-- ============================================================
create table public.world_members (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  nickname text,
  role text check (role in ('owner', 'partner')) default 'owner',
  joined_at timestamptz default now() not null,
  unique(world_id, user_id)
);

alter table public.world_members enable row level security;

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  title text not null,
  description text,
  location text,
  start_date date not null,
  end_date date,
  cover_photo_url text,
  song_url text,
  theme_color text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.trips enable row level security;

-- ============================================================
-- MEMORIES
-- ============================================================
create table public.memories (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  location text,
  mood text check (mood in ('happy', 'romantic', 'adventurous', 'peaceful', 'funny', 'nostalgic', 'grateful', 'excited')),
  is_favorite boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.memories enable row level security;

-- ============================================================
-- MEMORY PHOTOS
-- ============================================================
create table public.memory_photos (
  id uuid default uuid_generate_v4() primary key,
  memory_id uuid references public.memories(id) on delete cascade not null,
  url text not null,
  caption text,
  width integer,
  height integer,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

alter table public.memory_photos enable row level security;

-- ============================================================
-- LETTERS
-- ============================================================
create table public.letters (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  title text not null,
  body text not null,
  recipient text,
  open_condition text,
  open_date date,
  is_locked boolean default false,
  photo_url text,
  music_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.letters enable row level security;

-- ============================================================
-- FUTURE MEMORIES (BUCKET LIST)
-- ============================================================
create table public.future_memories (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  title text not null,
  description text,
  emoji text,
  is_completed boolean default false,
  completed_at timestamptz,
  memory_id uuid references public.memories(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.future_memories enable row level security;

-- ============================================================
-- TAGS
-- ============================================================
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  name text not null,
  color text,
  created_at timestamptz default now() not null,
  unique(world_id, name)
);

alter table public.tags enable row level security;

-- ============================================================
-- MEMORY TAGS (junction)
-- ============================================================
create table public.memory_tags (
  memory_id uuid references public.memories(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (memory_id, tag_id)
);

alter table public.memory_tags enable row level security;

-- ============================================================
-- TIMELINE EVENTS
-- ============================================================
create table public.timeline_events (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  type text check (type in ('milestone', 'trip', 'birthday', 'anniversary', 'date', 'custom')) default 'custom',
  emoji text,
  memory_id uuid references public.memories(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.timeline_events enable row level security;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper function: is the current user a member of this world?
create or replace function public.is_world_member(wid uuid)
returns boolean as $$
  select exists (
    select 1 from public.world_members
    where world_id = wid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- WORLDS
create policy "Members can view their world"
  on public.worlds for select
  using (public.is_world_member(id));

create policy "Owners can update world"
  on public.worlds for update
  using (public.is_world_member(id));

create policy "Users can create a world"
  on public.worlds for insert
  with check (created_by = auth.uid());

-- WORLD_MEMBERS
create policy "Members can view world_members"
  on public.world_members for select
  using (public.is_world_member(world_id));

create policy "Members can join"
  on public.world_members for insert
  with check (user_id = auth.uid());

create policy "Members can update their own membership"
  on public.world_members for update
  using (user_id = auth.uid());

-- TRIPS
create policy "World members can view trips"
  on public.trips for select
  using (public.is_world_member(world_id));

create policy "World members can create trips"
  on public.trips for insert
  with check (public.is_world_member(world_id) and created_by = auth.uid());

create policy "World members can update trips"
  on public.trips for update
  using (public.is_world_member(world_id));

create policy "World members can delete trips"
  on public.trips for delete
  using (public.is_world_member(world_id));

-- MEMORIES
create policy "World members can view memories"
  on public.memories for select
  using (public.is_world_member(world_id));

create policy "World members can create memories"
  on public.memories for insert
  with check (public.is_world_member(world_id) and created_by = auth.uid());

create policy "World members can update memories"
  on public.memories for update
  using (public.is_world_member(world_id));

create policy "World members can delete memories"
  on public.memories for delete
  using (public.is_world_member(world_id));

-- MEMORY_PHOTOS
create policy "World members can view photos"
  on public.memory_photos for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

create policy "World members can add photos"
  on public.memory_photos for insert
  with check (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

create policy "World members can delete photos"
  on public.memory_photos for delete
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

-- LETTERS
create policy "World members can view letters"
  on public.letters for select
  using (public.is_world_member(world_id));

create policy "World members can create letters"
  on public.letters for insert
  with check (public.is_world_member(world_id) and created_by = auth.uid());

create policy "World members can update letters"
  on public.letters for update
  using (public.is_world_member(world_id));

create policy "World members can delete letters"
  on public.letters for delete
  using (public.is_world_member(world_id));

-- FUTURE_MEMORIES
create policy "World members can view future_memories"
  on public.future_memories for select
  using (public.is_world_member(world_id));

create policy "World members can create future_memories"
  on public.future_memories for insert
  with check (public.is_world_member(world_id) and created_by = auth.uid());

create policy "World members can update future_memories"
  on public.future_memories for update
  using (public.is_world_member(world_id));

create policy "World members can delete future_memories"
  on public.future_memories for delete
  using (public.is_world_member(world_id));

-- TAGS
create policy "World members can view tags"
  on public.tags for select
  using (public.is_world_member(world_id));

create policy "World members can create tags"
  on public.tags for insert
  with check (public.is_world_member(world_id));

-- MEMORY_TAGS
create policy "World members can view memory_tags"
  on public.memory_tags for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

create policy "World members can add memory_tags"
  on public.memory_tags for insert
  with check (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

create policy "World members can delete memory_tags"
  on public.memory_tags for delete
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id and public.is_world_member(m.world_id)
    )
  );

-- TIMELINE_EVENTS
create policy "World members can view timeline_events"
  on public.timeline_events for select
  using (public.is_world_member(world_id));

create policy "World members can create timeline_events"
  on public.timeline_events for insert
  with check (public.is_world_member(world_id) and created_by = auth.uid());

create policy "World members can update timeline_events"
  on public.timeline_events for update
  using (public.is_world_member(world_id));

create policy "World members can delete timeline_events"
  on public.timeline_events for delete
  using (public.is_world_member(world_id));

-- ============================================================
-- AUTO-CREATE WORLD ON SIGNUP (trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_world_id uuid;
begin
  -- Create a new world for this user
  insert into public.worlds (name, created_by)
  values ('Our Little World', new.id)
  returning id into new_world_id;

  -- Add the user as a world member (owner)
  insert into public.world_members (world_id, user_id, role)
  values (new_world_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS
-- Run these in Supabase Dashboard > Storage
-- ============================================================
-- Create a bucket named "photos" with:
-- Public: false (private)
-- File size limit: 20MB
-- Allowed MIME types: image/*

-- Storage policies (run after creating the bucket):
/*
-- Allow authenticated users to upload to their world's folder
create policy "World members can upload photos"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated'
    and bucket_id = 'photos'
  );

create policy "World members can view photos"
  on storage.objects for select
  using (
    auth.role() = 'authenticated'
    and bucket_id = 'photos'
  );

create policy "World members can delete their photos"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated'
    and bucket_id = 'photos'
  );
*/
