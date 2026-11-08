/* A business-named variant of the existing planner, using its save/navigation bridge. */
function enableLearningSupport(){
 if(host?.supportProfile!==LearnPathSupport.profile)return;
 document.body.classList.add('lp-supported');paused=true;
 LearnPathReading.mount({variant:'frame',scope:'main',context:()=>passport?.active?(passport.view==='overview'?'Projen, hedeflerin ve adımların burada. Değiştirmek istediğin bölümde Edit düğmesini kullan.':['Üç hedeften ikisini seç. Seçimlerini değiştirebilirsin.','Yapmak istediğin adımları işaretle. En az bir adım seç; yeniden yazmana gerek yok.','İstersen hedef puanlarını belirle. Sonra pasaportunu öğretmenine gönder.'][passport.step]):['Günlük dijital yaşamından bir konu seç. İstersen kendi konunu yaz.','Hazırlamak istediğin ürün türünü seç. Başka seçenekler için Other ways bölümünü aç.','Kullanmak istediğin aracı seç. Tek bir araç yeterli olabilir.','Bugün hangi alanda destek istediğini seç.','Seçimlerini kontrol et. İstersen Edit ile değiştir, sonra planına devam et.'][state.step]});
 const motion=document.getElementById('motion');motion.hidden=true;motion.textContent='Play animation';motion.setAttribute('aria-pressed','true');
 topics.splice(0,topics.length,['care','Being kind online',''],['learning','Learning with technology',''],['balance','My screen break','']);
 tools.splice(0,tools.length,['own','Paper',''],['poster','Colours',''],['video','Tablet','']);
 PASSPORT_GOALS.splice(0,PASSPORT_GOALS.length,...LearnPathSupport.goals.map(g=>[g.id,g.text]));
 const normalChoices=choices;
 choices=function(items,value,multi=false){
  if(!passport?.active&&state.step===3&&items.length===4)return normalChoices(items.filter(x=>x[0]!=='speaking'),value,multi)+'<details><summary>I need help with speaking</summary>'+normalChoices(items.filter(x=>x[0]==='speaking'),value,multi)+'</details>';
  const html=normalChoices(items,value,multi);
  if(!passport?.active&&state.step<2)return html.replace('class="choices"','class="choices support-cards"').replace(/(<button[^>]*data-choice="(care|learning|balance)"[^>]*>)[\s\S]*?(<span><strong>)/g,(_,a,id,b)=>a+LearnPathSupport.art(({care:'kind',balance:'break'})[id]||id,esc)+b);
  return html;
 };
 const normalProducts=productColumns;
 productColumns=function(){
  const visual=groups.find(g=>g.id==='visual');
  const primary=(visual?.formats||[]).slice(0,3);
  if(!primary.length)return normalProducts();
  return '<div class="support-cards">'+primary.map(([id,label])=>'<button type="button" data-product="'+esc(id)+'" class="choice'+(state.format===id?' selected':'')+'" aria-pressed="'+(state.format===id)+'">'+LearnPathSupport.art(id,esc)+'<strong>'+esc(label)+'</strong></button>').join('')+'</div><details><summary>Other ways to share my ideas</summary>'+normalProducts()+'</details>';
 };
 const normalInitial=initialPlanTails;
 initialPlanTails=function(c){return c.goalVersion===LearnPathSupport.goalVersion?(c.planSteps||[]).map(tailOnly):normalInitial(c);};
 const normalError=sectionError;
 sectionError=function(step){
  if(step===0)return goalCount()===2?'':'Choose two of the three goals.';
  if(step===1)return passport.planTails.filter(actionExists).length>=1?'':'Choose at least one action.';
  return normalError(step);
 };
 const normalGuide=passportGuide;
 passportGuide=function(){if(passport.step===2)return normalGuide();return '<aside class="guide contract-guide"><p class="compass-speech support-helper">'+(passport.step===0?'Choose two goals. You can change your choices.':'Tick one, two or three actions. You do not need to write them again.')+'</p><div class="lp-clock paused" role="img" aria-label="Compass learning companion"></div></aside>';};
 const normalPassport=renderPassport;
 renderPassport=function(){
  normalPassport();if(passport.view==='overview')return;
  const paper=document.querySelector('.contract-paper');
  if(passport.step===0){
   paper.innerHTML='<h2>Choose two goals</h2><p>Choose two of these three goals.</p><p id="goal-count" role="status">'+goalCount()+' / 2 selected</p><div class="contract-goals">'+PASSPORT_GOALS.map(([id,text])=>'<label class="contract-goal"><input type="checkbox" data-goal="'+id+'" '+(passport.goals[id]?'checked':'')+'><span>'+esc(text)+'</span></label>').join('')+'</div>';
   paper.querySelectorAll('[data-goal]').forEach(input=>input.onchange=()=>{if(input.checked&&goalCount()>=2){input.checked=false;$('#passport-error').textContent='Choose two goals. Untick one to change it.';return;}passport.goals[input.dataset.goal]=input.checked;passport.goalsOtherText='';passport.submitted=false;$('#goal-count').textContent=goalCount()+' / 2 selected';$('#passport-error').textContent='';});
  }
  if(passport.step===1){
   const suggestions=passport.weaknessTips||GOALS[passport.weakness]||[];
   paper.innerHTML='<h2>Choose my next actions</h2><p>Tick at least one action.</p>'+suggestions.map((t,i)=>'<label class="support-plan-choice"><input type="checkbox" data-support-plan="'+i+'" '+(passport.planTails.includes(tailOnly(t))?'checked':'')+'><span>'+esc(fullStep(t))+'</span></label>').join('');
   paper.querySelectorAll('[data-support-plan]').forEach(input=>input.onchange=()=>{passport.planTails=Array.from(paper.querySelectorAll('[data-support-plan]:checked')).map(x=>tailOnly(suggestions[+x.dataset.supportPlan]));passport.submitted=false;$('#passport-error').textContent='';});
  }
 };
 const normalRender=render;
 render=function(){normalRender();if(!passport?.active){
  document.querySelectorAll('[data-product]').forEach(b=>{if(groups.find(g=>g.id==='visual')?.formats.some(f=>f[0]===b.dataset.product)){const handler=b.onclick;b.onclick=()=>{state.category='visual';handler?.();};}});
  document.querySelectorAll('.chat-context,.chat-footnote,.goals-note').forEach(el=>el.hidden=true);
  if(state.step===0){const intro=document.querySelector('.heading .intro');if(intro)intro.textContent='Choose a daily situation you know.';}
 }};
}
