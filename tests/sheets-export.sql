-- Every fixture is rolled back; this never sends real student records to Google.
begin;
do $$declare d jsonb; n integer;begin
 d:='{"contracts":{"s":{"topic":"Topic","projectEval":{"satisfied":2},"teacherComment":"Good"}},"lessonReflections":{"s":{"r":{"learned":"Word"}}},"wordChecks":{"s":{"checked":[true]}},"grammarAnswers":{"s":{"answers":{"0":2}}},"posts":{"p":{"uid":"s","well":"Well","selfRubric":[0,1,2],"comments":{"peer":{"fromId":"p","well":"Peer"},"teacher":{"isTeacher":true,"well":"Teacher"}}}},"resourceSuggestions":{"r":{"suggestedById":"s","url":"https://example.test"}}}';
 select count(distinct kind) into n from learnpath_backend.sheet_records(d);
 if n<>10 then raise exception 'Expected all 10 export kinds, got %',n;end if;
 update learnpath_backend.state set data=data||d,revision=revision+1 where id=true;
 if not exists(select 1 from learnpath_backend.sheet_events where kind='peer_evaluations' and record_id='post/p/peer' and student_id='s') then raise exception 'Peer target lost';end if;
 if not exists(select 1 from learnpath_backend.sheet_events where kind='teacher_evaluations' and record_id='post/p/teacher') then raise exception 'Teacher evaluation lost';end if;
 select count(*) into n from learnpath_backend.sheet_events;
 update learnpath_backend.state set data=data,revision=revision+1 where id=true;
 if n<>(select count(*) from learnpath_backend.sheet_events) then raise exception 'No-op write duplicated export';end if;
 update learnpath_backend.state set data=learnpath_backend.assign(data,array['grammarAnswers','s'],'{"answers":{"0":1}}'),revision=revision+1 where id=true;
 update learnpath_backend.state set data=learnpath_backend.assign(data,array['grammarAnswers','s'],'null'),revision=revision+1 where id=true;
 if not exists(select 1 from learnpath_backend.sheet_events where kind='grammar' and student_id='s' and operation='remove' and payload#>>'{answers,0}'='1') then raise exception 'Deleted answer not retained';end if;
 if has_table_privilege('authenticated','learnpath_backend.sheet_events','select') or has_table_privilege('anon','learnpath_backend.sheet_connector','select') then raise exception 'Raw archive exposed';end if;
end$$;
-- A fixed synthetic capability exists only inside this rolled-back transaction.
insert into learnpath_backend.sheet_connector(id,token_hash,owner_email) values(true,encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),'dilayshn1206@gmail.com')
on conflict(id) do update set token_hash=excluded.token_hash,enabled=true,expires_at=now()+interval '1 day';
set local role anon;
do $$declare result jsonb;begin
 begin perform public.lp_sheet_export('wrong',0,25);raise exception 'Invalid key accepted';exception when insufficient_privilege then null;end;
 begin perform public.lp_sheet_key('create');raise exception 'Anon created key';exception when insufficient_privilege then null;end;
 result:=public.lp_sheet_export(repeat('a',64),0,2);
 if jsonb_array_length(result)<>2 then raise exception 'Pagination limit failed';end if;
 if (result->0->>'id')::bigint >= (result->1->>'id')::bigint then raise exception 'Cursor ordering failed';end if;
 perform public.lp_sheet_ack(repeat('a',64),(result->1->>'id')::bigint,'{}');
end$$;
reset role;
update learnpath_backend.sheet_connector set enabled=false where id=true;
set local role anon;
do $$begin
 begin perform public.lp_sheet_export(repeat('a',64),0,25);raise exception 'Revoked key accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: export categories, immutable versions, deletion retention, no-op deduplication, access control, cursor and key revocation' as result;
