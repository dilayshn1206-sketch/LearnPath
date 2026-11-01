-- Preserve actor checks, ACL, search_path and every existing record.
do $patch$
declare original text; updated text;
begin
 original:=pg_get_functiondef('learnpath_backend.write_path(text,jsonb,text)'::regprocedure);
 if position('''postId'',p[2],''commentId'',p[4]' in original)>0 then return; end if;
 if md5(original)<>'ee5a33ff5f6a62d3b2d7cf51b460ab61' then raise exception 'write_path changed; review before applying'; end if;
 updated:=replace(original, 'jsonb_build_object(''type'',''comment'',''message''', 'jsonb_build_object(''type'',''comment'',''postId'',p[2],''commentId'',p[4],''message''');
 if updated=original then raise exception 'Notification producer not found'; end if;
 execute updated;
end $patch$;

