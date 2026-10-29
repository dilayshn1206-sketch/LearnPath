-- All users and fixture mutations roll back; existing learner data is untouched.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('20000000-0000-4000-8000-000000000001','editing-owner@example.test',now(),'{"provider":"google"}','{"full_name":"Editing Owner"}'),
 ('20000000-0000-4000-8000-000000000002','editing-peer@example.test',now(),'{"provider":"google"}','{"full_name":"Editing Peer"}');
insert into learnpath_backend.members(id,role,enrolled) values
 ('20000000-0000-4000-8000-000000000001','student',true),
 ('20000000-0000-4000-8000-000000000002','student',true);
-- Fixture-only closed activity, no group, and previously locked/approved passport.
update learnpath_backend.state set data=learnpath_backend.assign(data,array['liveSession'],'{"active":true,"step":"step1","deadline":1}') where id=true;
update learnpath_backend.state set data=learnpath_backend.assign(data,array['contracts','20000000-0000-4000-8000-000000000001'],'{"studentId":"20000000-0000-4000-8000-000000000001","productType":"Blog","status":"approved","editUnlocked":false,"topic":"Old topic"}') where id=true;
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"topic":"My updated topic"}','update');
do $$declare c jsonb;begin
 c:=public.lp_read('contracts/20000000-0000-4000-8000-000000000001');
 if c->>'topic'<>'My updated topic' or c->>'status'<>'draft' or c->>'editUnlocked'<>'true' then raise exception 'Own locked passport was not made editable';end if;
 begin perform public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"status":"approved"}','update');raise exception 'Student approved self';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('contracts/20000000-0000-4000-8000-000000000002','{"topic":"Peer write"}','update');raise exception 'Student changed peer';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"studentId":"20000000-0000-4000-8000-000000000002"}','update');raise exception 'Student reassigned ownership';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('users/20000000-0000-4000-8000-000000000001','{"role":"teacher"}','update');raise exception 'Student elevated role';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"status":"pending","goals":{}}','update');raise exception 'Incomplete submission accepted';exception when raise_exception then if sqlerrm='Incomplete submission accepted' then raise;end if;end;
end$$;
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"status":"pending","editUnlocked":false,"topic":"Updated topic","goals":{"unitWords":true,"spelling":true,"structure":true},"planSteps":["I will plan","I will write","I will check"]}','update');
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"topic":"Edit after sending"}','update');
-- Retaking the idea flow remains possible, even with an old cached edit flag.
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"studentId":"20000000-0000-4000-8000-000000000001","productType":"Comic","grade":6,"goalVersion":"grade6-v1","status":"awaiting_grouping","editUnlocked":false}','set');
do $$declare c jsonb;begin
 c:=public.lp_read('contracts/20000000-0000-4000-8000-000000000001');
 if c->>'status'<>'draft' or c->>'editUnlocked'<>'true' then raise exception 'Retake still needs teacher unlock/grouping';end if;
end$$;
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001','{"projectEval":{"satisfied":3,"followedPlan":2,"achievedGoals":3,"gotScore":2}}','update');
select public.lp_write('wordChecks/20000000-0000-4000-8000-000000000001','{"checked":[],"stage":"before-project"}','set');
select public.lp_write('grammarAnswers/20000000-0000-4000-8000-000000000001','{"answers":{}}','set');
select public.lp_write('contracts/20000000-0000-4000-8000-000000000001',null,'remove');
reset role;
do $$begin
 if not exists(select 1 from learnpath_backend.history where before_data#>>'{contracts,20000000-0000-4000-8000-000000000001,topic}'='My updated topic') then raise exception 'Previous answer archive lost';end if;
 if has_function_privilege('anon','public.lp_write(text,jsonb,text)','execute') then raise exception 'Anonymous write exposed';end if;
 if has_table_privilege('authenticated','learnpath_backend.state','select') then raise exception 'Direct state access exposed';end if;
end$$;
rollback;
select 'PASS: no edit/group/deadline gates; approved edits become drafts; retake/resubmit; own inputs; no peer writes, approval/role escalation or anonymous access; archive retained; all fixtures rolled back' as result;
