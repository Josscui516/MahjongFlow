-- Fictional, deterministic local development data for Issue #39.
-- The single local administrator has a bcrypt password hash; no plaintext password is stored.
-- Do not run this seed remotely.

begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'admin@mahjongflow.com', '$2a$06$5Of3AHEhCt6F3Fqu0Ce.xO4GjSp6OcnvTg5bfWIwi1EvYLVz5nC/e', now(),
    '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
  (
    '22222222-2222-4222-8222-222222222223',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"admin@mahjongflow.com"}',
    'email', now(), now(), now()
  );

insert into public.profiles (
  id,
  display_name,
  committee_role,
  committee_position,
  can_manage_accounts
) values
  (
    '22222222-2222-4222-8222-222222222222',
    'Administrator',
    'authorised',
    'Administrator',
    true
  );

insert into public.meetings (id, title, starts_at, summary, created_by) values
  (
    '30000000-0000-4000-8000-000000000001',
    'Fictional Event Planning Meeting', now() - interval '2 days',
    'Plan the fictional weekly session.',
    '22222222-2222-4222-8222-222222222222'
  );

insert into public.meeting_attendees (meeting_id, profile_id) values
  ('30000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222');

insert into public.discussion_points (id, meeting_id, content, position) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Discuss the room layout.', 0);

insert into public.meeting_decisions (id, meeting_id, content, position) values
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Use the fictional community room.', 0);

insert into public.events (
  id, event_type, name, starts_at, location, description, status,
  check_in_opens_at, check_in_closes_at, requires_student_id, created_by
) values
  ('40000000-0000-4000-8000-000000000001', 'weekly_session', 'Fictional Open Session', now() + interval '1 hour', 'Test Room A', 'Standard fictional event.', 'scheduled', now() - interval '1 hour', now() + interval '2 hours', false, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000002', 'tournament', 'Fictional Open Tournament', now() + interval '2 hours', 'Test Room B', 'Fictional event without a student ID requirement.', 'scheduled', now() - interval '1 hour', now() + interval '3 hours', false, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000003', 'weekly_session', 'Fictional Expired Session', now() - interval '1 day', 'Test Room C', 'Fictional event with an expired window.', 'scheduled', now() - interval '2 days', now() - interval '1 day', false, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000004', 'tournament', 'Fictional Cancelled Tournament', now() + interval '1 day', 'Test Room D', 'Fictional cancelled event.', 'cancelled', now(), now() + interval '1 day', false, '22222222-2222-4222-8222-222222222222');

insert into public.tasks (
  id, title, description, assignee_id, due_date, status,
  source_meeting_id, source_decision_id, event_id, created_by
) values
  ('50000000-0000-4000-8000-000000000001', 'Book the fictional room', 'Task created from the fictional decision.', '22222222-2222-4222-8222-222222222222', current_date + 3, 'not_started', '30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222'),
  ('50000000-0000-4000-8000-000000000002', 'Review old fictional notes', 'Independent overdue task.', '22222222-2222-4222-8222-222222222222', current_date - 1, 'not_started', null, null, null, '22222222-2222-4222-8222-222222222222'),
  ('50000000-0000-4000-8000-000000000003', 'Prepare fictional score sheets', 'Independent due-soon task.', '22222222-2222-4222-8222-222222222222', current_date + 7, 'in_progress', null, null, '40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222'),
  ('50000000-0000-4000-8000-000000000004', 'Complete fictional setup', 'Completed event preparation task.', '22222222-2222-4222-8222-222222222222', current_date, 'completed', null, null, '40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222');

insert into public.participants (id, full_name, email, student_id) values
  ('60000000-0000-4000-8000-000000000001', 'Participant Alpha', 'alpha@example.test', null),
  ('60000000-0000-4000-8000-000000000002', 'Participant Beta', 'beta@example.test', null),
  ('60000000-0000-4000-8000-000000000003', 'Participant Gamma', 'gamma@example.test', null),
  ('60000000-0000-4000-8000-000000000004', 'Participant Delta', 'delta@example.test', null),
  ('60000000-0000-4000-8000-000000000005', 'Participant Epsilon', 'epsilon@example.test', 'TEST-0001');

insert into public.registrations (
  id, event_id, participant_id, registration_status,
  privacy_notice_acknowledged_at, recorded_by
) values
  ('70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'registered', now(), '22222222-2222-4222-8222-222222222222'),
  ('70000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', 'registered', now(), '22222222-2222-4222-8222-222222222222'),
  ('70000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003', 'cancelled', now(), '22222222-2222-4222-8222-222222222222'),
  ('70000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000005', 'registered', now(), '22222222-2222-4222-8222-222222222222');

insert into public.attendance_records (
  id, event_id, participant_id, check_in_method, attendance_status, recorded_by
) values
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'qr', 'confirmed', null),
  ('80000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000004', 'manual', 'confirmed', '22222222-2222-4222-8222-222222222222'),
  ('80000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000005', 'manual', 'voided', '22222222-2222-4222-8222-222222222222');

commit;
