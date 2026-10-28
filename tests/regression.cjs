/* No real Firebase calls: execute the shipped app against an isolated in-memory DB. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let JSDOM;
try { ({JSDOM}=require('jsdom')); } catch { ({JSDOM}=require('../../test-runtime/node_modules/jsdom')); }
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import[^\r\n]+;\r?\n/gm,'');
const ui=fs.readFileSync(path.join(root,'assets/learnpath-ui.js'),'utf8');
const pause=()=>new Promise(r=>setTimeout(r,10));
const catalog={written:{mini_story:{name:'Mini Story',active:true},teacher_custom:{name:'My teacher’s custom idea',active:true},hidden:{name:'Hidden',active:false}},spoken:{audio_tour:{name:'Audio Tour',active:true}},visual:{campaign_poster:{name:'Campaign Poster',active:true}}};
function fixture(contract=null){
  const dom=new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'dangerously',url:'https://example.test/LearnPath/'});
  const w=dom.window;
  const data={users:{student:{role:'student',name:'Ada Student',groupId:'g1'}},contracts:contract?{student:contract}:{},ideaCatalog:catalog,unitInfo:{title:'My daily life',words:'breakfast,school',grammarQuestions:[]},wordChecks:{student:{submittedAt:123,words:['school']}},grammarAnswers:{},resourceSuggestions:{},coinAwards:{student:{step1:true,step2:true,step3:true}},coins:{student:45},posts:{},notifications:{},research:{keep:{value:'DO NOT ALTER'}}};
  const writes=[];
  const read=p=>p.split('/').filter(Boolean).reduce((o,k)=>o?.[k],data);
  const assign=(p,v,merge=false)=>{let keys=p.split('/'),key=keys.pop(),o=data;for(const k of keys)o=o[k]??={};o[key]=merge?{...o[key],...structuredClone(v)}:structuredClone(v);writes.push(p);};
  const snap=(v,key)=>({exists:()=>v!==undefined&&v!==null,val:()=>v===undefined?null:structuredClone(v),key,forEach:fn=>Object.entries(v||{}).forEach(([k,d])=>fn(snap(d,k)))});
  Object.assign(w,{initializeApp:()=>({}),getAuth:()=>({}),getDatabase:()=>({}),getStorage:()=>({}),GoogleAuthProvider:class{},onAuthStateChanged:()=>{},signInWithPopup:async()=>{},signOut:async()=>{},ref:(_db,p)=>p,sref:(_db,p)=>p,get:async p=>snap(read(p)),set:async(p,v)=>assign(p,v),update:async(p,v)=>assign(p,v,true),push:async(p,v)=>{assign(p+'/mock-'+writes.length,v);return {key:'mock'};},remove:async p=>assign(p,null),onValue:()=>()=>{},uploadBytesResumable:()=>{},getDownloadURL:async()=>'',deleteObject:async()=>{},confirm:()=>false});
  w.eval(ui);
  w.eval('const auth={},db={},storage={}; const rpc=async()=>45;\n'+app+'\nwindow.__test={setUser:function(){CU={uid:"student",displayName:"Ada Student",email:"fake@example.test",photoURL:""};UP={role:"student"};},home:renderHome,legacyQuiz:originalStartQuiz,legacyPassport:originalRenderPassport,q2:renderQ2,goals:goalItemsFor,setContract:function(c){contractData=c;},getState:function(){return qState;},getContract:function(){return contractData;}};');
  w.__test.setUser();w.LearnPathUI.setRole('student');
  w.document.getElementById('app').style.display='flex';
  return {w,data,writes,close:()=>dom.window.close()};
}
const results=[];
function check(name,fn){fn();results.push(name);}
(async()=>{
  // Pass 1: real quiz callbacks, teacher-defined catalog, a new Grade 6 contract.
  const f=fixture();let w=f.w;
  await w.__test.home();await pause();
  check('Home keeps four actual milestone buttons',()=>assert.equal(w.document.querySelectorAll('.step-card').length,4));
  check('Map matches stored completion and grouping lock',()=>{assert.equal(w.document.querySelectorAll('.lp-station.done').length,1);assert.equal(w.document.querySelector('[data-step="2"]').disabled,true);});
  await w.__test.legacyQuiz();await pause();
  const first=w.document.querySelector('.qo');
  first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  check('Keyboard choice executes original platform handler',()=>assert.equal(w.__test.getState().platforms.length,1));
  w.qGoto(1);await pause();
  check('Teacher-defined active catalog is retained',()=>{assert.equal(w.document.querySelectorAll('[data-product-id]').length,4);assert.match(w.document.getElementById('mc').textContent,/teacher’s custom idea/);assert.doesNotMatch(w.document.getElementById('mc').textContent,/Hidden/);});
  w.document.querySelector('[data-product-id="teacher_custom"]').click();await pause();
  check('Selection state survives render and marks chosen button',()=>assert.equal(w.document.querySelector('[data-product-id="teacher_custom"]').getAttribute('aria-pressed'),'true'));
  w.qGoto(2);w.qPick3('writing');w.qGoto(3);await w.submitQuizChoice();
  check('New plan preserves original model plus Grade 6 version',()=>{assert.equal(f.data.contracts.student.grade,6);assert.equal(f.data.contracts.student.goalVersion,'grade6-v1');assert.equal(f.data.contracts.student.productId,'teacher_custom');assert.equal(f.data.contracts.student.status,'awaiting_grouping');assert.equal(f.data.contracts.student.platforms.length,1);});
  check('Research records untouched by redesign',()=>assert.equal(f.data.research.keep.value,'DO NOT ALTER'));
  await w.__test.home();await pause();
  check('Map advances to third milestone after idea save',()=>{assert.equal(w.document.querySelectorAll('.lp-station.done').length,2);assert.match(w.document.querySelector('[data-step="2"]').getAttribute('aria-label'),/Current/);assert.equal(w.document.querySelector('[data-step="2"]').disabled,true);});
  check('Pause control pauses all companion sprites',()=>{w.LearnPathUI.toggleMotion();assert.ok(w.document.querySelector('.lp-clock').classList.contains('paused'));assert.equal(w.document.querySelector('.lp-motion-toggle').getAttribute('aria-pressed'),'true');});
  f.close();

  // Pass 2: grouped student's three-goal validation, plan, submit, historical data.
  const c={grade:6,goalVersion:'grade6-v1',productId:'mini_story',productType:'Mini Story',category:'written',status:'draft',editUnlocked:true,topic:'My day',goals:{},planSteps:['Read an example','Write five sentences','Check my work'],studentName:'Ada',studentId:'student'};
  const g=fixture(c);w=g.w;
  await w.__test.home();await w.__test.legacyPassport();await pause();
  check('Grouped student can enter learning contract',()=>assert.ok(w.document.getElementById('c-topic')));
  w._c3Step=1;await w.__test.legacyPassport();await pause();
  check('All eleven goals remain with Grade 6 targets',()=>{assert.equal(w.document.querySelectorAll('.goal-row').length,11);assert.match(w.document.getElementById('mc').textContent,/five complete sentences/);assert.match(w.document.getElementById('mc').textContent,/1.5–2 minutes/);});
  await w.submitContract();
  check('Invalid submit keeps existing draft',()=>assert.equal(g.data.contracts.student.status,'draft'));
  for(const key of ['unitWords','tenSentences','spelling']){await w.toggleGoal(key);await pause();}
  w._c3Step=2;await w.__test.legacyPassport();await pause();
  check('Plan values and I will starter hints survive rendering',()=>{assert.equal(w.document.querySelector('input.fi').value,'Read an example');assert.match(w.document.querySelector('input.fi').placeholder,/I will/);});
  await w.submitContract();await pause();
  check('Valid submit retains original pending-and-lock behavior',()=>{assert.equal(g.data.contracts.student.status,'pending');assert.equal(g.data.contracts.student.editUnlocked,false);assert.ok(g.data.contracts.student.submittedAt);assert.equal(g.data.contracts.student.planSteps.length,3);});
  const historical={...c};delete historical.grade;
  check('Historical contract criteria are not silently rewritten',()=>assert.match(w.__test.goals(historical).find(x=>x.id==='tenSentences').text,/ten complete/));
  check('Teacher review uses the owning contract goal version',()=>assert.match(html,/goalItemsFor\(c\)\.forEach\(function\(g\)\{\s*var checked=!!window\._reviewGoals/));
  g.close();

  // Pass 3: lock parity, resources, errors, no-hint vocabulary data, timing.
  const h=fixture(c);w=h.w;await w.__test.home();await pause();
  w._liveSession={active:true,step:'step2'};
  w.LearnPathUI.setProgress([true,false,false,false],[true,true,true,true]);
  check('Teacher-led sessions cannot be bypassed through map or resources shortcut',()=>{assert.ok([...w.document.querySelectorAll('.lp-station')].every(x=>x.disabled));w._currentScreen='home';w.LearnPathUI.openResources();assert.equal(w._currentScreen,'home');});
  w._liveSession=null;
  await w.renderResourcesScreen();await pause();
  const label=w.document.querySelector('label.fl');
  check('Resource labels point to preserved input IDs',()=>assert.equal(label.htmlFor,'res-sugg-title'));
  const before=h.writes.length;
  await w.suggestResource();
  check('Blank resources never write to DB',()=>assert.equal(h.writes.length,before));
  w.document.getElementById('res-sugg-title').value='School reading';w.document.getElementById('res-sugg-url').value='https://example.test/reading';
  await w.suggestResource();
  check('Resource save retains original approval queue',()=>assert.ok(Object.values(h.data.resourceSuggestions).some(x=>x.title==='School reading'&&x.suggestedById==='student')));
  check('Vocabulary values and historical submissions untouched',()=>assert.deepEqual(h.data.wordChecks.student,{submittedAt:123,words:['school']}));
  w.LearnPathUI.setRole('teacher');
  check('Student map hidden for teacher',()=>assert.equal(w.document.getElementById('lp-map').hidden,true));
  const meta=JSON.parse(fs.readFileSync(path.join(root,'assets/compass-idle.json')));
  const css=fs.readFileSync(path.join(root,'assets/learnpath.css'),'utf8');
  check('Sprite has 24 unique frames with exact 3000ms loop',()=>{assert.equal(meta.frames,24);assert.equal(meta.uniqueFrames,24);assert.equal(meta.frameDurationMs*meta.frames,3000);assert.match(css,/3s steps\(1,end\) infinite/);assert.equal((css.split('@keyframes lp-clock-idle {')[1].split('/* User-approved')[0].match(/background-position:/g)||[]).length,25);});
  check('Reduced motion and hidden document are supported',()=>{assert.match(css,/prefers-reduced-motion:reduce/);assert.match(ui,/visibilitychange/);});
  h.close();
  // Supplied unit: real persistence callbacks, independently checked choices and feedback.
  const u=fixture();w=u.w;
  const unit=JSON.parse(fs.readFileSync(path.join(root,'assets/unit-starter.json')));
  u.data.unitInfo={title:'Digital world',...unit};delete u.data.wordChecks.student;
  await w.renderStep1Screen();await pause();
  check('Unit shows exactly the 29 supplied words without definitions',()=>{assert.equal(w.document.querySelectorAll('.lp-word-choice').length,29);assert.equal(w.document.querySelectorAll('.lp-unit-question').length,5);assert.doesNotMatch(w.document.getElementById('word-check-list').textContent,/Fähigkeit|ability is|ə/);});
  w.document.getElementById('wc-input-0').click();await pause();w.document.getElementById('wc-input-28').click();await pause();
  check('Multiple vocabulary selections persist with word labels',()=>{assert.deepEqual(u.data.wordChecks.student.selectedWords,['ability','viral']);assert.equal(u.data.wordChecks.student.checked[0],true);assert.equal(u.data.wordChecks.student.checked[28],true);});
  await w.submitWordChecks();
  check('Submitted word check lists only unselected words and persists them',()=>{const remaining=[...w.document.querySelectorAll('#words-to-learn li')].map(el=>el.textContent);assert.equal(remaining.length,27);assert.equal(remaining.includes('ability'),false);assert.equal(remaining.includes('viral'),false);assert.ok(remaining.includes('mental health'));assert.deepEqual(u.data.wordChecks.student.wordsToLearn,remaining);});
  await w.renderStep1Screen();
  check('Words to learn survives reopening the unit',()=>assert.equal(w.document.querySelectorAll('#words-to-learn li').length,27));
  w._wordCheckState=Array(29).fill(true);await w.submitWordChecks();
  check('All-known vocabulary displays a clear empty list message',()=>{assert.equal(w.document.querySelectorAll('#words-to-learn li').length,0);assert.match(w.document.getElementById('words-to-learn').textContent,/You know all/);});
  await w.submitGrammarAnswers();
  check('Unanswered grammar never submits and names the missing question',()=>{assert.equal(u.data.grammarAnswers.student,undefined);assert.match(w.document.getElementById('grammar-error').textContent,/question 1/);});
  const choices=[0,1,0,0,1];
  for(let i=0;i<choices.length;i++)await w.pickGrammarAnswer(i,choices[i]);
  await w.submitGrammarAnswers();await pause();
  check('Every wrong answer has its exact supplied explanation',()=>{assert.equal(w.document.querySelectorAll('.lp-grammar-feedback').length,5);unit.grammarQuestions.forEach((q,i)=>assert.ok(w.document.getElementById('mc').textContent.includes(q.feedback[choices[i]])));});
  check('Submission preserves question snapshots and prevents subsequent answer edits',()=>{assert.equal(u.data.grammarAnswers.student.submitted,true);assert.deepEqual(u.data.grammarAnswers.student.questions,unit.grammarQuestions);assert.ok([...w.document.querySelectorAll('.lp-unit-question .qo')].every(b=>b.disabled));});
  check('Feedback safely escapes content and shares the existing pause state',()=>{assert.doesNotMatch(w.LearnPathUI.grammarFeedback({options:['<img>','ok'],correct:1,feedback:['<script>bad</script>']},0),/<script>|<img>/);w.LearnPathUI.toggleMotion();assert.ok([...w.document.querySelectorAll('.lp-grammar-feedback .lp-clock')].every(el=>el.classList.contains('paused')));});
  u.data.grammarAnswers.student={answers:{0:2,1:0,2:1,3:3,4:0},submitted:true,questions:unit.grammarQuestions};
  await w.renderStep1Screen();
  check('Answer key c/a/b/d/a yields full marks without wrong-answer guidance',()=>{assert.equal(w.document.querySelectorAll('.lp-grammar-feedback').length,0);assert.equal(w.document.querySelectorAll('.lp-grammar-correct').length,5);assert.match(w.document.getElementById('mc').textContent,/5\/5/);});
  w.document.getElementById('mc').innerHTML='<input id="sheet-export-key" type="password"><button id="sheet-copy-key">Copy</button><p id="sheet-copy-status"></p>';
  w.document.getElementById('sheet-export-key').value='a'.repeat(64);let copiedKey=null;
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async value=>{copiedKey=value;}},configurable:true});
  await w.copySheetsKey();
  check('Dedicated key copy button copies the complete key without revealing it',()=>{assert.equal(copiedKey,'a'.repeat(64));assert.equal(w.document.getElementById('sheet-export-key').type,'password');assert.match(w.document.getElementById('sheet-copy-status').textContent,/Kopyalandı/);assert.doesNotMatch(w.document.getElementById('sheet-copy-status').textContent,/aaaaa/);});
  u.close();
  const report={passes:4,checks:results.length,results,limitations:['Isolated DOM + mocked persistence, not live account or upload/security verification','Visual browser checks reported separately']};
  fs.mkdirSync(path.join(root,'verification'),{recursive:true});
  fs.writeFileSync(path.join(root,'verification/regression.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
