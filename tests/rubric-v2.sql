-- Synthetic enrolled accounts; all writes and export events roll back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
('30000000-0000-4000-8000-000000000001','rubric-owner@example.test',now(),'{"provider":"google"}','{}'),
('30000000-0000-4000-8000-000000000002','rubric-peer@example.test',now(),'{"provider":"google"}','{}');
insert into learnpath_backend.members(id,role,enrolled) values
('30000000-0000-4000-8000-000000000001','student',true),('30000000-0000-4000-8000-000000000002','student',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select public.lp_write('posts/rubric-v2-fixture','{"uid":"30000000-0000-4000-8000-000000000001","selfRubricVersion":"grade6-20261102-v2","selfRubric":[3,2,1,0,3],"well":"Fixture","improve":"Fixture"}','set');
do $test$
declare invalid jsonb;
begin
 if (public.lp_read('posts/rubric-v2-fixture')->>'selfRubricVersion')<>'grade6-20261102-v2' then raise exception 'Version not retained';end if;
 for invalid in select value from jsonb_array_elements('[{"selfRubricVersion":"grade6-20261102-v2","selfRubric":[3,3,3,3]},{"selfRubricVersion":"grade6-20261102-v2","selfRubric":[3,3,3,3,4]},{"selfRubricVersion":"grade6-20261102-v2","selfRubric":[3,3,null,3,3]},{"selfRubricVersion":"grade6-20261102-v2","selfRubric":[3,3,"2",3,3]},{"selfRubricVersion":"unknown","selfRubric":[3,3,3,3,3]}]'::jsonb) loop
  begin
   perform public.lp_write('posts/rubric-invalid-fixture',invalid||'{"uid":"30000000-0000-4000-8000-000000000001"}'::jsonb,'set');
   raise exception 'Accepted invalid rubric';
  exception when others then if sqlerrm='Accepted invalid rubric' then raise;end if;end;
 end loop;
 begin
  perform public.lp_write('posts/rubric-v2-fixture/comments/forged','{"fromId":"30000000-0000-4000-8000-000000000001","isTeacher":true,"peerRubricVersion":"grade6-20261102-v2","peerRubric":[3,3,3,3,3]}','set');
  raise exception 'Teacher forgery accepted';
 exception when insufficient_privilege then null;end;
end $test$;
select public.lp_write('posts/rubric-legacy-fixture','{"uid":"30000000-0000-4000-8000-000000000001","selfRubric":[0,1,2,0,1,2]}','set');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select public.lp_write('posts/rubric-v2-fixture/comments/peer','{"fromId":"30000000-0000-4000-8000-000000000002","peerRubricVersion":"grade6-20261102-v2","peerRubric":[3,3,3,3,3],"well":"Fixture","improve":"Fixture"}','set');
reset role;
do $test$
declare d jsonb; payload jsonb;
begin
 select data into d from learnpath_backend.state where id=true;
 select r.payload into payload from learnpath_backend.sheet_records(d) r where kind='self_evaluations' and record_id='rubric-v2-fixture';
 if payload->>'selfRubricVersion'<>'grade6-20261102-v2' or payload->'selfRubric'<>'[3,2,1,0,3]'::jsonb then raise exception 'Self export lost rubric version or answers';end if;
 select r.payload into payload from learnpath_backend.sheet_records(d) r where kind='peer_evaluations' and record_id='post/rubric-v2-fixture/peer';
 if payload->>'peerRubricVersion'<>'grade6-20261102-v2' then raise exception 'Peer export lost version';end if;
 if d#>'{posts,rubric-legacy-fixture,selfRubric}'<>'[0,1,2,0,1,2]'::jsonb then raise exception 'Legacy response changed';end if;
 if has_function_privilege('authenticated','learnpath_backend.validate_rubric_record(jsonb,text)','execute') then raise exception 'Unexpected helper access';end if;
end $test$;
rollback;
select 'PASS: versioned self/peer save and export, malformed responses rejected, legacy retained, actor permissions unchanged, fixtures rolled back' as result;
