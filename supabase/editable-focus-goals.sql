-- Allow owners to revise the three prefilled focus goals; preserve old records.
do $patch$
declare original text; updated text;
begin
 original:=pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure);
 if position('Check your three focus goals' in original)>0 then return;end if;
 if md5(original)<>'677134920eee0d872452eb3ffe533792' then raise exception 'write_path changed; review before applying';end if;
 updated:=replace(original,'''goalsOtherText'',''evalTeacherPct''','''goalsOtherText'',''weaknessTips'',''evalTeacherPct''');
 updated:=replace(updated,'c:=old;', $validation$c:=old;
  if p_value ? 'weaknessTips' then
   if jsonb_typeof(p_value->'weaknessTips')<>'array' then raise exception 'Check your three focus goals';end if;
   if jsonb_array_length(p_value->'weaknessTips')<>3 or exists(select 1 from jsonb_array_elements(p_value->'weaknessTips') x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>500) then raise exception 'Check your three focus goals';end if;
   if p_value->>'status'='pending' and exists(select 1 from jsonb_array_elements_text(p_value->'weaknessTips') x where nullif(trim(x),'') is null) then raise exception 'Complete each focus goal';end if;
  end if;$validation$);
 if updated=original then raise exception 'Focus edit path not found';end if;
 execute updated;
end $patch$;

-- Validate the merged record too when an older client sends status only.
do $patch$
declare original text; updated text;
begin
 original:=pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure);
 if position('Focus goals cannot be empty when submitted' in original)>0 then return;end if;
 if md5(original)<>'ebb90f2d65870256ef418f806f143cdf' then raise exception 'write_path changed; review before applying';end if;
 updated:=replace(original, 'if p_value->>''status''=''pending'' then', $guard$if p_value->>'status'='pending' then
     if val ? 'weaknessTips' and exists(select 1 from jsonb_array_elements_text(val->'weaknessTips') x where nullif(trim(x),'') is null) then raise exception 'Focus goals cannot be empty when submitted';end if;$guard$);
 if updated=original then raise exception 'Submit validation path not found';end if;
 execute updated;
end $patch$;

