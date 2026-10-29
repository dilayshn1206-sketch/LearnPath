-- Synthetic fixture transaction only. All new records are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('20000000-0000-4000-8000-000000000001','goal-teacher@example.test',now(),'{"provider":"google"}','{}'),
 ('20000000-0000-4000-8000-000000000002','goal-student@example.test',now(),'{"provider":"google"}','{}');
insert into learnpath_backend.members(id,role,enrolled) values
 ('20000000-0000-4000-8000-000000000001','teacher',true),
 ('20000000-0000-4000-8000-000000000002','student',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.lp_write('posts/goal-check-fixture','{"uid":"20000000-0000-4000-8000-000000000002","title":"Fixture","goalSnapshot":{"goals":{"unitWords":true}}}','set');
do $$begin
 begin
  perform public.lp_write('posts/goal-check-fixture/comments/forged','{"fromId":"20000000-0000-4000-8000-000000000002","isTeacher":true,"personalGoalReview":{"goals":[{"met":true}]}}','set');
  raise exception 'Student forged teacher feedback';
 exception when insufficient_privilege then null;end;
 begin
  perform public.lp_write('posts/goal-check-fixture/comments/forged','{"fromId":"20000000-0000-4000-8000-000000000002","isTeacher":false,"personalGoalReview":{"goals":[{"met":true}]}}','set');
  raise exception 'Student wrote formal goal review';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select public.lp_write('posts/goal-check-fixture/comments/teacher','{"fromId":"20000000-0000-4000-8000-000000000001","isTeacher":true,"peerRubric":[0,1,2,0,1,2],"personalGoalReview":{"version":1,"goals":[{"id":"unitWords","text":"I will use at least eight unit words.","met":true},{"id":"custom","text":"I will ask for feedback.","met":false}]}}','set');
do $$begin
 if public.lp_read('posts/goal-check-fixture/comments/teacher')#>'{personalGoalReview,goals,1,met}'<>'false'::jsonb then raise exception 'No answer was lost';end if;
end$$;
reset role;
do $$begin
 if not exists(select 1 from learnpath_backend.state s cross join lateral learnpath_backend.sheet_records(s.data) r where r.record_id='post/goal-check-fixture/teacher' and r.kind='teacher_evaluations' and r.payload#>'{personalGoalReview,goals,1,met}'='false'::jsonb) then raise exception 'Goal review missing from teacher export';end if;
end$$;
rollback;
select 'PASS: teacher Yes/No and rubric preserved, student/peer formal reviews denied, false value and original goal text retained in teacher export; fixtures rolled back' as verification;
