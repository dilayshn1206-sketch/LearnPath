-- Synthetic transaction; identities, answers and audit/export events roll back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('40000000-0000-4000-8000-000000000001','focus-owner@example.test',now(),'{"provider":"google"}','{}'),
 ('40000000-0000-4000-8000-000000000002','focus-other@example.test',now(),'{"provider":"google"}','{}');
insert into learnpath_backend.members(id,role,enrolled) values
 ('40000000-0000-4000-8000-000000000001','student',true),('40000000-0000-4000-8000-000000000002','student',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);
select public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"studentId":"40000000-0000-4000-8000-000000000001","grade":6,"goalVersion":"grade6-v1","status":"draft","productType":"Comic","topic":"Kindness","goals":{"unitWords":true,"grammar":true,"tenSentences":true},"planSteps":["I will plan.","I will create.","I will check."],"weaknessTips":["Original one","Original two","Original three"]}','set');
select public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"weaknessTips":["My revised action","Original two","Original three"]}','update');
do $$declare c jsonb;begin
 c:=public.lp_read('contracts/40000000-0000-4000-8000-000000000001');
 if c#>>'{weaknessTips,0}'<>'My revised action' or c#>>'{goals,unitWords}'<>'true' or jsonb_array_length(c->'planSteps')<>3 then raise exception 'Edit lost or unrelated fields changed';end if;
 begin
  perform public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"weaknessTips":"invalid"}','update');
  raise exception 'Invalid focus type accepted';
 exception when raise_exception then if sqlerrm='Invalid focus type accepted' then raise;end if;end;
 begin
  perform public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"status":"pending","weaknessTips":["","Two","Three"]}','update');
  raise exception 'Empty submitted focus accepted';
 exception when raise_exception then if sqlerrm='Empty submitted focus accepted' then raise;end if;end;
end$$;
select public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"weaknessTips":["","Original two","Original three"]}','update');
do $$begin
 begin
  perform public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"status":"pending"}','update');
  raise exception 'Status-only submit bypassed focus validation';
 exception when raise_exception then if sqlerrm='Status-only submit bypassed focus validation' then raise;end if;end;
end$$;
select public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"status":"pending","weaknessTips":["My revised action","Original two","Original three"]}','update');
select public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"weaknessTips":["Changed after sending","Original two","Original three"]}','update');
do $$begin
 if public.lp_read('contracts/40000000-0000-4000-8000-000000000001')->>'status'<>'draft' then raise exception 'Edited submission did not return to draft';end if;
end$$;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000002',true);
do $$begin
 begin
  perform public.lp_write('contracts/40000000-0000-4000-8000-000000000001','{"weaknessTips":["Forged","Two","Three"]}','update');
  raise exception 'Another student edited focus';
 exception when insufficient_privilege then null;end;
end$$;
rollback;
select 'PASS: own focus edit persists without goal/plan loss; malformed/empty submit rejected; edited submission becomes draft; other student denied; fixtures rolled back' as verification;
