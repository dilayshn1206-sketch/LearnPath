/* Reading preferences never grant account eligibility or translate assessment content. */
(function(){
 const key='learnpath-guided-reading-v1',sizes=new WeakMap();let observer,options,prefs={tr:false,large:false};
 const selectors='h1,h2,.lp-instruction-tr,.intro,.lp-grade-note,.lp-rubric-instruction,.lp-share-header p,.lp-peer-written h3,.passport-document-topic,.passport-product,.passport-holder strong,.passport-row dd,.lp-rubric-heading,.rub-sentence,.support-ending,.choice strong,.product-option strong,.category-button strong,.contract-goal>span,.goal-card label>span,.support-plan-choice>span,.radio:not(.support-binary)>span,.lp-word-choice>span,.lp-unit-question legend,.lp-unit-question .qo,.fl,.support-helper,.compass-speech,.lp-share-guide-copy,.lp-share-focus-item legend,.lp-focus-answer span,.lp-average-ending,.passport-project-goals li,.passport-plan-section li';
 function load(){try{const v=JSON.parse(localStorage.getItem(key));prefs={tr:v?.tr===true,large:v?.large===true};}catch{prefs={tr:false,large:false};}}
 function enlarge(){
  const scope=document.querySelector(options.scope)||document.body;
  const nodes=Array.from(scope.querySelectorAll(selectors)),unitInstruction=scope.querySelector('#word-check-list')?.previousElementSibling;if(unitInstruction)nodes.push(unitInstruction);
  nodes.forEach(el=>{
   if(el.closest('.sample,[data-reading-detail],.lp-reading-tools,svg')||el.querySelector(selectors))return;
   if(!sizes.has(el)){sizes.set(el,parseFloat(getComputedStyle(el).fontSize));el.style.setProperty('--lp-reading-base',sizes.get(el)+'px');el.dataset.lpScalable='true';}
  });
 }
 function refresh(){
  if(!options)return;
  document.body.classList.toggle('lp-reading-large',prefs.large);
  document.body.classList.toggle('show-tr',prefs.tr);
  document.querySelectorAll('[data-reading-toggle]').forEach(b=>b.setAttribute('aria-pressed',String(prefs[b.dataset.readingToggle])));
  if(!options.demo){
   let note=document.getElementById('lp-instruction-tr');
   if(!note){note=document.createElement('p');note.id='lp-instruction-tr';note.className='lp-instruction-tr';note.lang='tr';note.setAttribute('role','status');(document.querySelector(options.variant==='frame'?'main':'#mc')||document.body).prepend(note);}
   const hidden=!prefs.tr||(options.variant==='host'&&!!document.getElementById('lp-planner-frame'));
   note.hidden=hidden;const copy=options.context();if(note.textContent!==copy)note.textContent=copy;
  }
  enlarge();
 }
 function toggle(which){prefs[which]=!prefs[which];try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}refresh();}
 function mount(config){
  unmount();options=config;load();document.body.classList.add('lp-reading-enabled');
  if(config.variant!=='frame'){
   const bar=config.demo?document.querySelector('.tools'):document.createElement('nav');bar.id='lp-reading-tools';bar.classList.add('lp-reading-tools');bar.setAttribute('aria-label','Reading help');
   bar.innerHTML='<button type="button" id="tr" data-reading-toggle="tr" aria-pressed="false">Türkçe yönerge</button><button type="button" id="text-size" data-reading-toggle="large" aria-pressed="false">Yazıyı büyüt</button>';
   if(!config.demo)(document.getElementById('mc')||document.querySelector('main')).before(bar);
   bar.querySelectorAll('button').forEach(b=>b.onclick=()=>toggle(b.dataset.readingToggle));
  }
  refresh();let pending=false;
  observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refresh();});});
  observer.observe(document.querySelector(config.scope)||document.body,{childList:true,subtree:true});
 }
 function unmount(){observer?.disconnect();observer=null;options=null;document.getElementById('lp-reading-tools')?.remove();document.getElementById('lp-instruction-tr')?.remove();document.body.classList.remove('lp-reading-enabled','lp-reading-large','show-tr');}
 window.addEventListener('storage',e=>{if(e.key===key&&options){load();refresh();}});
 window.LearnPathReading={mount,unmount,refresh};
})();
