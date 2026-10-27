-- Isolated synthetic users and all test records are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','dilay.sahin@bayetav.k12.tr',now(),'{"provider":"google"}','{"full_name":"Synthetic Teacher"}'),
 ('10000000-0000-4000-8000-000000000002','learnpath-student@example.test',now(),'{"provider":"google"}','{"full_name":"Synthetic Student"}'),
 ('10000000-0000-4000-8000-000000000003','learnpath-peer@example.test',now(),'{"provider":"google"}','{"full_name":"Synthetic Peer"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select public.lp_provision();
do $$begin
 begin perform public.lp_read('posts');raise exception 'Pending student accessed class records';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select public.lp_provision();
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.lp_provision();
select public.lp_enroll('10000000-0000-4000-8000-000000000002');
select public.lp_enroll('10000000-0000-4000-8000-000000000003');
select public.lp_write('unitInfo','{"title":"Synthetic unit","words":"school","grammarQuestions":[]}','set');
select public.lp_write('users/10000000-0000-4000-8000-000000000002','{"groupId":"test-group","groupName":"Test group"}','update');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$begin
 begin perform public.lp_write('users/10000000-0000-4000-8000-000000000002','{"role":"teacher"}','update');raise exception 'Student promoted self';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('users/10000000-0000-4000-8000-000000000003','{"name":"Changed"}','update');raise exception 'Student changed peer';exception when insufficient_privilege then null;end;
 begin perform public.lp_read('wordChecks/10000000-0000-4000-8000-000000000003');raise exception 'Student read peer answers';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('coins/10000000-0000-4000-8000-000000000002','1000','set');raise exception 'Student minted coins';exception when insufficient_privilege then null;end;
 begin perform public.lp_enroll('10000000-0000-4000-8000-000000000003');raise exception 'Student enrolled peer';exception when insufficient_privilege then null;end;
end$$;
select public.lp_write('contracts/10000000-0000-4000-8000-000000000002','{"studentId":"10000000-0000-4000-8000-000000000002","studentName":"Synthetic Student","productType":"Poster","grade":6,"goalVersion":"grade6-v1","status":"awaiting_grouping","editUnlocked":true}','set');
do $$begin
 begin perform public.lp_write('contracts/10000000-0000-4000-8000-000000000002','{"status":"approved"}','update');raise exception 'Student approved own plan';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.lp_write('contracts/10000000-0000-4000-8000-000000000002','{"status":"draft","editUnlocked":true}','update');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select public.lp_write('contracts/10000000-0000-4000-8000-000000000002','{"topic":"Test topic","planSteps":["Read","Write","Check"],"goals":{"unitWords":true,"tenSentences":true,"spelling":true},"status":"pending","editUnlocked":false}','update');
do $$begin
 begin perform public.lp_write('contracts/10000000-0000-4000-8000-000000000002','{"topic":"Bypass"}','update');raise exception 'Locked plan changed';exception when insufficient_privilege then null;end;
end$$;
select public.lp_write('wordChecks/10000000-0000-4000-8000-000000000002','{"checked":[true],"submittedAt":1}','set');
select public.lp_write('posts/test-post','{"uid":"10000000-0000-4000-8000-000000000002","title":"Synthetic product"}','set');
do $$declare balance integer;again integer;begin
 balance:=public.lp_reward('ignored');again:=public.lp_reward('ignored');
 if balance<>11 or again<>balance then raise exception 'Reward amount or idempotency failed: %, %',balance,again;end if;
 if public.lp_purchase('party')<>5 then raise exception 'Purchase debit failed';end if;
 if public.lp_purchase('party')<>5 then raise exception 'Repeat purchase charged again';end if;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select public.lp_write('posts/test-post/comments/test-comment','{"fromId":"10000000-0000-4000-8000-000000000003","from":"Synthetic Peer","well":"Test feedback","improve":"Test improvement"}','set');
do $$begin
 begin perform public.lp_write('posts/test-post/comments/test-duplicate','{"fromId":"10000000-0000-4000-8000-000000000003"}','set');raise exception 'Duplicate feedback accepted';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('posts/test-post',null,'remove');raise exception 'Peer deleted product';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$begin
 if public.lp_read('notifications/10000000-0000-4000-8000-000000000002') is null then raise exception 'Feedback notification missing';end if;
end$$;
select public.lp_write('wordChecks/10000000-0000-4000-8000-000000000002','{"checked":[]}','set');
select public.lp_write('posts/test-post',null,'remove');
reset role;
do $$begin
 if not exists(select 1 from learnpath_backend.history where before_data#>'{wordChecks,10000000-0000-4000-8000-000000000002,submittedAt}'='1') then raise exception 'Previous answer lost';end if;
 if not exists(select 1 from learnpath_backend.history where before_data#>'{posts,test-post}' is not null) then raise exception 'Product archive lost';end if;
 if has_function_privilege('anon','public.lp_read(text)','execute') then raise exception 'Anonymous RPC access';end if;
 if has_table_privilege('authenticated','learnpath_backend.state','select') then raise exception 'Direct state access';end if;
 if has_table_privilege('authenticated','learnpath_backend.history','select') then raise exception 'Direct archive access';end if;
end$$;
rollback;
select 'PASS: pending enrollment, server roles, ownership, private answers, grouping, approval locks, reward idempotency, atomic purchases, duplicate comments, notifications, reset archives, anonymous/direct access; synthetic changes rolled back' as verification;
