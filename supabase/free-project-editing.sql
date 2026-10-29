-- Remove activity/editing gates while preserving ownership, roles, archives and validation.
create or replace function learnpath_backend.write_path(p_path text,p_value jsonb,p_operation text) returns jsonb
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
   allowed:=d#>p[1:2] is not null and val->>'fromId'=uid and coalesce(val->>'isTeacher','false')='false' and not exists(select 1 from jsonb_each(coalesce(d#>p[1:3],'{}')) where value->>'fromId'=uid);
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
revoke all on function learnpath_backend.write_path(text,jsonb,text) from public,anon;
grant execute on function learnpath_backend.write_path(text,jsonb,text) to authenticated;
