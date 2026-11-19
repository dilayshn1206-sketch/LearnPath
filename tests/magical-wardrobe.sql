begin;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values('10000000-0000-4000-8000-000000000019','wardrobe-regression@example.test',now(),'{"provider":"google"}','{}');
insert into learnpath_backend.members(id,role,enrolled) values('10000000-0000-4000-8000-000000000019','student',true);
update learnpath_backend.state set data=learnpath_backend.assign(
 learnpath_backend.assign(data,array['coins','10000000-0000-4000-8000-000000000019'],'28'::jsonb),
 array['users','10000000-0000-4000-8000-000000000019'],'{"name":"Wardrobe regression","role":"student"}'::jsonb) where id=true;
update learnpath_backend.state set data=learnpath_backend.assign(data,array['users','10000000-0000-4000-8000-000000000020'],'{"name":"Synthetic Peer","email":"private@example.test","avatarAnimal":"magic-hedgehog","avatarOutfit":"magic-jacket","avatarItem":"magic-camera"}'::jsonb) where id=true;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000019',true);
do $test$
declare n integer; u text:='10000000-0000-4000-8000-000000000019';
begin
 begin perform public.lp_write('users/'||u,'{"avatarAnimal":"magic-starlion"}','update');raise exception 'Unowned paid character accepted';exception when insufficient_privilege then null;end;
 begin perform public.lp_write('users/'||u,'{"avatarOutfit":"magic-jacket"}','update');raise exception 'Unowned item accepted';exception when insufficient_privilege then null;end;
 perform public.lp_write('users/'||u,'{"avatarAnimal":"magic-hedgehog"}','update');
 n:=public.lp_purchase('magic-starlion');
 if n<>4 then raise exception 'Expected balance 4, got %',n;end if;
 n:=public.lp_purchase('magic-starlion');
 if n<>4 then raise exception 'Duplicate purchase deducted coins';end if;
 perform public.lp_write('users/'||u,'{"avatarAnimal":"magic-starlion"}','update');
 begin perform public.lp_purchase('magic-jacket');raise exception 'Unaffordable item accepted';exception when raise_exception then if sqlerrm<>'Not enough coins' then raise;end if;end;
 n:=public.lp_purchase('magic-scarf');
 if n<>0 then raise exception 'Expected balance 0, got %',n;end if;
 perform public.lp_write('users/'||u,'{"avatarOutfit":"magic-scarf"}','update');
 begin perform public.lp_write('users/'||u,'{"avatarItem":"magic-scarf"}','update');raise exception 'Wrong slot accepted';exception when insufficient_privilege then null;end;
 perform public.lp_write('users/'||u,'{"avatarOutfit":null}','update');
end $test$;
do $profile$
declare p jsonb;
begin
 p:=public.lp_read('users/10000000-0000-4000-8000-000000000020');
 if p->>'avatarOutfit' is distinct from 'magic-jacket' or p->>'avatarItem' is distinct from 'magic-camera' then raise exception 'Peer wardrobe projection missing';end if;
 if p ? 'email' then raise exception 'Peer private email exposed';end if;
end $profile$;
rollback;
