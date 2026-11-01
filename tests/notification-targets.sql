-- All synthetic identities, writes, history and export events are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
 ('30000000-0000-4000-8000-000000000001','notification-owner@example.test',now(),'{"provider":"google"}','{}'),
 ('30000000-0000-4000-8000-000000000002','notification-peer@example.test',now(),'{"provider":"google"}','{}');
insert into learnpath_backend.members(id,role,enrolled) values
 ('30000000-0000-4000-8000-000000000001','student',true),
 ('30000000-0000-4000-8000-000000000002','student',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select public.lp_write('posts/notification-fixture','{"uid":"30000000-0000-4000-8000-000000000001","title":"Synthetic fixture"}','set');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select public.lp_write('posts/notification-fixture/comments/fixture-comment','{"from":"Synthetic peer","fromId":"30000000-0000-4000-8000-000000000002","well":"Fixture only","createdAt":1}','set');
do $$begin
 begin
  perform public.lp_write('notifications/30000000-0000-4000-8000-000000000001/forged','{"postId":"forged"}','set');
  raise exception 'Peer forged notification';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
do $$declare alerts jsonb; alert_id text;begin
 alerts:=public.lp_read('notifications/30000000-0000-4000-8000-000000000001');
 select key into alert_id from jsonb_each(alerts) where value->>'postId'='notification-fixture' and value->>'commentId'='fixture-comment';
 if alert_id is null then raise exception 'Missing notification target';end if;
 perform public.lp_write('notifications/30000000-0000-4000-8000-000000000001/'||alert_id,'{"read":true}','update');
 if public.lp_read('notifications/30000000-0000-4000-8000-000000000001/'||alert_id)->>'read'<>'true' then raise exception 'Read flag not saved';end if;
end$$;
rollback;
select 'PASS: server creates exact post/comment targets, recipient can mark read, peer cannot forge; all fixtures rolled back' as verification;
