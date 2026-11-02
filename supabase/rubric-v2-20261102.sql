-- EK1/EK2 versioning: do not rewrite or reinterpret any saved learner answers.
create function learnpath_backend.validate_rubric_record(p_record jsonb,p_kind text) returns void
language plpgsql immutable set search_path='' as $validate$
declare field text; version text; answers jsonb; answer jsonb;
begin
 if p_kind not in ('self','peer') then raise exception 'Invalid rubric kind';end if;
 field:=p_kind||'RubricVersion';
 if not(p_record ? field) then return;end if;
 if jsonb_typeof(p_record->field)<>'string' then raise exception 'Invalid rubric version';end if;
 version:=p_record->>field;
 if version='legacy-6x3' then return;end if;
 if version<>'grade6-20261102-v2' then raise exception 'Unknown rubric version';end if;
 answers:=p_record->(p_kind||'Rubric');
 if coalesce(jsonb_typeof(answers),'')<>'array' then raise exception 'Choose one ending in each category';end if;
 if jsonb_array_length(answers)<>5 then raise exception 'Expected five rubric answers';end if;
 for answer in select value from jsonb_array_elements(answers) loop
  if jsonb_typeof(answer)<>'number' or answer not in ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb) then raise exception 'Each answer must be Step 1 to 4';end if;
 end loop;
end $validate$;
revoke all on function learnpath_backend.validate_rubric_record(jsonb,text) from public,anon,authenticated;
do $patch$
declare definition text;
begin
 definition:=pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure);
 if md5(definition)<>'db04e719d8aac2a94ac8ad3ea5fef614' then raise exception 'Write function changed; inspect before applying';end if;
 definition:=replace(definition,$marker$ nd:=learnpath_backend.assign(d,p,val);$marker$,$hook$
 -- Versioned four-step EK1/EK2 records; older unversioned records remain valid.
 if root='posts' and p_operation<>'remove' then
  if array_length(p,1)=2 then perform learnpath_backend.validate_rubric_record(val,'self');
  elsif array_length(p,1)=4 and p[3]='comments' then perform learnpath_backend.validate_rubric_record(val,'peer');end if;
 end if;
 nd:=learnpath_backend.assign(d,p,val);$hook$);
 execute definition;
end $patch$;
CREATE OR REPLACE FUNCTION learnpath_backend.sheet_records(d jsonb)
 RETURNS TABLE(kind text, record_id text, student_id text, payload jsonb)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 select 'learning_contracts',key,key,value-'projectEval' from jsonb_each(coalesce(d->'contracts','{}'))
 union all select 'project_reflections',key,key,value->'projectEval' from jsonb_each(coalesce(d->'contracts','{}')) where value ? 'projectEval'
 union all select 'teacher_evaluations','contract/'||key,key,jsonb_build_object('teacherComment',value->'teacherComment','status',value->'status','goals',value->'goals','planSteps',value->'planSteps','evalTeacherPct',value->'evalTeacherPct','evalPeerPct',value->'evalPeerPct') from jsonb_each(coalesce(d->'contracts','{}')) where value ? 'teacherComment'
 union all select 'learning_diaries',s.key||'/'||r.key,s.key,r.value from jsonb_each(coalesce(d->'lessonReflections','{}')) s cross join lateral jsonb_each(s.value) r
 union all select 'vocabulary',key,key,value from jsonb_each(coalesce(d->'wordChecks','{}'))
 union all select 'grammar',key,key,value from jsonb_each(coalesce(d->'grammarAnswers','{}'))
 union all select 'project_posts',key,value->>'uid',value-'comments'-'likes'-'fileUrl' from jsonb_each(coalesce(d->'posts','{}'))
 union all select 'self_evaluations',key,value->>'uid',jsonb_build_object('well',value->'well','improve',value->'improve','selfRubric',value->'selfRubric','createdAt',value->'createdAt')||case when value ? 'selfRubricVersion' then jsonb_build_object('selfRubricVersion',value->'selfRubricVersion') else '{}'::jsonb end from jsonb_each(coalesce(d->'posts','{}')) where value ?| array['well','improve','selfRubric']
 union all select case when c.value->>'isTeacher'='true' then 'teacher_evaluations' else 'peer_evaluations' end,'post/'||p.key||'/'||c.key,p.value->>'uid',c.value from jsonb_each(coalesce(d->'posts','{}')) p cross join lateral jsonb_each(coalesce(p.value->'comments','{}')) c
 union all select 'other_inputs','resource/'||key,value->>'suggestedById',value from jsonb_each(coalesce(d->'resourceSuggestions','{}'))
 union all select 'other_inputs','profile/'||key,key,value-array['name','email','photo','role','enrolled','uid','lastLogin','groupId'] from jsonb_each(coalesce(d->'users','{}')) where value ?| array['chosenResources','avatarAnimal','avatarHead','avatarEyes','avatarFace','avatarId','avatarUrl','avatarColor']
 union all select 'other_inputs','like/'||p.key||'/'||l.key,l.key,jsonb_build_object('postId',p.key,'liked',l.value) from jsonb_each(coalesce(d->'posts','{}')) p cross join lateral jsonb_each(coalesce(p.value->'likes','{}')) l
$function$
;
