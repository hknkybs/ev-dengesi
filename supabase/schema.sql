-- Ev Dengesi — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('couple', 'roommates', 'family')),
  mode text not null check (mode in ('collaborative', 'competitive')),
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  -- Lets the creator read their own household row back right after
  -- INSERT ... RETURNING, before the first `members` row (added in the very
  -- next request) exists to satisfy is_household_member().
  created_by uuid default auth.uid() references auth.users(id)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null,
  emoji text not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (household_id, user_id)
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  icon text not null
);

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  base_points int not null default 15,
  expected_period_hours numeric not null default 24,
  cooldown_hours numeric not null default 8,
  is_invisible_labor boolean not null default false,
  assigned_member_id uuid references members(id) on delete set null,
  next_notify_at timestamptz,
  notified_at timestamptz
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  task_template_id uuid not null references task_templates(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  completed_at timestamptz not null default now(),
  awarded_points int not null,
  status text not null check (status in ('valid', 'disputed', 'no_points'))
);

create table push_tokens (
  member_id uuid primary key references members(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Helper: is the current authenticated user an active member of household h?
-- security definer + stable so it can be reused inside RLS policies below
-- without each policy re-deriving the same join.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function is_household_member(h uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from members
    where household_id = h and user_id = auth.uid() and left_at is null
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table households enable row level security;
alter table members enable row level security;
alter table rooms enable row level security;
alter table task_templates enable row level security;
alter table completions enable row level security;
alter table push_tokens enable row level security;

-- households
create policy "members can read own household" on households
  for select using (is_household_member(id) or created_by = auth.uid());
create policy "authenticated can create a household" on households
  for insert with check (auth.uid() is not null);
create policy "members can update own household" on households
  for update using (is_household_member(id)) with check (is_household_member(id));

-- members
-- `or user_id = auth.uid()` matters for the very first insert: it lets you
-- read your own just-inserted row back (INSERT ... RETURNING) before
-- is_household_member() would otherwise find it — same bootstrap issue as
-- households.created_by above.
create policy "members can read household roster" on members
  for select using (is_household_member(household_id) or user_id = auth.uid());
create policy "first member can self-insert as owner" on members
  for insert with check (
    user_id = auth.uid()
    and not exists (select 1 from members m2 where m2.household_id = members.household_id)
  );
create policy "members can update own row" on members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- rooms
create policy "members can read rooms" on rooms
  for select using (is_household_member(household_id));
create policy "members can manage rooms" on rooms
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- task_templates
create policy "members can read tasks" on task_templates
  for select using (is_household_member(household_id));
create policy "members can manage tasks" on task_templates
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- completions
create policy "members can read completions" on completions
  for select using (is_household_member(household_id));
create policy "members can insert their own completions" on completions
  for insert with check (
    is_household_member(household_id)
    and member_id in (select id from members where user_id = auth.uid() and household_id = completions.household_id)
  );

-- push_tokens
create policy "members can read household push tokens" on push_tokens
  for select using (
    exists (
      select 1 from members m
      where m.id = push_tokens.member_id and is_household_member(m.household_id)
    )
  );
create policy "members can upsert their own push token" on push_tokens
  for insert with check (
    member_id in (select id from members where user_id = auth.uid())
  );
create policy "members can update their own push token" on push_tokens
  for update using (
    member_id in (select id from members where user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Join-by-invite-code RPC (security definer: a not-yet-member can't SELECT
-- the household row directly, so the lookup has to bypass RLS here, but the
-- insert it performs is still just "add me as a member of this household").
-- ─────────────────────────────────────────────────────────────────────────

create or replace function join_household(
  p_invite_code text,
  p_display_name text,
  p_color text,
  p_emoji text
) returns uuid
language plpgsql security definer as $$
declare
  v_household_id uuid;
  v_member_id uuid;
begin
  select id into v_household_id from households where invite_code = upper(p_invite_code);
  if v_household_id is null then
    raise exception 'invite_code_not_found';
  end if;

  insert into members (household_id, user_id, display_name, color, emoji)
  values (v_household_id, auth.uid(), p_display_name, p_color, p_emoji)
  on conflict (household_id, user_id) do update
    set left_at = null, display_name = excluded.display_name
  returning id into v_member_id;

  return v_household_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime: broadcast changes on these tables to subscribed clients
-- ─────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table households, members, rooms, task_templates, completions;

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 2: scheduled push reminders for assigned tasks.
--
-- next_notify_at / notified_at (already columns on task_templates) drive
-- this: whenever a task is created, reassigned, or its period changes, we
-- rearm next_notify_at; whenever anyone logs a valid completion, we push it
-- forward by expected_period_hours again. A periodic Edge Function
-- (supabase/functions/check-due-tasks) then finds tasks whose time has come
-- and pushes to the assigned member's device via Expo's push API.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function rearm_task_next_notify() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.assigned_member_id is not null then
      new.next_notify_at := now() + (new.expected_period_hours || ' hours')::interval;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and (
    new.assigned_member_id is distinct from old.assigned_member_id
    or new.expected_period_hours is distinct from old.expected_period_hours
  ) then
    if new.assigned_member_id is not null then
      new.next_notify_at := now() + (new.expected_period_hours || ' hours')::interval;
      new.notified_at := null;
    else
      new.next_notify_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_rearm_task_next_notify
before insert or update on task_templates
for each row execute function rearm_task_next_notify();

create or replace function bump_task_next_notify_on_completion() returns trigger
language plpgsql as $$
begin
  if new.status = 'valid' then
    update task_templates
    set next_notify_at = new.completed_at + (expected_period_hours || ' hours')::interval,
        notified_at = null
    where id = new.task_template_id and assigned_member_id is not null;
  end if;
  return new;
end;
$$;

create trigger trg_bump_task_next_notify_on_completion
after insert on completions
for each row execute function bump_task_next_notify_on_completion();

-- Called by the check-due-tasks Edge Function (service role, bypasses RLS —
-- this is a system job scanning across households, not a per-user request).
create or replace function get_due_assigned_tasks()
returns table (
  task_id uuid,
  task_name text,
  room_name text,
  assigned_member_id uuid,
  expo_push_token text
)
language sql security definer as $$
  select t.id, t.name, r.name, t.assigned_member_id, pt.expo_push_token
  from task_templates t
  join rooms r on r.id = t.room_id
  join push_tokens pt on pt.member_id = t.assigned_member_id
  where t.assigned_member_id is not null
    and t.next_notify_at is not null
    and t.next_notify_at <= now()
    and (t.notified_at is null or t.notified_at < t.next_notify_at);
$$;
