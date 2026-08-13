-- Issue #39: MVP types, tables, relationships, and default-deny RLS baseline.
-- RLS policies, grants, authentication flows, and public RPCs belong to the
-- separately owned third migration and are intentionally absent here.

create schema if not exists private;
revoke all on schema private from public;

create type public.committee_role as enum ('committee', 'authorised');
create type public.task_status as enum ('not_started', 'in_progress', 'completed');
create type public.event_type as enum ('weekly_session', 'tournament');
create type public.event_status as enum ('scheduled', 'completed', 'cancelled');
create type public.registration_status as enum ('registered', 'cancelled');
create type public.check_in_method as enum ('qr', 'manual');
create type public.attendance_status as enum ('confirmed', 'voided');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null,
  committee_role public.committee_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  summary text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.meetings enable row level security;

create table public.meeting_attendees (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (meeting_id, profile_id)
);
alter table public.meeting_attendees enable row level security;

create table public.discussion_points (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discussion_points enable row level security;

create table public.meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.meeting_decisions enable row level security;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_type public.event_type not null,
  name text not null,
  starts_at timestamptz not null,
  location text not null,
  description text not null,
  status public.event_status not null default 'scheduled',
  check_in_opens_at timestamptz,
  check_in_closes_at timestamptz,
  requires_student_id boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  assignee_id uuid not null references public.profiles(id) on delete restrict,
  due_date date not null,
  status public.task_status not null default 'not_started',
  source_meeting_id uuid references public.meetings(id) on delete restrict,
  source_decision_id uuid references public.meeting_decisions(id) on delete restrict,
  source_discussion_point_id uuid references public.discussion_points(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;

create table public.event_check_in_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token_digest text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.event_check_in_tokens enable row level security;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  student_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.participants enable row level security;

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  registration_status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  privacy_notice_acknowledged_at timestamptz,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.registrations enable row level security;

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  check_in_method public.check_in_method not null,
  attendance_status public.attendance_status not null default 'confirmed',
  recorded_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.attendance_records enable row level security;

revoke all on all tables in schema public from anon, authenticated;
