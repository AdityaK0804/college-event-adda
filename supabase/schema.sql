-- ============================================================
-- Crescent Pass — Phase 1 Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
create type user_role as enum ('student', 'organizer', 'admin');
create type event_status as enum ('draft', 'pending', 'active', 'cancelled', 'completed');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type ticket_status as enum ('confirmed', 'used', 'cancelled');

-- ── Profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users (one row per auth user)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rrn         text unique,                          -- Registration Number
  name        text not null,
  email       text not null,
  department  text,
  year        smallint check (year between 1 and 5),
  phone       text,
  bio         text,
  role        user_role not null default 'student',
  college     text not null default 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Events ───────────────────────────────────────────────────
create table events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  date            date not null,
  time            text not null,
  location        text not null,
  college         text not null,
  category        text not null,
  price           numeric(10,2) not null default 0 check (price >= 0),
  image_url       text,
  organizer_id    uuid not null references profiles(id) on delete cascade,
  organizer_name  text not null,
  total_seats     integer not null check (total_seats > 0),
  available_seats integer not null check (available_seats >= 0),
  status          event_status not null default 'pending',
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint seats_valid check (available_seats <= total_seats)
);

-- ── Registrations ────────────────────────────────────────────
create table registrations (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references events(id) on delete cascade,
  user_id               uuid not null references profiles(id) on delete cascade,
  ticket_id             text unique not null default gen_random_uuid()::text,
  quantity              integer not null default 1 check (quantity > 0),
  total_amount          numeric(10,2) not null,
  payment_status        payment_status not null default 'pending',
  ticket_status         ticket_status not null default 'confirmed',
  qr_data               text,                         -- signed QR payload
  razorpay_order_id     text,
  razorpay_payment_id   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(event_id, user_id)                            -- one registration per user per event
);

-- ── Check-ins ────────────────────────────────────────────────
create table checkins (
  id                uuid primary key default gen_random_uuid(),
  registration_id   uuid not null references registrations(id) on delete cascade,
  event_id          uuid not null references events(id) on delete cascade,
  scanned_by        uuid not null references profiles(id),
  scanned_at        timestamptz not null default now(),
  valid             boolean not null default true
);

-- ── Triggers: updated_at ─────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

create trigger events_updated_at before update on events
  for each row execute procedure update_updated_at();

create trigger registrations_updated_at before update on registrations
  for each row execute procedure update_updated_at();

-- ── Function: reserve seats atomically ───────────────────────
-- Called inside registration creation to decrement available_seats
-- Uses SELECT FOR UPDATE to prevent race conditions
create or replace function reserve_seats(p_event_id uuid, p_quantity integer)
returns boolean language plpgsql security definer as $$
declare
  v_available integer;
begin
  select available_seats into v_available
  from events
  where id = p_event_id
  for update;                                          -- row-level lock

  if v_available < p_quantity then
    return false;
  end if;

  update events
  set available_seats = available_seats - p_quantity
  where id = p_event_id;

  return true;
end;
$$;

-- ── Function: validate and mark ticket used ──────────────────
create or replace function use_ticket(p_ticket_id text, p_event_id uuid, p_scanned_by uuid)
returns json language plpgsql security definer as $$
declare
  v_reg registrations;
  v_profile profiles;
begin
  -- Find registration with lock
  select * into v_reg
  from registrations
  where ticket_id = p_ticket_id
    and event_id = p_event_id
  for update;

  if not found then
    return json_build_object('valid', false, 'reason', 'not_found');
  end if;

  if v_reg.ticket_status = 'used' then
    return json_build_object('valid', false, 'reason', 'already_used');
  end if;

  if v_reg.ticket_status = 'cancelled' then
    return json_build_object('valid', false, 'reason', 'cancelled');
  end if;

  if v_reg.payment_status != 'paid' then
    return json_build_object('valid', false, 'reason', 'unpaid');
  end if;

  -- Mark as used
  update registrations set ticket_status = 'used' where id = v_reg.id;

  -- Insert checkin record
  insert into checkins (registration_id, event_id, scanned_by)
  values (v_reg.id, p_event_id, p_scanned_by);

  -- Get student name
  select * into v_profile from profiles where id = v_reg.user_id;

  return json_build_object(
    'valid', true,
    'student_name', v_profile.name,
    'department', v_profile.department,
    'rrn', v_profile.rrn,
    'quantity', v_reg.quantity
  );
end;
$$;

-- ── Row Level Security ────────────────────────────────────────
alter table profiles enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table checkins enable row level security;

-- Profiles: users can read own row; admins can read all
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- Events: anyone can read active events; organizers can CRUD own events
create policy "events_select_active" on events
  for select using (status = 'active' or organizer_id = auth.uid());

create policy "events_insert_organizer" on events
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('organizer','admin'))
  );

create policy "events_update_own" on events
  for update using (organizer_id = auth.uid());

create policy "events_delete_own" on events
  for delete using (organizer_id = auth.uid());

-- Registrations: users see own; organizers see registrations for their events
create policy "registrations_select" on registrations
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from events e where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "registrations_insert_own" on registrations
  for insert with check (user_id = auth.uid());

create policy "registrations_update_own" on registrations
  for update using (user_id = auth.uid());

-- Checkins: organizers can insert; users can see their own
create policy "checkins_select" on checkins
  for select using (
    scanned_by = auth.uid()
    or exists (
      select 1 from registrations r where r.id = registration_id and r.user_id = auth.uid()
    )
  );

create policy "checkins_insert_organizer" on checkins
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('organizer','admin'))
  );

-- ── Sample seed data for Crescent ─────────────────────────────
-- (Run after creating your first organizer account and getting their UUID)
-- Replace 'YOUR_ORGANIZER_UUID' with actual UUID from profiles table

-- insert into events (title, description, date, time, location, college, category, price,
--   image_url, organizer_id, organizer_name, total_seats, available_seats, status, featured)
-- values (
--   'TechXplore 2025',
--   'The annual technical festival of B.S. Abdur Rahman Crescent Institute. Competitions, workshops, and guest lectures.',
--   '2025-09-15', '09:00 AM',
--   'Main Auditorium', 'B.S. Abdur Rahman Crescent Institute',
--   'Technical', 499,
--   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000',
--   'YOUR_ORGANIZER_UUID', 'IEEE Student Branch',
--   500, 500, 'active', true
-- );
