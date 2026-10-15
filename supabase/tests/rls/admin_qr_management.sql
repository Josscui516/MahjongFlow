begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new) values
('97000000-0000-4000-8000-000000000001','authenticated','authenticated','qr-admin-fixture@example.test','','','',''),
('97000000-0000-4000-8000-000000000002','authenticated','authenticated','qr-staff-fixture@example.test','','','',''),
('97000000-0000-4000-8000-000000000003','authenticated','authenticated','qr-committee-fixture@example.test','','','',''),
('97000000-0000-4000-8000-000000000004','authenticated','authenticated','qr-inactive-fixture@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts,is_active) values
('97000000-0000-4000-8000-000000000001','Fictional QR admin','committee',true,true),
('97000000-0000-4000-8000-000000000002','Fictional QR staff','authorised',false,true),
('97000000-0000-4000-8000-000000000003','Fictional QR committee','committee',false,true),
('97000000-0000-4000-8000-000000000004','Fictional inactive QR admin','authorised',true,false);
insert into public.events(id,event_type,name,starts_at,location,description,status,check_in_opens_at,check_in_closes_at,created_by) values
('98000000-0000-4000-8000-000000000001','weekly_session','Fictional scheduled QR',now(),'Test room','Fixture','scheduled',now()-interval '1 hour',now()+interval '1 hour','97000000-0000-4000-8000-000000000001'),
('98000000-0000-4000-8000-000000000002','weekly_session','Fictional completed QR',now(),'Test room','Fixture','completed',now()-interval '1 hour',now()+interval '1 hour','97000000-0000-4000-8000-000000000001'),
('98000000-0000-4000-8000-000000000003','weekly_session','Fictional windowless QR',now(),'Test room','Fixture','scheduled',null,null,'97000000-0000-4000-8000-000000000001');
set local role service_role;
select lives_ok($$select * from public.get_event_check_in_token_status('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001')$$,'account admin can read QR settings without authorised role');
select lives_ok($$select * from public.configure_event_check_in_window('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001',now()-interval '1 hour',now()+interval '2 hours')$$,'account admin can save registration window');
select lives_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001')$$,'account admin can generate QR');
select lives_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000002')$$,'authorised nonadmin can still rotate QR');
select lives_ok($$select public.revoke_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001')$$,'account admin can revoke QR');
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000003')$$,'42501',null,'ordinary committee cannot generate QR');
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000004')$$,'42501',null,'inactive admin cannot generate QR');
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000001')$$,'PQR01',null,'completed event has a state error, not permission denial');
select throws_ok($$select * from public.configure_event_check_in_window('98000000-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000001',now(),now()+interval '1 hour')$$,'PQR01',null,'window update on completed event has a state error');
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000003','97000000-0000-4000-8000-000000000001')$$,'PQR02',null,'missing window has a configuration error, not permission denial');
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000099','97000000-0000-4000-8000-000000000001')$$,'P0002',null,'missing event has a not-found error');
reset role;
set local role authenticated;
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001')$$,'42501',null,'browser cannot forge an administrator actor');
reset role;
set local role anon;
select throws_ok($$select * from public.rotate_event_check_in_token('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous caller cannot invoke QR management');
reset role;
select is((select count(*)::integer from public.event_check_in_tokens where event_id in ('98000000-0000-4000-8000-000000000002','98000000-0000-4000-8000-000000000003')),0,'failed generations create no tokens');
select * from finish();
rollback;
