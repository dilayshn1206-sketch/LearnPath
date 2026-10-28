/* Presentation adapter. Authentication and all writes belong to the host app. */
let host=null,requestId=0;
const waiting=new Map();
function request(action,payload){return new Promise((resolve,reject)=>{
 const id=++requestId,timer=setTimeout(()=>{waiting.delete(id);reject(new Error('The connection timed out. Try again.'));},20000);
 waiting.set(id,{resolve,reject,timer});parent.postMessage({learnpathPlanner:true,id,action,payload},location.origin);
});}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||!event.data?.learnpathPlanner)return;
 const item=waiting.get(event.data.id);if(!item)return;clearTimeout(item.timer);waiting.delete(event.data.id);
 event.data.error?item.reject(new Error(event.data.error)):item.resolve(event.data.value);
});
function patch(){return {topic:passport.topic,goals:{...passport.goals},goalsOtherText:passport.goalsOtherText,planSteps:passport.planTails.map(fullStep),evalTeacherPct:passport.evalTeacherPct,evalPeerPct:passport.evalPeerPct};}
function saveError(error){$('#save-status').textContent='Not saved: '+error.message;$('#save-status').style.color='var(--c)';}
const draftRender=render;
render=function(){
 draftRender();
 if(passport?.active&&passport.step===2&&!passport.returnToOverview)$('#passport-next')?.classList.add('send-teacher');
 if(!passport?.active&&state.step===4&&$('#next'))$('#next').textContent='Save my project idea';
 document.querySelectorAll('.demo-label').forEach(el=>el.textContent='Guided help · prepared replies');
 document.querySelectorAll('.chat-footnote').forEach(el=>el.textContent='Your compass offers prepared guidance. Your chat messages are not saved.');
 document.querySelectorAll('.contract-guide .hint').forEach(el=>el.textContent='Your teacher will review your Learning Passport.');
 document.querySelectorAll('.reminder-explainer').forEach(el=>el.textContent='Use the My Learning Passport tab on LearnPath to return to your plan.');
 if(passport?.view==='overview'){
  $('.passport-overview-title .eyebrow').textContent=passport.submitted?(host.contract.status==='approved'?'Approved':'Waiting for teacher approval'):'My saved draft';
  $('.passport-notice').textContent=passport.submitted?'Your Learning Passport has been saved. '+(host.contract.status==='approved'?'Your teacher has approved it.':'Your teacher can now review it.'):'Your Learning Passport draft is saved automatically. Review your goals, plan and scores below.';
  $('#overview-back-to-idea').textContent='Back to Home';$('#overview-back-to-idea').onclick=()=>request('home').catch(saveError);
  if(host.readOnly){document.querySelectorAll('[data-passport-edit],#edit-passport').forEach(el=>el.remove());}
  else{
   const send=document.createElement('button');send.type='button';send.id='overview-send';send.className='primary send-teacher';send.textContent='Save and send to the teacher';$('.overview-actions').appendChild(send);
   const project=$('.passport-overview-card');project.insertAdjacentHTML('beforeend',field('saved-topic','My topic','Make your topic more specific if you need to.'));$('#saved-topic').value=passport.topic;$('#saved-topic').oninput=e=>{passport.topic=e.target.value;passport.submitted=false;};
  }
 }
 if(passport?.active){const back=$('#back-to-idea');if(back){back.textContent='← My complete Learning Passport';back.onclick=showOverview;}}
 reportHeight();
};
const originalNext=next;
next=async function(){
 if(state.step!==4)return originalNext();
 const b=$('#next');b.disabled=true;b.textContent='Saving my idea…';
 try{await request('idea',contractDraft());}catch(error){saveError(error);b.disabled=false;b.textContent='Save my project idea';}
};
document.addEventListener('click',async event=>{
 const b=event.target.closest('#passport-next,#overview-send');
 if(!b||(b.id!=='overview-send'&&(passport?.step!==2||passport.returnToOverview)))return;
 event.preventDefault();event.stopImmediatePropagation();
 const error=!passport.topic.trim()?'Write your project topic.':allErrors();if(error){($('#passport-error')||$('#save-status')).textContent=error;return;}
 b.disabled=true;b.textContent='Saving and sending…';
 try{host.contract=await request('submit',patch());host.readOnly=true;passport.submitted=true;showOverview();$('#save-status').textContent='Saved and sent to your teacher.';}
 catch(e){saveError(e);b.disabled=false;b.textContent='Save and send to the teacher';}
},true);
let lastPatch='';
function scheduleSave(){queueMicrotask(()=>{
 if(!host||host.readOnly||!passport?.active||passport.submitted)return;
 const value=patch(),serialized=JSON.stringify(value);if(serialized===lastPatch)return;lastPatch=serialized;
 request('draft',value).then(()=>{$('#save-status').textContent='Draft saved';$('#save-status').style.color='var(--tm)';}).catch(e=>{lastPatch='';saveError(e);});
});}
document.addEventListener('input',scheduleSave);document.addEventListener('change',scheduleSave);document.addEventListener('click',scheduleSave);
let lastHeight=0;
function reportHeight(){requestAnimationFrame(()=>{const h=Math.ceil(document.body.getBoundingClientRect().height);if(h!==lastHeight){lastHeight=h;parent.postMessage({learnpathPlanner:true,action:'height',payload:h},location.origin);}});}
new ResizeObserver(reportHeight).observe(document.body);
(async()=>{
 try{
  host=await request('load');
  // Keep teacher-added or renamed formats alongside the twelve approved formats.
  for(const category of groups){for(const item of host.extraProducts[category.id]||[]){const exists=category.formats.find(f=>f[0]===item.id);if(exists)exists[1]=item.name;else{const format=[item.id,item.name,'A project format from your teacher.'];category.formats.push(format);formats.push(format);}}}
  if(host.mode==='passport'){
   const c=host.contract;
   state={...state,step:4,topic:'own',topicOwn:c.topic,category:c.category,format:'own',formatOwn:c.productType,tools:c.platforms||['unsure'],toolOwn:c.platformsOtherText||'',weakness:c.weakness||'ideas',saved:true};
   passport={...c,focusGoals:c.weaknessTips||[],tools:c.platforms||[],toolOther:c.platformsOtherText||'',goals:c.goals||{},goalsOtherText:c.goalsOtherText||'',planTails:(c.planSteps?.length?c.planSteps:['','','']).map(tailOnly),evalTeacherPct:c.evalTeacherPct??'',evalPeerPct:c.evalPeerPct??'',step:0,active:true,view:host.overview||host.readOnly?'overview':'edit',returnToOverview:false,submitted:host.readOnly};
   lastPatch=JSON.stringify(patch());
  }
  render();if(host.mode==='idea'&&$('#next'))$('#next').textContent='Continue →';
 }catch(error){$('#screen').innerHTML='<h1>Could not open your plan</h1><p>'+esc(error.message)+'</p>';}
})();
