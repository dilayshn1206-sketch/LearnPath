/* Presentation only: existing lesson/project callbacks own all saved records. */
(function(){
 const drafts=new Map();
 function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
 function mount(card,config){
  const key=config.kind+':'+config.sessionKey,lesson=config.kind==='lesson',state=drafts.get(key)||{index:0,fields:{}};drafts.set(key,state);
  const panels=[],oldSubmit=card.querySelector(':scope > button:last-child');if(!oldSubmit)return;
  card.querySelectorAll('input[id],textarea[id]').forEach(input=>{if(Object.hasOwn(state.fields,input.id))input.value=state.fields[input.id];input.addEventListener('input',()=>{state.fields[input.id]=input.value;});});
  if(lesson){card.querySelectorAll(':scope > .fg').forEach(field=>{if(!field.querySelector(':disabled'))panels.push(field);});}
  else card.querySelectorAll(':scope > .eval2-item').forEach(item=>{if(item.querySelector('.qo'))Array.from(item.children).slice(1).forEach(question=>{question.classList.add('eval2-item');panels.push(question);});else panels.push(item);});
  if(!panels.length)return;
  card.classList.add('lp-reflection-journey');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','reflection-title');
  const header=element('header','lp-reflection-header');header.append(element('p','lp-eyebrow',lesson?'Look back · Today’s learning':'Look back · Your project'));
  const title=element('h2','',lesson?'My lesson reflection':'My project reflection');title.id='reflection-title';header.append(title,element('p','lp-reflection-meta',config.name+' · '+config.date));
  const progress=element('progress');progress.max=panels.length;progress.setAttribute('aria-label','Reflection progress');const counter=element('p','lp-reflection-counter');header.append(counter,progress);const tools=document.getElementById('lp-reading-tools');if(tools)header.append(tools);
  const body=element('div','lp-reflection-body'),main=element('section','lp-reflection-main'),guide=element('aside','lp-reflection-guide');
  guide.innerHTML=LearnPathUI.mascot();const guideText=element('p','lp-reflection-instruction');guide.append(guideText);const translation=element('p','lp-reflection-tr');translation.lang='tr';guide.append(translation);
  panels.forEach((panel,i)=>{panel.dataset.reflectionPanel=i;panel.classList.add('lp-reflection-question');panel.querySelectorAll('label').forEach(label=>{const input=label.parentElement.querySelector('input[id],textarea[id]');if(input)label.htmlFor=input.id;});main.append(panel);});
  const error=element('p','lp-reflection-error');error.setAttribute('role','alert');main.append(error);body.append(main,guide);
  const footer=element('footer','lp-reflection-footer'),back=element('button','btn bts','Back'),next=element('button','btn btp','Next →');back.type=next.type='button';oldSubmit.textContent='Send my reflection';oldSubmit.className='btn btp';oldSubmit.type='button';footer.append(back,next,oldSubmit);card.replaceChildren(header,body,footer);
  let busy=false;
  function validate(index){const panel=panels[index];if(lesson){const input=panel.querySelector('textarea,input');if(input&&input.id!=='ev1-resource'&&!input.value.trim())return 'Write a few words before you continue.';}
   else if(panel.querySelector('.qo')&&!panel.querySelector('[aria-pressed="true"]'))return 'Choose one answer before you continue.';
   else if(panel.querySelector('[data-eval-score]')&&!panel.querySelector('[data-eval-score][aria-pressed="true"]'))return 'Choose No, Maybe or Yes before you continue.';
   return '';}
  function show(focus){state.index=Math.max(0,Math.min(state.index,panels.length-1));panels.forEach((p,i)=>p.hidden=i!==state.index);back.disabled=busy||state.index===0;next.hidden=state.index===panels.length-1;oldSubmit.hidden=!next.hidden;counter.textContent='Question '+(state.index+1)+' of '+panels.length;progress.value=state.index+1;
   const panel=panels[state.index],words=!!panel.querySelector('[id^="e2-wc-row"]'),grammar=!!panel.querySelector('.qo');guideText.textContent=lesson?'Think about today. A short, honest answer is enough.':words?'Tick the words you know now. Leave the others blank.':grammar?'Read this question. Choose one answer.':'Look back at your own work. Choose the answer that fits.';
   translation.textContent=lesson?'Bugünü düşün. Kısa ve dürüst bir yanıt yeterli.':words?'Artık bildiğin kelimeleri işaretle. Diğerlerini boş bırak.':grammar?'Soruyu oku ve bir yanıt seç.':'Kendi çalışmana bak. Sana uyan yanıtı seç.';
   if(focus){const target=panel.querySelector('textarea,input,button');if(target)target.focus({preventScroll:true});main.scrollTop=0;}LearnPathReading.refresh();}
  back.onclick=()=>{state.index--;error.textContent='';show(true);};next.onclick=()=>{error.textContent=validate(state.index);if(error.textContent)return;state.index++;show(true);};
  oldSubmit.onclick=async()=>{if(busy)return;for(let i=0;i<panels.length;i++){const message=validate(i);if(message){state.index=i;error.textContent=message;show(true);return;}}busy=true;back.disabled=next.disabled=oldSubmit.disabled=true;error.textContent='Saving your reflection…';try{await config.submit();drafts.delete(key);}catch(e){error.textContent='Could not save. Your answers are still here. Try again.';}finally{busy=false;next.disabled=oldSubmit.disabled=false;back.disabled=state.index===0;}};
  card.onkeydown=event=>{if(event.key!=='Tab')return;const focusable=Array.from(card.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,summary,a[href]')).filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
  show(true);
 }
 function close(card){const tools=card?.querySelector('#lp-reading-tools'),mc=document.getElementById('mc');if(tools&&mc)mc.before(tools);}
 window.LearnPathReflection={mount,close};
})();
