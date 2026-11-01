/* Isolated classroom collection: presentation and existing action bindings. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'browser.cjs'),'utf8');
const bootstrap=new Function('return '+source.slice(source.indexOf('function bootstrap()'),source.indexOf('const server=')))();
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 let content;try{content=fs.readFileSync(file);}catch{res.writeHead(404);return res.end();}
 const ext=path.extname(file);res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'text/plain');
 if(ext==='.html')content=content.toString().replace('<script type="module">','<script>').replace(/^import[^\r\n]+;\r?\n/gm,'');res.end(content);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--disable-gpu']});
 const ctx=await browser.newContext({viewport:{width:1280,height:900}});
 await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 await ctx.addInitScript(bootstrap);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.locator('.lp-welcome').waitFor();
 const before=await page.evaluate(()=>{
  const c={grade:6,productType:'Infographic',category:'visual',topic:'Being kind online',studentName:'Ada <A>',studentId:'student',status:'pending',submittedAt:1,goals:{unitWords:true,grammar:true,tenSentences:true},weaknessTips:['Draw a plan.','Use clear words.','Check your message.'],planSteps:['I will plan my ideas.','I will create my infographic.','I will check my work.'],evalTeacherPct:'0',evalPeerPct:'85',teacherComment:'Keep your examples clear.',createdAt:3};
  __mockDB.contracts={student:c,peer:{...c,studentId:'peer',studentName:'Ece',status:'approved',createdAt:2},draft:{studentId:'draft',studentName:'Deniz',productType:'Blog',topic:'<b>My topic</b>',createdAt:1,status:'draft'}};
  __mockDB.posts={example:{uid:'peer',name:'Ece',title:'My digital guide',productType:'Blog',link:'https://example.test/work',createdAt:2}};
  const snap=(v,key)=>({exists:()=>v!=null,val:()=>v,key,forEach:fn=>Object.entries(v||{}).forEach(([k,x])=>fn(snap(x,k)))});
  window.onValue=(p,fn)=>{fn(snap(p.split('/').reduce((o,k)=>o?.[k],__mockDB)));return ()=>{};};
  window.viewProf=id=>window.__viewedProfile=id;
  go('feed');return JSON.stringify({contracts:__mockDB.contracts,posts:__mockDB.posts});
 });
 await page.getByRole('heading',{name:'Our learning journeys',exact:true}).waitFor();
 assert.equal(await page.locator('.lp-feed-passport').count(),3);
 assert.equal(await page.locator('.lp-feed-product-type').first().innerText(),'Product type\nInfographic');
 assert.equal(await page.locator('.lp-feed-stamp.sent').innerText(),'Sent to the teacher');
 assert.match(await page.locator('.lp-feed-passport').first().innerText(),/Teacher\n0%/);
 assert.equal(await page.locator('.lp-feed-passport h2').last().innerText(),'<b>My topic</b>');
 await page.locator('.lp-feed-author').first().click();assert.equal(await page.evaluate(()=>__viewedProfile),'student');
 await page.locator('.lp-feed-goals summary').first().focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('.lp-feed-goals').first().getAttribute('open')!==null);
 assert.match(await page.locator('.lp-feed-goals').first().innerText(),/eight unit words/);
 assert.equal(await page.locator('.lp-feed-goals .lp-feed-count').first().innerText(),'3');
 assert.doesNotMatch(await page.locator('.lp-feed-goals').first().innerText(),/Focus goals|Draw a plan/);
 await page.screenshot({path:path.join(root,'verification/feed-tablet.png'),fullPage:true});
 await page.getByRole('button',{name:'Project gallery',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Project gallery',exact:true}).getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('#feed-container').innerText(),/My digital guide/);
 assert.equal(await page.getByRole('button',{name:'+ Share Your Work',exact:true}).count(),1);
 for(const width of [1024,390]){await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Learning plans',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.evaluate(()=>renderTFeed());await page.getByRole('button',{name:'Approve',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Review full plan →',exact:true}).count(),3);
 assert.equal(await page.evaluate(()=>JSON.stringify({contracts:__mockDB.contracts,posts:__mockDB.posts})),before);
 await page.evaluate(()=>{__mockDB.contracts={};__mockDB.posts={};renderTFeed();});
 assert.match(await page.locator('#projects-list').innerText(),/Our journeys start here/);
 await page.getByRole('button',{name:'Project gallery',exact:true}).click();
 assert.match(await page.locator('#feed-container').innerText(),/A space for our creations/);
 await page.setViewportSize({width:1024,height:768});
 await page.evaluate(()=>openNewPost());
 assert.match(await page.locator('#lp-share-compass').innerText(),/No focus goals/);
 await page.evaluate(()=>{__mockDB.contracts.student={grade:6,studentId:'student',productType:'Interview',category:'spoken',topic:'Digital friendship',status:'pending',submittedAt:1,planSteps:['I will plan.','I will record.','I will check.'],weakness:'speaking',weaknessTips:['Practise your talk out loud.','Record yourself once and listen.','Take a breath and speak slowly.'],goals:{unitWords:true,organize:true,speakClear:true},goalsOtherText:'I will ask a friend for feedback.'};return openNewPost();});
 assert.match(await page.locator('#lp-share-compass').innerText(),/needed help with speaking/);
 assert.match(await page.locator('#lp-share-compass').innerText(),/Did you practise your talk/);
 assert.match(await page.locator('#lp-share-compass').innerText(),/record yourself and listen/);
 assert.equal(await page.locator('.lp-share-focus-questions li').count(),3);
 assert.equal(await page.locator('[data-focus-check]').count(),3);
 await page.locator('[data-focus-check="0"]').focus();await page.keyboard.press('Space');
 await page.locator('[data-focus-check="2"]').check();
 assert.deepEqual(await page.evaluate(()=>_shareState.focusChecks),[true,false,true]);
 assert.match(await page.locator('#lp-share-compass').innerText(),/Did you take a breath and speak slowly/);
 assert.equal(await page.locator('#lp-share-compass details').count(),0);
 assert.doesNotMatch(await page.locator('#lp-share-compass').innerText(),/You also chose|ask a friend for feedback/);
 assert.ok(await page.locator('.lp-share-compass').evaluate(el=>el.getBoundingClientRect().left>document.querySelector('.lp-share-paper').getBoundingClientRect().right));
 await page.locator('#np-title').fill('My interview');await page.locator('#np-link').fill('https://example.test/interview');
 await page.evaluate(()=>go('feed'));await page.locator('#feed-container').waitFor();
 await page.goBack();await page.locator('#np-title').waitFor({state:'visible'});
 assert.equal(await page.locator('#np-title').inputValue(),'My interview');
 assert.ok(await page.locator('[data-focus-check="0"]').isChecked());
 await page.locator('#np-continue').click();
 await page.goBack();await page.locator('#np-title').waitFor({state:'visible'});
 assert.equal(await page.locator('#np-title').inputValue(),'My interview');
 await page.goForward();await page.locator('#np-rub-rows').waitFor({state:'visible'});
 assert.equal(await page.locator('#np-rub-rows .rubarea2').count(),1);
 assert.equal(await page.locator('#np-rub-rows .rublevel-row').count(),3);
 assert.equal(await page.locator('.lp-rubric-pair').count(),0);
 await page.locator('#rubric-newpost-0-1').check();
 assert.equal(await page.evaluate(()=>_rubricStores.newpost.values[0]),1);
 await page.locator('#np-continue').click();assert.match(await page.locator('#lp-share-compass').innerText(),/Order is how/);
 await page.goBack();await page.locator('#rubric-newpost-0-1').waitFor();
 assert.ok(await page.locator('#rubric-newpost-0-1').isChecked());
 await page.goForward();await page.locator('#rubric-newpost-1-0').waitFor();
 await page.locator('#np-back').click();assert.ok(await page.locator('#rubric-newpost-0-1').isChecked());
 for(let i=0;i<6;i++){await page.locator('#rubric-newpost-'+i+'-'+(i%3)).check();await page.locator('#np-continue').click();}
 assert.ok(await page.locator('#np-well').isVisible());
 assert.ok(await page.locator('[data-focus-check="0"]').isChecked());
 assert.equal(await page.locator('[data-focus-check="1"]').isChecked(),false);
 assert.ok(await page.locator('[data-focus-check="2"]').isChecked());
 assert.equal(await page.locator('#np-title').inputValue(),'My interview');assert.equal(await page.locator('#np-link').inputValue(),'https://example.test/interview');
 // Session callbacks used to bring the fixed bottom bar over share buttons.
 for(const size of [{width:1024,height:768},{width:1024,height:520},{width:390,height:660}]){
  await page.setViewportSize(size);await page.evaluate(()=>closeEvalModal());
  assert.equal(await page.locator('#bnav').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('#np-share-btn').scrollIntoViewIfNeeded();
  const footerHit=await page.locator('#np-share-btn').evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {bottom:r.bottom,height:innerHeight,hit:hit&&hit.outerHTML.slice(0,200),clear:!!hit&&el.contains(hit)};});
  assert.ok(footerHit.bottom<=size.height+1&&footerHit.clear,JSON.stringify({size,...footerHit}));
 }
 await page.screenshot({path:path.join(root,'verification/share-footer-clear.png'),fullPage:false});
 assert.deepEqual(await page.evaluate(()=>_rubricStores.newpost.values),[0,1,2,0,1,2]);
 for(const width of [1280,1024]){await page.setViewportSize({width,height:768});await page.locator('[data-share-stage="1"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.lp-share-actions').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));}
 await page.screenshot({path:path.join(root,'verification/share-single-criterion.png'),fullPage:true});
 await page.locator('[data-share-stage="0"]').click();await page.screenshot({path:path.join(root,'verification/share-goal-guide.png'),fullPage:true});
 assert.ok(await page.locator('[data-focus-check="0"]').isChecked());
 await page.locator('[data-focus-check="2"]').uncheck();
 await page.locator('#lp-share-compass').screenshot({path:path.join(root,'verification/share-checklist.png')});
 assert.equal(await page.locator('#lp-map').isVisible(),false);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.setViewportSize({width:1280,height:800});
 // Unchecked optional reminders never block the normal share action.
 await page.locator('[data-share-stage="2"]').click();
 await page.locator('#np-well').fill('My message is clear.');await page.locator('#np-improve').fill('Check more words.');
 await page.locator('#np-share-btn').click();await page.locator('#feed-container').waitFor();
 const checklist=await page.evaluate(()=>__mockDB.posts.mock.preShareChecklist);
 assert.deepEqual(checklist.items.map(x=>x.done),[true,false,false]);
 assert.equal(checklist.items[0].tip,'Practise your talk out loud.');
 assert.equal(checklist.version,1);
 await page.evaluate(()=>{__mockDB.posts.peerPost={uid:'peer',name:'Ece <A>',productType:'Blog',title:'Kind messages',well:'My ideas',selfRubric:[0,1,2,0,1,2],comments:{one:{from:'Ali',fromId:'ali',well:'Good title',improve:'Add reasons',peerRubric:[0,1,2,0,1,2]}}};go('feed');switchFeedTab('posts');});
 assert.equal(await page.locator('#post-peerPost .lp-reflection-label').innerText(),'Ece <A>’s self-reflection ▼');
 assert.match(await page.locator('#fb-p-peerPost').textContent(),/simple information|explains|information/);
 assert.deepEqual(await page.locator('#fb-p-peerPost .lp-feedback-tier').allTextContents(),['Step 1','Step 2','Step 3','Step 1','Step 2','Step 3']);
 await page.evaluate(()=>openComment('peerPost'));
 assert.equal(await page.locator('#cm-rub-peerPost fieldset').count(),1);
 assert.equal(await page.locator('#cm-well-peerPost').isVisible(),false);
 for(let i=0;i<6;i++){
  await page.locator('#rubric-comment_peerPost-'+i+'-'+(i%3)).check();
  if(i<5)await page.locator('#cm-rub-peerPost').getByRole('button',{name:'Next →',exact:true}).click();
 }
 await page.getByRole('button',{name:'Continue to written feedback →',exact:true}).click();
 await page.locator('#cm-well-peerPost').fill('A clear example.');
 await page.getByRole('button',{name:'Back to my choices',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>_rubricStores.comment_peerPost.values),[0,1,2,0,1,2]);
 await page.getByRole('button',{name:'Continue to written feedback →',exact:true}).click();
 assert.equal(await page.locator('#cm-well-peerPost').inputValue(),'A clear example.');
 await page.evaluate(()=>{const c=__mockDB.contracts.student;__mockDB.contracts={};for(let i=0;i<23;i++)__mockDB.contracts['learner'+i]={...c,studentId:'learner'+i,studentName:'Learner '+(i+1),createdAt:i};go('feed');switchFeedTab('plans');});
 await page.setViewportSize({width:1024,height:768});
 assert.equal(await page.locator('.lp-feed-passport').count(),23);
 assert.ok(await page.locator('.lp-feed-passport').first().evaluate(el=>el.getBoundingClientRect().height<490));
 await page.locator('.lp-feed-passport').first().scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(root,'verification/compact-class-plans.png'),fullPage:false});
 await page.evaluate(()=>{UP.role='teacher';__mockDB.posts.goalPost={uid:'peer',name:'Ece',productType:'Blog',goalSnapshot:{grade:6,goals:{unitWords:true,grammar:true},goalsOtherText:'I will ask a friend for feedback.',createdAt:1}};__mockDB.contracts.peer={grade:6,goals:{structure:true}};renderTFeed();switchFeedTab('posts');});
 await page.locator('#post-goalPost').getByRole('button',{name:/Add Evaluation/}).click();await page.locator('#tc-goals-goalPost fieldset').waitFor();
 assert.equal(await page.locator('#tc-goals-goalPost input').count(),2);
 assert.match(await page.locator('#tc-goals-goalPost').innerText(),/eight unit words/);
 await page.locator('#tc-goals-goalPost label').filter({hasText:'Yes'}).check();
 await page.getByRole('button',{name:'Next goal',exact:true}).click();
 await page.locator('#tc-goals-goalPost label').filter({hasText:'No'}).check();
 await page.getByRole('button',{name:'Next goal',exact:true}).click();
 await page.locator('#tc-goals-goalPost label').filter({hasText:'Yes'}).check();
 await page.locator('#tc-well-goalPost').fill('Your opening is clear.');await page.locator('#tc-improve-goalPost').fill('Check the verb forms.');
 await page.evaluate(()=>submitTeacherComment('goalPost','peer'));
 const teacherReview=await page.evaluate(()=>__mockDB.posts.goalPost.comments.mock);
 assert.equal(teacherReview.isTeacher,true);assert.deepEqual(teacherReview.personalGoalReview.goals.map(g=>g.met),[true,false,true]);
 assert.equal(teacherReview.personalGoalReview.source,'project-submission');
 assert.deepEqual(teacherReview.personalGoalReview.goals.map(g=>g.id),['unitWords','grammar','custom']);
 assert.equal(await page.evaluate(()=>personalGoalFeedback({isTeacher:false,personalGoalReview:{goals:[{text:'fake',met:true}]}})), '');
 await page.evaluate(()=>{document.getElementById('mc').innerHTML=personalGoalFeedback(__mockDB.posts.goalPost.comments.mock);});
 await page.locator('.lp-goal-feedback summary').click();assert.match(await page.locator('.lp-goal-feedback').innerText(),/No/);
 await page.screenshot({path:path.join(root,'verification/teacher-goal-feedback.png'),fullPage:true});
 // New and legacy alerts reach the right project, preserve text and open feedback.
 await page.evaluate(()=>{
  UP.role='student';__mockDB.posts={older:{uid:'student',name:'Ada',title:'Older work',createdAt:10,comments:{c:{from:'Ece',fromId:'peer',well:'Clear ideas',improve:'Add details',createdAt:100000}}},newer:{uid:'student',name:'Ada',title:'Newer work',createdAt:20}};
  __mockDB.notifications.student={linked:{type:'comment',postId:'older',message:'Ece commented on your work!',createdAt:100001,read:false}};return openNotifs();
 });
 await page.locator('[data-notification]').press('Enter');
 assert.equal(await page.locator('#feed-tab-posts').isVisible(),true);
 assert.equal(await page.locator('#fb-all-older').isVisible(),true);
 assert.equal(await page.locator('#post-older').evaluate(el=>document.activeElement===el),true);
 assert.equal(await page.locator('#post-newer.lp-notification-target').count(),0);
 assert.notEqual(await page.locator('#bnav').evaluate(el=>getComputedStyle(el).display),'none');
 await page.evaluate(()=>{__mockDB.notifications.student={legacy:{type:'comment',message:'Ece commented on your work!',createdAt:100001,read:false}};return openNotifs();});
 await page.locator('[data-notification]').click();assert.equal(await page.locator('#fb-all-older').isVisible(),true);
 await page.evaluate(()=>{__mockDB.notifications.student={gone:{type:'teacher',postId:'deleted-project',message:'Teacher feedback',createdAt:100001,read:false}};return openNotifs();});
 await page.locator('[data-notification]').click();assert.match(await page.locator('#toast').innerText(),/no longer available/);
 await page.evaluate(()=>{__mockDB.notifications.student={resource:{type:'resource',message:'Resource approved',read:false}};return openNotifs();});
 await page.locator('[data-notification]').click();await page.locator('#res-sugg-title').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: collection tabs, native goal disclosure, versioned goals, zero targets, escaped content, profile/review actions, media links, empty states, tablet/mobile; no live record writes.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
