-- Public QR submission registers only. Keep the legacy RPC registration-only too,
-- so an older application cannot automatically mark attendance after deployment.
create or replace function public.submit_event_self_check_in(
  registration_token text, participant_name text, participant_email text,
  privacy_accepted boolean, participant_student_id text default null
) returns text language sql security invoker set search_path = '' as $$
  select public.submit_event_registration(
    registration_token, participant_name, participant_email,
    privacy_accepted, participant_student_id
  );
$$;
revoke all on function public.submit_event_self_check_in(text,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.submit_event_self_check_in(text,text,text,boolean,text) to service_role;
comment on function public.submit_event_self_check_in(text,text,text,boolean,text) is
  'Legacy public QR registration alias. Never creates or changes attendance; authorised staff confirm attendance separately.';
notify pgrst, 'reload schema';
