-- Run as database administrator in one transaction. Nothing is retained.
begin;
do $$
declare u uuid:=gen_random_uuid(); e text; c jsonb; rejected boolean;
begin
 insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
 values(u,'support-test@example.invalid',now(),'{"provider":"google"}','{}');
 insert into learnpath_backend.members(id,role,enrolled) values(u,'student',true);
 perform set_config('request.jwt.claim.sub',u::text,true);
 if public.lp_learning_support() is not null then raise exception 'Unlisted account enabled';end if;
 for e in select email from learnpath_backend.learning_support_accounts where enabled loop
  update auth.users set email=e where id=u;
  if public.lp_learning_support() is distinct from 'guided-v1' then raise exception 'Allowlisted account not enabled';end if;
 end loop;
 c:=jsonb_build_object('studentId',u,'grade',6,'goalVersion','grade6-support-goals-20261108-v1','status','draft','topic','Test only','productType','Poster','goals',jsonb_build_object('organize',true,'unitWords',true),'planSteps',jsonb_build_array('I will check my work.'));
 perform learnpath_backend.write_path('contracts/'||u,c,'set');
 perform learnpath_backend.write_path('contracts/'||u,'{"status":"pending"}','update');
 perform learnpath_backend.validate_rubric_record('{"selfRubricVersion":"grade6-support-binary-20261108-v1","selfRubric":[1,0,1,0,1]}','self');
 rejected:=false;begin
  perform learnpath_backend.validate_rubric_record('{"selfRubricVersion":"grade6-support-binary-20261108-v1","selfRubric":[2,0,1,0,1]}','self');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Out-of-scale score accepted';end if;
 update auth.users set email_confirmed_at=null where id=u;
 if public.lp_learning_support() is not null then raise exception 'Unverified account enabled';end if;
 update auth.users set email_confirmed_at=now(),raw_app_meta_data='{"provider":"email"}' where id=u;
 if public.lp_learning_support() is not null then raise exception 'Non-Google account enabled';end if;
 update auth.users set email='unlisted@example.invalid',raw_app_meta_data='{"provider":"google"}',raw_user_meta_data='{"supportProfile":"guided-v1","provider":"google"}' where id=u;
 if public.lp_learning_support() is not null then raise exception 'Metadata spoofing enabled profile';end if;
 rejected:=false;begin
  perform learnpath_backend.validate_rubric_record('{"peerRubricVersion":"grade6-support-binary-20261108-v1","peerRubric":[1,0,1,0,1]}','peer');
 exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'Standard account used supported scale';end if;
 perform learnpath_backend.write_path('contracts/'||u,'null','remove');
 c:=jsonb_set(c,'{goalVersion}','"grade6-v1"');
 perform learnpath_backend.write_path('contracts/'||u,c,'set');
 rejected:=false;begin
  perform learnpath_backend.write_path('contracts/'||u,'{"status":"pending"}','update');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Standard minimum requirements weakened';end if;
 perform learnpath_backend.validate_rubric_record('{"peerRubricVersion":"grade6-20261102-v2","peerRubric":[0,1,2,3,3]}','peer');
end $$;
select 'PASS: exact allowlist, verified Google, metadata spoof denied, own support contract 2 goals/1 step, standard minimums, immutable scales' as verification;
rollback;
