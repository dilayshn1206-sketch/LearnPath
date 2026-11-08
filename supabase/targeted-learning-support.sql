-- No learner identities belong in this public migration. Provision the private
-- allowlist separately. Existing state, contracts and rubric versions are retained.
create table if not exists learnpath_backend.learning_support_accounts (
 email text primary key check (email=lower(btrim(email))),
 enabled boolean not null default true
);
alter table learnpath_backend.learning_support_accounts enable row level security;
revoke all on learnpath_backend.learning_support_accounts from public,anon,authenticated;

create or replace function learnpath_backend.learning_support_profile()
returns text language sql stable security definer set search_path='' as $$
 select 'guided-v1'::text from auth.users u
 join learnpath_backend.learning_support_accounts a on a.email=lower(u.email) and a.enabled
 join learnpath_backend.members m on m.id=u.id and m.role='student'
 where u.id=auth.uid() and u.email_confirmed_at is not null
 and u.raw_app_meta_data->>'provider'='google';
$$;
revoke all on function learnpath_backend.learning_support_profile() from public,anon,authenticated;
grant execute on function learnpath_backend.learning_support_profile() to authenticated;
create or replace function public.lp_learning_support()
returns text language sql stable security invoker set search_path='' as $$
 select learnpath_backend.learning_support_profile();
$$;
revoke all on function public.lp_learning_support() from public,anon;
grant execute on function public.lp_learning_support() to authenticated;

create or replace function learnpath_backend.validate_support_contract(v jsonb)
returns void language plpgsql immutable set search_path='' as $$
begin
 if jsonb_typeof(v->'goals')<>'object' then raise exception 'Choose two goals';end if;
 if (select count(*) from jsonb_each(v->'goals') where value='true'::jsonb and key in ('organize','evidence','unitWords'))<>2
 or exists(select 1 from jsonb_each(v->'goals') where key not in ('organize','evidence','unitWords') and value='true'::jsonb)
 or nullif(btrim(v->>'goalsOtherText'),'') is not null then raise exception 'Choose two of the three goals';end if;
 if nullif(btrim(v->>'topic'),'') is null or jsonb_typeof(v->'planSteps')<>'array' then raise exception 'Choose your topic and actions';end if;
 if jsonb_array_length(v->'planSteps')<1 or jsonb_array_length(v->'planSteps')>3
 or exists(select 1 from jsonb_array_elements_text(v->'planSteps') s where nullif(btrim(s),'') is null)
 then raise exception 'Choose at least one action';end if;
end $$;
revoke all on function learnpath_backend.validate_support_contract(jsonb) from public,anon,authenticated;

-- Patch the current function in place, with guards against an unexpected base.
do $patch$
declare f text; original text;
begin
 select pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure) into f;
 original:=f;
 f:=replace(f,$r$val->>'goalVersion'='grade6-v1'$r$, $r$(val->>'goalVersion'='grade6-v1' or (val->>'goalVersion'='grade6-support-goals-20261108-v1' and learnpath_backend.learning_support_profile()='guided-v1'))$r$);
 f:=replace(f,$r$if p_value->>'status'='pending' then$r$, $r$if p_value->>'status'='pending' then
     if val->>'goalVersion'='grade6-support-goals-20261108-v1' then
      if learnpath_backend.learning_support_profile() is distinct from 'guided-v1' then raise exception 'Support profile not available' using errcode='42501';end if;
      perform learnpath_backend.validate_support_contract(val);
     else$r$);
 f:=replace(f,$r$elsif p_value ?| array['topic','planSteps','goals','goalsOtherText','weaknessTips','evalTeacherPct','evalPeerPct'] then$r$, $r$end if;
    elsif p_value ?| array['topic','planSteps','goals','goalsOtherText','weaknessTips','evalTeacherPct','evalPeerPct'] then$r$);
 if f=original or position('perform learnpath_backend.validate_support_contract(val)' in f)=0 then raise exception 'Unexpected write_path baseline';end if;
 execute f;
end $patch$;

create or replace function learnpath_backend.validate_rubric_record(p_record jsonb,p_kind text)
returns void language plpgsql stable security definer set search_path='' as $$
declare version text; answers jsonb; answer jsonb; supported boolean;
begin
 if p_kind not in ('self','peer') then raise exception 'Invalid rubric kind';end if;
 if not(p_record ? (p_kind||'RubricVersion')) then return;end if;
 version:=p_record->>(p_kind||'RubricVersion');
 if version='legacy-6x3' then return;end if;
 supported:=version='grade6-support-binary-20261108-v1';
 if supported then
  if learnpath_backend.learning_support_profile() is distinct from 'guided-v1' and learnpath_backend.actor_role()<>'teacher' then raise exception 'Support profile not available' using errcode='42501';end if;
 elsif version is distinct from 'grade6-20261102-v2' then raise exception 'Unknown rubric version';end if;
 answers:=p_record->(p_kind||'Rubric');
 if coalesce(jsonb_typeof(answers),'')<>'array' then raise exception 'Choose one answer in each category';end if;
 if jsonb_array_length(answers)<>5 then raise exception 'Expected five rubric answers';end if;
 for answer in select value from jsonb_array_elements(answers) loop
  if jsonb_typeof(answer)<>'number' or (supported and answer not in ('0'::jsonb,'1'::jsonb))
  or (not supported and answer not in ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb)) then raise exception 'Invalid rubric answer';end if;
 end loop;
end $$;
revoke all on function learnpath_backend.validate_rubric_record(jsonb,text) from public,anon,authenticated;
notify pgrst,'reload schema';
