-- Difficulty tips prefill plan actions; they are not extra submission goals.
do $patch$
declare original text; updated text;
begin
 original:=pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure);
 if position('Difficulty tips are planning suggestions' in original)>0 then return;end if;
 if md5(original)<>'470c66166882dba5720383ae725bcda2' then raise exception 'write_path changed; review before applying';end if;
 updated:=replace(original,$old$if p_value->>'status'='pending' and exists(select 1 from jsonb_array_elements_text(p_value->'weaknessTips') x where nullif(trim(x),'') is null) then raise exception 'Complete each focus goal';end if;$old$,'');
 updated:=replace(updated,$old$if val ? 'weaknessTips' and exists(select 1 from jsonb_array_elements_text(val->'weaknessTips') x where nullif(trim(x),'') is null) then raise exception 'Focus goals cannot be empty when submitted';end if;$old$,'');
 if updated=original then raise exception 'Obsolete focus submission checks not found';end if;
 updated:=replace(updated,'c:=old;','c:=old; -- Difficulty tips are planning suggestions, not extra goals.');
 execute updated;
end $patch$;

