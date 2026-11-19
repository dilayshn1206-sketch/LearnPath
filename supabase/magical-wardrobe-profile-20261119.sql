CREATE OR REPLACE FUNCTION learnpath_backend.read_path(p_path text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r text:=learnpath_backend.actor_role(); d jsonb; p text[]; root text; k text; v jsonb; filtered jsonb:='{}';
begin
 p:=string_to_array(trim(both '/' from p_path),'/'); root:=p[1];
 select data into d from learnpath_backend.state where id=true;
 if r='teacher' then return d#>p; end if;
 if root in ('unitInfo','ideaCatalog','resources','liveSession','posts') then return d#>p; end if;
 if root='users' then
  for k,v in select key,value from jsonb_each(coalesce(d->root,'{}')) loop
   if k=auth.uid()::text then filtered:=filtered||jsonb_build_object(k,v);
   else filtered:=filtered||jsonb_build_object(k,jsonb_build_object('uid',k,'name',v->'name','photo',v->'photo','avatarAnimal',v->'avatarAnimal','avatarHead',v->'avatarHead','avatarEyes',v->'avatarEyes','avatarFace',v->'avatarFace','avatarOutfit',v->'avatarOutfit','avatarItem',v->'avatarItem')); end if;
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
end $function$
;
