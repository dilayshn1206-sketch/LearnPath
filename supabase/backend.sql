-- Fresh Supabase backend. No legacy Firebase credentials or records are imported.
create schema learnpath_backend;
revoke all on schema learnpath_backend from public, anon, authenticated;
create table learnpath_backend.state (
 id boolean primary key default true check(id),
 data jsonb not null default '{}',
 revision bigint not null default 0
);
insert into learnpath_backend.state(id) values(true);
create table learnpath_backend.history (
 revision bigint primary key,
 actor uuid,
 path text not null,
 operation text not null,
 before_data jsonb not null,
 recorded_at timestamptz not null default now()
);
create table learnpath_backend.members (
 id uuid primary key references auth.users(id),
 role text not null check(role in ('student','teacher')),
 enrolled boolean not null default false,
 created_at timestamptz not null default now()
);
create table learnpath_backend.reward_ledger (
 user_id uuid not null references auth.users(id),
 event_key text not null,
 amount integer not null check(amount>0),
 created_at timestamptz not null default now(),
 primary key(user_id,event_key)
);
create table learnpath_backend.shop (
 id text primary key,
 slot text not null check(slot in ('head','eyes','face')),
 cost integer not null check(cost>0)
);
alter table learnpath_backend.state enable row level security;
alter table learnpath_backend.history enable row level security;
alter table learnpath_backend.members enable row level security;
alter table learnpath_backend.reward_ledger enable row level security;
alter table learnpath_backend.shop enable row level security;
revoke all on all tables in schema learnpath_backend from public, anon, authenticated;

-- Recursive assignment creates missing parents and treats JSON null as removal.
create function learnpath_backend.assign(doc jsonb, p text[], val jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare child jsonb;
begin
 if coalesce(array_length(p,1),0)=0 then return coalesce(val,'null'::jsonb); end if;
 if doc is null or jsonb_typeof(doc)<>'object' then doc:='{}'; end if;
 if array_length(p,1)=1 then
  if val is null or val='null'::jsonb then return doc-p[1]; end if;
  return jsonb_set(doc,p,val,true);
 end if;
 child:=learnpath_backend.assign(doc->p[1],p[2:],val);
 return jsonb_set(doc,array[p[1]],child,true);
end $$;

create function learnpath_backend.actor_role() returns text
language plpgsql stable security definer set search_path='' as $$
declare r text;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select role into r from learnpath_backend.members where id=auth.uid() and enrolled;
 if r is null then raise exception 'Account not initialized' using errcode='42501'; end if;
 return r;
end $$;

create function learnpath_backend.provision() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u auth.users; r text; d jsonb; profile jsonb; admitted boolean;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select * into u from auth.users where id=auth.uid();
 if u.email_confirmed_at is null or u.raw_app_meta_data->>'provider'<>'google' then
  raise exception 'A verified Google account is required' using errcode='42501';
 end if;
 r:=case when lower(u.email)='dilay.sahin@bayetav.k12.tr' then 'teacher' else 'student' end;
 insert into learnpath_backend.members(id,role,enrolled) values(u.id,r,r='teacher') on conflict(id) do nothing;
 select role,enrolled into r,admitted from learnpath_backend.members where id=u.id;
 select data into d from learnpath_backend.state where id=true for update;
 profile:=coalesce(d#>array['users',u.id::text],'{}'::jsonb) || jsonb_build_object(
  'uid',u.id,'role',r,'enrolled',admitted,'name',coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','Student'),
  'email',u.email,'photo',coalesce(u.raw_user_meta_data->>'avatar_url',''));
 insert into learnpath_backend.history select revision,u.id,'users/'||u.id,'provision',data,now() from learnpath_backend.state where id=true;
 update learnpath_backend.state set data=learnpath_backend.assign(d,array['users',u.id::text],profile),revision=revision+1 where id=true;
 return profile;
end $$;

create function learnpath_backend.read_path(p_path text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare r text:=learnpath_backend.actor_role(); d jsonb; p text[]; root text; k text; v jsonb; filtered jsonb:='{}';
begin
 p:=string_to_array(trim(both '/' from p_path),'/'); root:=p[1];
 select data into d from learnpath_backend.state where id=true;
 if r='teacher' then return d#>p; end if;
 if root in ('unitInfo','ideaCatalog','resources','liveSession','posts') then return d#>p; end if;
 if root='users' then
  for k,v in select key,value from jsonb_each(coalesce(d->root,'{}')) loop
   if k=auth.uid()::text then filtered:=filtered||jsonb_build_object(k,v);
   else filtered:=filtered||jsonb_build_object(k,jsonb_build_object('uid',k,'name',v->'name','photo',v->'photo','avatarAnimal',v->'avatarAnimal','avatarHead',v->'avatarHead','avatarEyes',v->'avatarEyes','avatarFace',v->'avatarFace')); end if;
  end loop;
 elsif root='contracts' then
  for k,v in select key,value from jsonb_each(coalesce(d->root,'{}')) loop
   if k=auth.uid()::text then filtered:=filtered||jsonb_build_object(k,v);
   elsif v->>'status'='approved' then
    filtered:=filtered||jsonb_build_object(k,(select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(v) where key=any(array['studentId','studentName','studentPhoto','productType','productId','category','topic','planSteps','goals','goalsOtherText','evalTeacherPct','evalPeerPct','status','grade','goalVersion','createdAt'])));
   end if;
  end loop;
 elsif root='resourceSuggestions' then
  select coalesce(jsonb_object_agg(key,value),'{}') into filtered from jsonb_each(coalesce(d->root,'{}')) where value->>'suggestedById'=auth.uid()::text;
 elsif root in ('lessonReflections','wordChecks','grammarAnswers','coins','coinAwards','ownedAccessories','notifications') then
  if array_length(p,1)<2 or p[2]<>auth.uid()::text then raise exception 'Private record' using errcode='42501'; end if;
  return d#>p;
 else raise exception 'Not authorized' using errcode='42501'; end if;
 if array_length(p,1)=1 then return nullif(filtered,'{}'::jsonb); end if;
 return filtered#>p[2:];
end $$;

-- All writes serialize under the state row lock, then record the previous revision.
-- Browser roles never have direct access to state/history/member tables.
create function learnpath_backend.write_path(p_path text,p_value jsonb,p_operation text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r text:=learnpath_backend.actor_role(); uid text:=auth.uid()::text; p text[]; root text; d jsonb; nd jsonb; old jsonb; val jsonb; k text; v jsonb; cp text[]; c jsonb; session jsonb; allowed boolean:=false; fields text[]; it text; price integer; slot text;
begin
 p:=string_to_array(trim(both '/' from p_path),'/'); root:=p[1];
 if root not in ('users','contracts','groups','ideaCatalog','unitInfo','wordChecks','grammarAnswers','lessonReflections','posts','resourceSuggestions','resources','coins','coinAwards','ownedAccessories','notifications','liveSession') or p_path like '%..%' or array_position(p,'') is not null then raise exception 'Invalid record path'; end if;
 if p_operation not in ('set','update','remove') then raise exception 'Invalid operation'; end if;
 if octet_length(coalesce(p_value::text,''))>2097152 then raise exception 'Record too large'; end if;
 select data into d from learnpath_backend.state where id=true for update;
 old:=d#>p; val:=case when p_operation='remove' then 'null'::jsonb else p_value end;
 if p_operation='update' then
  if jsonb_typeof(p_value)<>'object' then raise exception 'Update requires an object'; end if;
  val:=coalesce(old,'{}'::jsonb);
  for k,v in select key,value from jsonb_each(p_value) loop val:=learnpath_backend.assign(val,string_to_array(k,'/'),v); end loop;
 end if;
 if r='teacher' then allowed:=true;
 elsif root='users' and array_length(p,1)=2 and p[2]=uid and p_operation='update' then
  fields:=array['avatarAnimal','avatarHead','avatarEyes','avatarFace','avatarId','avatarUrl','avatarColor','chosenResources'];
  allowed:=not exists(select 1 from jsonb_object_keys(p_value) x where not(x=any(fields)));
  foreach it in array array['avatarHead','avatarEyes','avatarFace'] loop
   if nullif(val->>it,'') is not null and not coalesce((d#>array['ownedAccessories',uid,val->>it])='true'::jsonb,false) then raise exception 'Accessory not owned' using errcode='42501'; end if;
  end loop;
 elsif root in ('wordChecks','grammarAnswers','lessonReflections') and p[2]=uid and array_length(p,1)>=2 then
  allowed:=true;
 elsif root='contracts' and array_length(p,1)=2 and p[2]=uid then
  c:=old;
  -- Project access is independent of grouping, classroom timers and edit flags.
  -- The actor is still an enrolled student and may only write their own path.
  if p_operation='remove' then allowed:=true;
  elsif p_operation='set' then
   allowed:=val->>'status' in ('draft','awaiting_grouping') and val->>'studentId'=uid and val->>'grade'='6' and val->>'goalVersion'='grade6-v1';
   val:=val||jsonb_build_object('status','draft','editUnlocked',true);
  else
   fields:=array['topic','planSteps','goals','goalsOtherText','evalTeacherPct','evalPeerPct','status','editUnlocked','submittedAt'];
   if p_value ? 'projectEval' then
    allowed:=nullif(c->>'productType','') is not null and (select count(*) from jsonb_object_keys(p_value))=1;
   else
    allowed:=nullif(c->>'productType','') is not null and not exists(select 1 from jsonb_object_keys(p_value) x where not(x=any(fields)));
    if p_value ? 'status' and coalesce(val->>'status','') not in ('draft','pending') then allowed:=false; end if;
    if p_value->>'status'='pending' then
     if (select count(*) from jsonb_each(coalesce(val->'goals','{}')) where value='true'::jsonb and key=any(array['unitWords','organize','grammar','tenSentences','evidence','spelling','speakClear','easyUnderstand','workAtHome','topicImpact','structure'])) + (case when nullif(trim(val->>'goalsOtherText'),'') is not null then 1 else 0 end) <3 then raise exception 'Please choose at least three goals'; end if;
     if nullif(trim(val->>'topic'),'') is null or jsonb_typeof(val->'planSteps')<>'array' or coalesce(jsonb_array_length(val->'planSteps'),0)<3 or exists(select 1 from jsonb_array_elements_text(val->'planSteps') s where nullif(trim(s),'') is null) then raise exception 'Complete your topic and all plan steps'; end if;
    elsif p_value ?| array['topic','planSteps','goals','goalsOtherText','evalTeacherPct','evalPeerPct'] then
     -- An edited submission needs review again; students cannot retain or grant approval.
     val:=val||jsonb_build_object('status','draft');
    end if;
    val:=val||jsonb_build_object('editUnlocked',true);
   end if;
  end if;
 elsif root='resourceSuggestions' and array_length(p,1)=2 and old is null and p_operation='set' then allowed:=val->>'suggestedById'=uid;
 elsif root='posts' then
  if array_length(p,1)=2 then
   allowed:=(p_operation='set' and old is null and val->>'uid'=uid and not(val ? 'comments') and not(val ? 'likes')) or (p_operation='remove' and old->>'uid'=uid);
   if val->>'filePath' is not null and val->>'filePath'<>'' and val->>'filePath' not like 'posts/'||uid||'/%' then allowed:=false; end if;
  elsif array_length(p,1)=4 and p[3]='likes' and p[4]=uid then allowed:=d#>p[1:2] is not null and (val='true'::jsonb or p_operation='remove');
  elsif array_length(p,1)=4 and p[3]='comments' and old is null and p_operation='set' then
   allowed:=d#>p[1:2] is not null and val->>'fromId'=uid and coalesce(val->>'isTeacher','false')='false' and not(val ? 'personalGoalReview') and not exists(select 1 from jsonb_each(coalesce(d#>p[1:3],'{}')) where value->>'fromId'=uid);
  end if;
 elsif root='notifications' and p[2]=uid and array_length(p,1)=3 and p_operation='update' then
  allowed:=old is not null and p_value='{"read":true}'::jsonb;
 end if;
 if not coalesce(allowed,false) then raise exception 'This action is not authorized or the activity is locked' using errcode='42501'; end if;
 if root='users' and array_length(p,1)>=2 then
  -- UI role values are never authorization evidence, including teacher writes.
  select role into it from learnpath_backend.members where id=p[2]::uuid;
  if array_length(p,1)=2 and val is not null and val<>'null'::jsonb then val:=val||jsonb_build_object('role',it,'uid',p[2]); end if;
 end if;
 nd:=learnpath_backend.assign(d,p,val);
 if root='posts' and array_length(p,1)=4 and p[3]='comments' and p_operation='set' then
  it:=d#>>array['posts',p[2],'uid'];
  if it is not null and it<>uid then
   nd:=learnpath_backend.assign(nd,array['notifications',it,gen_random_uuid()::text],jsonb_build_object('type','comment','message',coalesce(val->>'from','Someone')||' commented on your work!','read',false,'createdAt',floor(extract(epoch from now())*1000)));
  end if;
 end if;
 insert into learnpath_backend.history select revision,auth.uid(),p_path,p_operation,data,now() from learnpath_backend.state where id=true;
 update learnpath_backend.state set data=nd,revision=revision+1 where id=true;
 return val;
end $$;

create function learnpath_backend.reward(p_event text) returns integer
language plpgsql security definer set search_path='' as $$
declare uid text:=auth.uid()::text; r text:=learnpath_backend.actor_role(); d jsonb; item record; balance integer; n integer;
begin
 select data into d from learnpath_backend.state where id=true for update;
 -- Derive reward entitlement from saved records; client-supplied amounts are ignored.
 for item in
  select 'post:'||key as event,5 as amount from jsonb_each(coalesce(d->'posts','{}')) where value->>'uid'=uid
  union all select 'reflection:'||key,2 from jsonb_each(coalesce(d#>array['lessonReflections',uid],'{}'))
  union all select 'comment:'||p.key||':'||c.key,5 from jsonb_each(coalesce(d->'posts','{}')) p cross join lateral jsonb_each(coalesce(p.value->'comments','{}')) c where c.value->>'fromId'=uid and p.value->>'uid'<>uid
  union all select 'project-eval',5 where d#>array['contracts',uid,'projectEval'] is not null
  union all select 'step2',2 where nullif(d#>>array['contracts',uid,'productType'],'') is not null
  union all select 'step3',2 where d#>>array['contracts',uid,'status'] in ('pending','approved')
  union all select 'step1',2 where (nullif(d#>>'{unitInfo,words}','') is not null or jsonb_array_length(coalesce(d#>'{unitInfo,grammarQuestions}','[]'))>0) and (nullif(d#>>'{unitInfo,words}','') is null or d#>array['wordChecks',uid,'submittedAt'] is not null) and (jsonb_array_length(coalesce(d#>'{unitInfo,grammarQuestions}','[]'))=0 or d#>>array['grammarAnswers',uid,'submitted']='true')
 loop
  insert into learnpath_backend.reward_ledger(user_id,event_key,amount) values(auth.uid(),item.event,item.amount) on conflict do nothing;
  get diagnostics n=row_count;
  if n=1 then
   balance:=coalesce((d#>>array['coins',uid])::integer,0)+item.amount;
   d:=learnpath_backend.assign(d,array['coins',uid],to_jsonb(balance));
   d:=learnpath_backend.assign(d,array['coinAwards',uid,item.event],'true');
  end if;
 end loop;
 insert into learnpath_backend.history select revision,auth.uid(),'coins/'||uid,'reward',data,now() from learnpath_backend.state where id=true and data<>d;
 update learnpath_backend.state set revision=revision+case when data<>d then 1 else 0 end,data=d where id=true;
 return coalesce((d#>>array['coins',uid])::integer,0);
end $$;

create function learnpath_backend.purchase(p_item text) returns integer
language plpgsql security definer set search_path='' as $$
declare r text:=learnpath_backend.actor_role(); d jsonb; uid text:=auth.uid()::text; price integer; balance integer;
begin
 select cost into price from learnpath_backend.shop where id=p_item;
 if price is null then raise exception 'Unknown accessory'; end if;
 select data into d from learnpath_backend.state where id=true for update;
 balance:=coalesce((d#>>array['coins',uid])::integer,0);
 if d#>array['ownedAccessories',uid,p_item]='true'::jsonb then return balance; end if;
 if balance<price then raise exception 'Not enough coins'; end if;
 insert into learnpath_backend.history select revision,auth.uid(),'ownedAccessories/'||uid,'purchase',data,now() from learnpath_backend.state where id=true;
 d:=learnpath_backend.assign(d,array['coins',uid],to_jsonb(balance-price));
 d:=learnpath_backend.assign(d,array['ownedAccessories',uid,p_item],'true');
 update learnpath_backend.state set data=d,revision=revision+1 where id=true;
 return balance-price;
end $$;

-- Narrow authenticated RPC entry points. No anonymous application access.
grant usage on schema learnpath_backend to authenticated;
revoke all on all functions in schema learnpath_backend from public,anon,authenticated;
grant execute on function learnpath_backend.provision(),learnpath_backend.read_path(text),learnpath_backend.write_path(text,jsonb,text),learnpath_backend.reward(text),learnpath_backend.purchase(text) to authenticated;
create function public.lp_provision() returns jsonb language sql security invoker set search_path='' as $$select learnpath_backend.provision()$$;
create function public.lp_read(p_path text) returns jsonb language sql security invoker set search_path='' as $$select learnpath_backend.read_path(p_path)$$;
create function public.lp_write(p_path text,p_value jsonb,p_operation text) returns jsonb language sql security invoker set search_path='' as $$select learnpath_backend.write_path(p_path,p_value,p_operation)$$;
create function public.lp_reward(p_event text) returns integer language sql security invoker set search_path='' as $$select learnpath_backend.reward(p_event)$$;
create function public.lp_purchase(p_item text) returns integer language sql security invoker set search_path='' as $$select learnpath_backend.purchase(p_item)$$;
revoke all on function public.lp_provision(),public.lp_read(text),public.lp_write(text,jsonb,text),public.lp_reward(text),public.lp_purchase(text) from public,anon;
grant execute on function public.lp_provision(),public.lp_read(text),public.lp_write(text,jsonb,text),public.lp_reward(text),public.lp_purchase(text) to authenticated;

create function learnpath_backend.enroll(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
declare r text:=learnpath_backend.actor_role(); d jsonb;
begin
 if r<>'teacher' then raise exception 'Teacher access required' using errcode='42501'; end if;
 select data into d from learnpath_backend.state where id=true for update;
 if not exists(select 1 from learnpath_backend.members where id=p_user) then raise exception 'Account not found'; end if;
 insert into learnpath_backend.history select revision,auth.uid(),'users/'||p_user,'enroll',data,now() from learnpath_backend.state where id=true;
 update learnpath_backend.members set enrolled=true where id=p_user;
 update learnpath_backend.state set data=learnpath_backend.assign(d,array['users',p_user::text,'enrolled'],'true'),revision=revision+1 where id=true;
end $$;
revoke all on function learnpath_backend.enroll(uuid) from public,anon;
grant execute on function learnpath_backend.enroll(uuid) to authenticated;
create function public.lp_enroll(p_user uuid) returns void language sql security invoker set search_path='' as $$select learnpath_backend.enroll(p_user)$$;
revoke all on function public.lp_enroll(uuid) from public,anon;
grant execute on function public.lp_enroll(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit) values('learnpath-work','learnpath-work',false,104857600);
-- No DELETE policy: deleting a post archives its data and retains its research file.
create function learnpath_backend.can_read_file(p_name text) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare r text:=learnpath_backend.actor_role(); d jsonb;
begin
 if r='teacher' or p_name like 'posts/'||auth.uid()::text||'/%' then return true; end if;
 select data into d from learnpath_backend.state where id=true;
 return exists(select 1 from jsonb_each(coalesce(d->'posts','{}')) where value->>'filePath'=p_name);
end $$;
revoke all on function learnpath_backend.can_read_file(text) from public,anon;
grant execute on function learnpath_backend.can_read_file(text) to authenticated;
create policy lp_upload on storage.objects for insert to authenticated with check(bucket_id='learnpath-work' and (storage.foldername(name))[1]='posts' and (storage.foldername(name))[2]=(select auth.uid())::text and learnpath_backend.can_read_file(name));
create policy lp_download on storage.objects for select to authenticated using(bucket_id='learnpath-work' and learnpath_backend.can_read_file(name));

insert into learnpath_backend.shop(id,slot,cost) values ('party','head',6),('crown','head',16),('tophat','head',12),('propeller','head',10),('wizard','head',14),('cowboy','head',10),('shades','eyes',8),('nerd','eyes',6),('monocle','eyes',10),('eyepatch','eyes',8),('mustache','face',8),('clownnose','face',5),('gum','face',8),('googly','eyes',7),('groucho','eyes',12),('arrow','head',15),('viking','head',12),('chef','head',10),('buckteeth','face',6),('tongue','face',6),('lips','face',8);
