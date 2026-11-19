-- Magical wardrobe catalog and owned-only avatar equipment. Existing inventories are retained.
alter table learnpath_backend.shop drop constraint shop_slot_check;
alter table learnpath_backend.shop add constraint shop_slot_check check (slot in ('head','eyes','face','outfit','item','animal'));
insert into learnpath_backend.shop(id,slot,cost) values
 ('magic-scarf','outfit',4),
 ('magic-jacket','outfit',8),
 ('magic-cape','outfit',15),
 ('magic-patch-vest','outfit',4),
 ('magic-raincoat','outfit',8),
 ('magic-cap','head',4),
 ('magic-helmet','head',8),
 ('magic-crown','head',15),
 ('magic-wobble-ears','head',8),
 ('magic-tiny-orbit','head',15),
 ('magic-book','item',4),
 ('magic-camera','item',8),
 ('magic-lantern','item',15),
 ('magic-pocket-kite','item',4),
 ('magic-bubble-lab','item',15),
 ('magic-auroradeer','animal',20),
 ('magic-starlion','animal',24)
on conflict(id) do update set slot=excluded.slot,cost=excluded.cost;

CREATE OR REPLACE FUNCTION learnpath_backend.write_path(p_path text, p_value jsonb, p_operation text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  fields:=array['avatarAnimal','avatarHead','avatarEyes','avatarFace','avatarOutfit','avatarItem','avatarId','avatarUrl','avatarColor','chosenResources'];
  allowed:=not exists(select 1 from jsonb_object_keys(p_value) x where not(x=any(fields)));
  foreach it in array array['avatarHead','avatarEyes','avatarFace','avatarOutfit','avatarItem'] loop
   if nullif(val->>it,'') is not null and not coalesce((d#>array['ownedAccessories',uid,val->>it])='true'::jsonb,false) then raise exception 'Accessory not owned' using errcode='42501'; end if;
  end loop;
  if val->>'avatarAnimal' like 'magic-%' then
   if val->>'avatarAnimal' not in ('magic-hedgehog','magic-rainotter','magic-moonrabbit','magic-sunpanda','magic-cloudowl','magic-auroradeer','magic-starlion') then
    raise exception 'Unknown character' using errcode='42501';
   end if;
   if val->>'avatarAnimal' in ('magic-auroradeer','magic-starlion') and not coalesce(d#>array['ownedAccessories',uid,val->>'avatarAnimal']='true'::jsonb,false) then
    raise exception 'Character not owned' using errcode='42501';
   end if;
  end if;
  foreach it in array array['avatarHead','avatarOutfit','avatarItem'] loop
   if val->>it like 'magic-%' then
    select s.slot into slot from learnpath_backend.shop s where s.id=val->>it;
    if slot is distinct from (case it when 'avatarHead' then 'head' when 'avatarOutfit' then 'outfit' else 'item' end) then
     raise exception 'Item does not fit this slot' using errcode='42501';
    end if;
   end if;
  end loop;
 elsif root in ('wordChecks','grammarAnswers','lessonReflections') and p[2]=uid and array_length(p,1)>=2 then
  allowed:=true;
 elsif root='contracts' and array_length(p,1)=2 and p[2]=uid then
  c:=old; -- Difficulty tips are planning suggestions, not extra goals.
  if p_value ? 'weaknessTips' then
   if jsonb_typeof(p_value->'weaknessTips')<>'array' then raise exception 'Check your three focus goals';end if;
   if jsonb_array_length(p_value->'weaknessTips')<>3 or exists(select 1 from jsonb_array_elements(p_value->'weaknessTips') x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>500) then raise exception 'Check your three focus goals';end if;
   
  end if;
  -- Project access is independent of grouping, classroom timers and edit flags.
  -- The actor is still an enrolled student and may only write their own path.
  if p_operation='remove' then allowed:=true;
  elsif p_operation='set' then
   allowed:=val->>'status' in ('draft','awaiting_grouping') and val->>'studentId'=uid and val->>'grade'='6' and (val->>'goalVersion'='grade6-v1' or (val->>'goalVersion'='grade6-support-goals-20261108-v1' and learnpath_backend.learning_support_profile()='guided-v1'));
   val:=val||jsonb_build_object('status','draft','editUnlocked',true);
  else
   fields:=array['topic','planSteps','goals','goalsOtherText','weaknessTips','evalTeacherPct','evalPeerPct','status','editUnlocked','submittedAt'];
   if p_value ? 'projectEval' then
    allowed:=nullif(c->>'productType','') is not null and (select count(*) from jsonb_object_keys(p_value))=1;
   else
    allowed:=nullif(c->>'productType','') is not null and not exists(select 1 from jsonb_object_keys(p_value) x where not(x=any(fields)));
    if p_value ? 'status' and coalesce(val->>'status','') not in ('draft','pending') then allowed:=false; end if;
    if p_value->>'status'='pending' then
     if val->>'goalVersion'='grade6-support-goals-20261108-v1' then
      if learnpath_backend.learning_support_profile() is distinct from 'guided-v1' then raise exception 'Support profile not available' using errcode='42501';end if;
      perform learnpath_backend.validate_support_contract(val);
     else
     
     if (select count(*) from jsonb_each(coalesce(val->'goals','{}')) where value='true'::jsonb and key=any(array['unitWords','organize','grammar','tenSentences','evidence','spelling','speakClear','easyUnderstand','workAtHome','topicImpact','structure'])) + (select count(distinct btrim(g)) from regexp_split_to_table(coalesce(val->>'goalsOtherText',''),E'\\r?\\n') as g where regexp_replace(btrim(g),'^i[[:space:]]+will[[:space:]]*','','i') ~ '[[:alnum:]]') <3 then raise exception 'Please choose at least three goals'; end if;
     if nullif(trim(val->>'topic'),'') is null or jsonb_typeof(val->'planSteps')<>'array' or coalesce(jsonb_array_length(val->'planSteps'),0)<3 or exists(select 1 from jsonb_array_elements_text(val->'planSteps') s where nullif(trim(s),'') is null) then raise exception 'Complete your topic and all plan steps'; end if;
    end if;
    elsif p_value ?| array['topic','planSteps','goals','goalsOtherText','weaknessTips','evalTeacherPct','evalPeerPct'] then
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

 -- Versioned four-step EK1/EK2 records; older unversioned records remain valid.
 if root='posts' and p_operation<>'remove' then
  if array_length(p,1)=2 then perform learnpath_backend.validate_rubric_record(val,'self');
  elsif array_length(p,1)=4 and p[3]='comments' then perform learnpath_backend.validate_rubric_record(val,'peer');end if;
 end if;

 if r='student' and root='posts' and array_length(p,1)=2 and p_operation<>'remove' and (old is null or old='null'::jsonb) then
  perform learnpath_backend.validate_share_checks(val,d#>array['contracts',uid]);
 end if;
 nd:=learnpath_backend.assign(d,p,val);
 if root='posts' and array_length(p,1)=4 and p[3]='comments' and p_operation='set' then
  it:=d#>>array['posts',p[2],'uid'];
  if it is not null and it<>uid then
   nd:=learnpath_backend.assign(nd,array['notifications',it,gen_random_uuid()::text],jsonb_build_object('type','comment','postId',p[2],'commentId',p[4],'message',coalesce(val->>'from','Someone')||' commented on your work!','read',false,'createdAt',floor(extract(epoch from now())*1000)));
  end if;
 end if;
 insert into learnpath_backend.history select revision,auth.uid(),p_path,p_operation,data,now() from learnpath_backend.state where id=true;
 update learnpath_backend.state set data=nd,revision=revision+1 where id=true;
 return val;
end $function$
;

