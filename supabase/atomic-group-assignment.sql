-- Assignments are transactional; old membership and new membership commit together.
create or replace function public.lp_assign_group(p_student text,p_group text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 d jsonb; student jsonb; target jsonb; old_group text; new_group text:=nullif(p_group,''); label text;
begin
 if learnpath_backend.actor_role()<>'teacher' then raise exception 'Teacher access required' using errcode='42501'; end if;
 if nullif(p_student,'') is null or p_student like '%/%' or p_student like '%..%' then raise exception 'Invalid student'; end if;
 if new_group is not null and (new_group like '%/%' or new_group like '%..%') then raise exception 'Invalid group'; end if;
 select data into d from learnpath_backend.state where id=true for update;
 student:=d#>array['users',p_student];
 if student is null or student->>'role'<>'student' or student->>'enrolled'='false' then raise exception 'Student is unavailable'; end if;
 if new_group is not null then
  target:=d#>array['groups',new_group];
  if target is null then raise exception 'Group is unavailable'; end if;
 end if;
 old_group:=nullif(student->>'groupId','');
 label:=coalesce(target->>'name','');
 if old_group is not distinct from new_group then
  return jsonb_build_object('groupId',new_group,'groupName',label);
 end if;
 if old_group is not null and d#>array['groups',old_group] is not null then
  perform learnpath_backend.write_path('groups/'||old_group||'/members/'||p_student,null,'remove');
 end if;
 perform learnpath_backend.write_path('users/'||p_student,jsonb_build_object('groupId',new_group,'groupName',case when new_group is null then null else label end),'update');
 if new_group is not null then
  perform learnpath_backend.write_path('groups/'||new_group||'/members/'||p_student,to_jsonb(coalesce(student->>'name','Student')),'set');
  if d#>>array['contracts',p_student,'status']='awaiting_grouping' then
   perform learnpath_backend.write_path('contracts/'||p_student,jsonb_build_object('status','draft','editUnlocked',true),'update');
  end if;
 end if;
 return jsonb_build_object('groupId',new_group,'groupName',label);
end $$;
revoke all on function public.lp_assign_group(text,text) from public,anon;
grant execute on function public.lp_assign_group(text,text) to authenticated;
