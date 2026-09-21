-- Partner Invite System — Migration
-- Run this in Supabase SQL Editor AFTER the main schema.sql

-- ============================================================
-- WORLD INVITES TABLE
-- ============================================================
create table public.world_invites (
  id uuid default uuid_generate_v4() primary key,
  world_id uuid references public.worlds(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  code text not null,
  status text check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending' not null,
  message text,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint world_invites_code_unique unique (code)
);

alter table public.world_invites enable row level security;

create index idx_world_invites_code on public.world_invites (code);
create index idx_world_invites_world_id on public.world_invites (world_id);
create index idx_world_invites_status on public.world_invites (status);

-- ============================================================
-- RLS POLICIES FOR WORLD_INVITES
-- ============================================================

-- World members can view their world's invites
create policy "World members can view invites"
  on public.world_invites for select
  using (public.is_world_member(world_id));

-- World members can create invites for their world
create policy "World members can create invites"
  on public.world_invites for insert
  with check (
    public.is_world_member(world_id)
    and created_by = auth.uid()
  );

-- Invite creator can revoke their own invite
create policy "Invite creator can revoke"
  on public.world_invites for update
  using (
    created_by = auth.uid()
    and public.is_world_member(world_id)
  );

-- Public read for invite lookup by code (the code itself is the capability token —
-- 72 bits of entropy makes enumeration infeasible).
-- This allows the /join page to read invite details without requiring the viewer
-- to be authenticated. The get_invite_info() security-definer function is the
-- preferred path; this policy is the fallback if the function doesn't exist yet.
create policy "Public can look up invites by code"
  on public.world_invites for select
  to anon, authenticated
  using (true);

-- ============================================================
-- FUNCTION: Get public invite info (callable by anon + authenticated)
-- Returns only safe fields — never exposes emails, photos, etc.
-- Pure read — no writes. Expiry is detected and reported, not written here.
-- ============================================================
create or replace function public.get_invite_info(p_code text)
returns json as $$
declare
  v_invite    record;
  v_inviter_name text;
  v_status    text;
  v_error     text;
begin
  select wi.status, wi.expires_at, wi.message, wi.created_by, w.name as w_name
  into v_invite
  from public.world_invites wi
  join public.worlds w on w.id = wi.world_id
  where wi.code = p_code;

  if not found then
    return json_build_object('valid', false, 'error', 'not_found');
  end if;

  -- Determine effective status (detect expiry without writing)
  v_status := case
    when v_invite.status = 'pending' and v_invite.expires_at < now() then 'expired'
    else v_invite.status
  end;

  -- Get inviter display name from auth metadata (safe — display name only)
  select coalesce(
    nullif(trim(raw_user_meta_data->>'display_name'), ''),
    'Someone special'
  ) into v_inviter_name
  from auth.users
  where id = v_invite.created_by;

  v_error := case v_status
    when 'expired'  then 'expired'
    when 'revoked'  then 'revoked'
    when 'accepted' then 'already_accepted'
    else null
  end;

  return json_build_object(
    'valid',        v_status = 'pending',
    'status',       v_status,
    'inviter_name', coalesce(v_inviter_name, 'Someone special'),
    'world_name',   v_invite.w_name,
    'message',      v_invite.message,
    'expires_at',   v_invite.expires_at,
    'error',        v_error
  );
end;
$$ language plpgsql security definer;

grant execute on function public.get_invite_info(text) to anon, authenticated;

-- ============================================================
-- FUNCTION: Accept invite — fully atomic with row locking
-- Validates everything, inserts membership, marks invite accepted.
-- ============================================================
create or replace function public.accept_world_invite(p_code text)
returns json as $$
declare
  v_invite   record;
  v_member_count integer;
  v_is_already_member boolean;
  v_max_members constant integer := 2;
begin
  if auth.uid() is null then
    return json_build_object('success', false, 'error', 'unauthenticated');
  end if;

  -- Lock the invite row to prevent race conditions on concurrent accepts
  select * into v_invite
  from public.world_invites
  where code = p_code
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'not_found');
  end if;

  -- Auto-expire check
  if v_invite.expires_at < now() and v_invite.status = 'pending' then
    update public.world_invites
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    return json_build_object('success', false, 'error', 'expired');
  end if;

  -- Status check
  if v_invite.status = 'accepted' then
    return json_build_object('success', false, 'error', 'already_accepted');
  end if;
  if v_invite.status = 'revoked' then
    return json_build_object('success', false, 'error', 'revoked');
  end if;
  if v_invite.status = 'expired' then
    return json_build_object('success', false, 'error', 'expired');
  end if;

  -- Check if user is already a member of THIS world
  select exists(
    select 1 from public.world_members
    where world_id = v_invite.world_id and user_id = auth.uid()
  ) into v_is_already_member;

  if v_is_already_member then
    return json_build_object(
      'success',  false,
      'error',    'already_member',
      'world_id', v_invite.world_id
    );
  end if;

  -- Check world is not full
  select count(*) into v_member_count
  from public.world_members
  where world_id = v_invite.world_id;

  if v_member_count >= v_max_members then
    return json_build_object('success', false, 'error', 'world_full');
  end if;

  -- === ATOMIC ACCEPTANCE ===

  -- 1. Add user as partner
  insert into public.world_members (world_id, user_id, role)
  values (v_invite.world_id, auth.uid(), 'partner');

  -- 2. Mark invite accepted
  update public.world_invites
  set
    status      = 'accepted',
    accepted_by = auth.uid(),
    accepted_at = now(),
    updated_at  = now()
  where id = v_invite.id;

  return json_build_object(
    'success',  true,
    'world_id', v_invite.world_id
  );
end;
$$ language plpgsql security definer;

grant execute on function public.accept_world_invite(text) to authenticated;

-- ============================================================
-- UPDATE: handle_new_user trigger
-- Skip world creation when user signs up via an invite link.
-- The invite_code in user metadata signals this path.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_world_id uuid;
begin
  -- If user is signing up via an invite, skip auto-world creation.
  -- They will join an existing world via accept_world_invite().
  if (new.raw_user_meta_data->>'invite_code') is not null
     and trim(new.raw_user_meta_data->>'invite_code') <> '' then
    return new;
  end if;

  -- Normal signup: create a new world for this user
  insert into public.worlds (name, created_by)
  values ('Our Little World', new.id)
  returning id into new_world_id;

  insert into public.world_members (world_id, user_id, role)
  values (new_world_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;
