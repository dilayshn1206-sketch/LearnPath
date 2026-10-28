-- Additive change: append-only export queue. No records or previous history removed.
create table learnpath_backend.sheet_events (
 id bigint generated always as identity primary key,
 revision bigint not null,
 kind text not null,
 record_id text not null,
 student_id text,
 student_name text,
 actor uuid,
 operation text not null,
 payload jsonb,
 unit_context jsonb,
 recorded_at timestamptz not null default now(),
 unique(revision,kind,record_id)
);
create table learnpath_backend.sheet_connector (
 id boolean primary key default true check(id),
 token_hash text not null,
 enabled boolean not null default true,
 owner_email text not null check(owner_email='dilayshn1206@gmail.com'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '1 year'),
 last_read_at timestamptz,
 last_ack_at timestamptz,
 acknowledged_id bigint not null default 0,
 files jsonb not null default '{}'
);
alter table learnpath_backend.sheet_events enable row level security;
alter table learnpath_backend.sheet_connector enable row level security;
revoke all on learnpath_backend.sheet_events,learnpath_backend.sheet_connector from public,anon,authenticated;
revoke all on sequence learnpath_backend.sheet_events_id_seq from public,anon,authenticated;

-- Projection of every persisted student input and each evaluation, independent of UI callbacks.
create function learnpath_backend.sheet_records(d jsonb)
returns table(kind text,record_id text,student_id text,payload jsonb)
language sql immutable set search_path='' as $$
 select 'learning_contracts',key,key,value-'projectEval' from jsonb_each(coalesce(d->'contracts','{}'))
 union all select 'project_reflections',key,key,value->'projectEval' from jsonb_each(coalesce(d->'contracts','{}')) where value ? 'projectEval'
 union all select 'teacher_evaluations','contract/'||key,key,jsonb_build_object('teacherComment',value->'teacherComment','status',value->'status','goals',value->'goals','planSteps',value->'planSteps','evalTeacherPct',value->'evalTeacherPct','evalPeerPct',value->'evalPeerPct') from jsonb_each(coalesce(d->'contracts','{}')) where value ? 'teacherComment'
 union all select 'learning_diaries',s.key||'/'||r.key,s.key,r.value from jsonb_each(coalesce(d->'lessonReflections','{}')) s cross join lateral jsonb_each(s.value) r
 union all select 'vocabulary',key,key,value from jsonb_each(coalesce(d->'wordChecks','{}'))
 union all select 'grammar',key,key,value from jsonb_each(coalesce(d->'grammarAnswers','{}'))
 union all select 'project_posts',key,value->>'uid',value-'comments'-'likes'-'fileUrl' from jsonb_each(coalesce(d->'posts','{}'))
 union all select 'self_evaluations',key,value->>'uid',jsonb_build_object('well',value->'well','improve',value->'improve','selfRubric',value->'selfRubric','createdAt',value->'createdAt') from jsonb_each(coalesce(d->'posts','{}')) where value ?| array['well','improve','selfRubric']
 union all select case when c.value->>'isTeacher'='true' then 'teacher_evaluations' else 'peer_evaluations' end,'post/'||p.key||'/'||c.key,p.value->>'uid',c.value from jsonb_each(coalesce(d->'posts','{}')) p cross join lateral jsonb_each(coalesce(p.value->'comments','{}')) c
 union all select 'other_inputs','resource/'||key,value->>'suggestedById',value from jsonb_each(coalesce(d->'resourceSuggestions','{}'))
 union all select 'other_inputs','profile/'||key,key,value-array['name','email','photo','role','enrolled','uid','lastLogin','groupId'] from jsonb_each(coalesce(d->'users','{}')) where value ?| array['chosenResources','avatarAnimal','avatarHead','avatarEyes','avatarFace','avatarId','avatarUrl','avatarColor']
 union all select 'other_inputs','like/'||p.key||'/'||l.key,l.key,jsonb_build_object('postId',p.key,'liked',l.value) from jsonb_each(coalesce(d->'posts','{}')) p cross join lateral jsonb_each(coalesce(p.value->'likes','{}')) l
$$;
revoke all on function learnpath_backend.sheet_records(jsonb) from public,anon,authenticated;

create function learnpath_backend.capture_sheet_events() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into learnpath_backend.sheet_events(revision,kind,record_id,student_id,student_name,actor,operation,payload,unit_context)
 select new.revision,coalesce(n.kind,o.kind),coalesce(n.record_id,o.record_id),coalesce(n.student_id,o.student_id),
 coalesce(new.data#>>array['users',coalesce(n.student_id,o.student_id),'name'],old.data#>>array['users',coalesce(n.student_id,o.student_id),'name']),auth.uid(),
 case when n.record_id is null then 'remove' when o.record_id is null then 'insert' else 'update' end,
 coalesce(n.payload,o.payload),jsonb_build_object('contentVersion',new.data#>'{unitInfo,contentVersion}','words',new.data#>'{unitInfo,words}','grammarQuestions',new.data#>'{unitInfo,grammarQuestions}')
 from learnpath_backend.sheet_records(old.data) o full join learnpath_backend.sheet_records(new.data) n using(kind,record_id)
 where n.payload is distinct from o.payload;
 return new;
end $$;
revoke all on function learnpath_backend.capture_sheet_events() from public,anon,authenticated;
create trigger lp_capture_sheets after update of data on learnpath_backend.state for each row execute function learnpath_backend.capture_sheet_events();

-- Current active records are queued once as a baseline. Firebase records remain untouched.
insert into learnpath_backend.sheet_events(revision,kind,record_id,student_id,student_name,operation,payload,unit_context)
select s.revision,r.kind,r.record_id,r.student_id,s.data#>>array['users',r.student_id,'name'],'baseline',r.payload,s.data->'unitInfo'
from learnpath_backend.state s cross join lateral learnpath_backend.sheet_records(s.data) r;

-- A read-only, revocable connector capability, never a Supabase service-role credential.
-- No connector is enabled until the teacher deliberately generates a key.
create function learnpath_backend.sheet_key(p_action text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if learnpath_backend.actor_role()<>'teacher' then raise exception 'Teacher access required' using errcode='42501'; end if;
 if p_action='create' then
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into learnpath_backend.sheet_connector(id,token_hash,owner_email) values(true,encode(sha256(convert_to(token,'UTF8')),'hex'),'dilayshn1206@gmail.com')
  on conflict(id) do update set token_hash=excluded.token_hash,enabled=true,created_at=now(),expires_at=now()+interval '1 year';
  return jsonb_build_object('key',token,'ownerEmail','dilayshn1206@gmail.com');
 elsif p_action='disable' then update learnpath_backend.sheet_connector set enabled=false where id=true; return '{"enabled":false}';
 elsif p_action<>'status' then raise exception 'Invalid action'; end if;
 return jsonb_build_object('events',(select count(*) from learnpath_backend.sheet_events),'connector',(select to_jsonb(c)-'token_hash' from learnpath_backend.sheet_connector c where id=true));
end $$;
create function learnpath_backend.sheet_export(p_token text,p_after bigint,p_limit integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p_token is null or length(p_token)<>64 or not exists(select 1 from learnpath_backend.sheet_connector where id=true and enabled and expires_at>now() and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')) then raise exception 'Invalid export key' using errcode='42501'; end if;
 if p_after<0 or p_after is null then raise exception 'Invalid cursor'; end if;
 select coalesce(jsonb_agg(to_jsonb(e) order by id),'[]') into result from (select * from learnpath_backend.sheet_events where id>p_after order by id limit greatest(1,least(coalesce(p_limit,25),25))) e;
 update learnpath_backend.sheet_connector set last_read_at=now() where id=true;
 return result;
end $$;
create function learnpath_backend.sheet_ack(p_token text,p_cursor bigint,p_files jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_token is null or length(p_token)<>64 or not exists(select 1 from learnpath_backend.sheet_connector where id=true and enabled and expires_at>now() and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')) then raise exception 'Invalid export key' using errcode='42501'; end if;
 if p_cursor<0 or p_cursor is null or p_cursor>coalesce((select max(id) from learnpath_backend.sheet_events),0) or jsonb_typeof(p_files)<>'object' or octet_length(p_files::text)>16000 then raise exception 'Invalid acknowledgement'; end if;
 update learnpath_backend.sheet_connector set last_ack_at=now(),acknowledged_id=greatest(acknowledged_id,p_cursor),files=p_files where id=true;
end $$;
revoke all on function learnpath_backend.sheet_key(text),learnpath_backend.sheet_export(text,bigint,integer),learnpath_backend.sheet_ack(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function learnpath_backend.sheet_key(text) to authenticated;
-- Schema usage alone grants no table/function access. Only these capability checks are reachable anonymously.
grant usage on schema learnpath_backend to anon;
grant execute on function learnpath_backend.sheet_export(text,bigint,integer),learnpath_backend.sheet_ack(text,bigint,jsonb) to anon,authenticated;
create function public.lp_sheet_key(p_action text default 'status') returns jsonb language sql security invoker set search_path='' as $$select learnpath_backend.sheet_key(p_action)$$;
create function public.lp_sheet_export(p_token text,p_after bigint default 0,p_limit integer default 25) returns jsonb language sql security invoker set search_path='' as $$select learnpath_backend.sheet_export(p_token,p_after,p_limit)$$;
create function public.lp_sheet_ack(p_token text,p_cursor bigint,p_files jsonb) returns void language sql security invoker set search_path='' as $$select learnpath_backend.sheet_ack(p_token,p_cursor,p_files)$$;
revoke all on function public.lp_sheet_key(text),public.lp_sheet_export(text,bigint,integer),public.lp_sheet_ack(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.lp_sheet_key(text) to authenticated;
grant execute on function public.lp_sheet_export(text,bigint,integer),public.lp_sheet_ack(text,bigint,jsonb) to anon,authenticated;
