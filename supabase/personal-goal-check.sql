-- Restrict the new formal goal-review field to the existing teacher branch.
-- Patch only this condition; preserve the deployed function and its privileges.
do $migration$
declare fn oid; definition text; before_body text;
 needle text := $needle$coalesce(val->>'isTeacher','false')='false' and not exists$needle$;
 replacement text := $replacement$coalesce(val->>'isTeacher','false')='false' and not(val ? 'personalGoalReview') and not exists$replacement$;
begin
 select p.oid,p.prosrc into fn,before_body from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='learnpath_backend' and p.proname='write_path';
 if position(replacement in before_body)>0 then return; end if;
 if md5(before_body)<>'b98ee6d2100182c2c86beec5c7734e46' then raise exception 'write_path changed; review current function before applying'; end if;
 definition:=pg_get_functiondef(fn);
 if position(needle in definition)=0 then raise exception 'Expected comment authorization condition missing'; end if;
 definition:=replace(definition,needle,replacement);
 execute definition;
end
$migration$;
