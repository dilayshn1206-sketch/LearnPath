-- Owner-requested grammar revision. Preserve all learner answer snapshots and other unit data.
begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='dilay.sahin@bayetav.k12.tr'),true);
do $revision$
declare before_data jsonb; after_data jsonb; qs jsonb; replacements jsonb := $questions$[{"q": "Ece is visiting Ali’s house for the first time. There are pet beds in every room, cat toys on the sofa, and a big bird cage next to the window. On the wall, there is a poster: “Adopt, don’t shop!”\nEce: “Wow, Ali ______ love animals!”", "options": ["mustn’t", "can’t", "doesn’t have to", "must"], "correct": 3, "feedback": ["Mustn’t means something is not allowed. Here, the pet beds, toys and cage give us clues about Ali.", "Can’t would mean it is not possible. These clues strongly suggest that Ali loves animals.", "Doesn’t have to means it is not necessary. Ece is making a conclusion from the clues, not talking about a duty.", ""]}, {"q": "At the school gate, Mert points at a tall boy with a red backpack.\nMert: “Look, Ayşe! Is that your brother?”\nAyşe: “Haha, no! I only have two sisters.”\nMert: “Oh, right. That boy ______ be her brother.”", "options": ["can’t", "must", "might", "should"], "correct": 0, "feedback": ["", "Must would mean we are sure he is her brother. Ayşe says she only has sisters, so he cannot be her brother.", "Might means it is possible. Ayşe only has sisters, so this is not possible.", "Should gives advice or an expectation. Here, Mert knows from Ayşe’s words that the boy cannot be her brother."]}]$questions$::jsonb;
begin
 select data into before_data from learnpath_backend.state where id=true for update;
 qs:=before_data#>'{unitInfo,grammarQuestions}';
 if jsonb_array_length(qs)<>5 then raise exception 'Expected five grammar questions';end if;
 qs:=jsonb_set(jsonb_set(qs,'{3}',replacements->0),'{4}',replacements->1);
 perform public.lp_write('unitInfo',jsonb_build_object('grammarQuestions',qs,'contentVersion','digital-world-grade6-20261102-v2','updatedAt',floor(extract(epoch from now())*1000)),'update');
 select data into after_data from learnpath_backend.state where id=true;
 if (after_data#>'{unitInfo,grammarQuestions,0}') is distinct from (before_data#>'{unitInfo,grammarQuestions,0}') or (after_data#>'{unitInfo,grammarQuestions,1}') is distinct from (before_data#>'{unitInfo,grammarQuestions,1}') or (after_data#>'{unitInfo,grammarQuestions,2}') is distinct from (before_data#>'{unitInfo,grammarQuestions,2}') then raise exception 'First three questions changed';end if;
 if (after_data->'unitInfo')-array['grammarQuestions','contentVersion','updatedAt'] is distinct from (before_data->'unitInfo')-array['grammarQuestions','contentVersion','updatedAt'] then raise exception 'Other unit fields changed';end if;
 if (after_data-'unitInfo') is distinct from (before_data-'unitInfo') then raise exception 'Learner data changed';end if;
end $revision$;
commit;
