/* Full production host/frame workflow. Isolated mock persistence; no student data. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(__dirname,'browser.cjs'),'utf8');
const bootstrap=new Function('return '+source.slice(source.indexOf('function bootstrap()'),source.indexOf('const server=')))();
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 let content;try{content=fs.readFileSync(file);}catch{res.writeHead(404);return res.end();}
 const ext=path.extname(file);res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'text/plain');
 if(ext==='.html')content=content.toString().replace('<script type="module">','<script>').replace(/^import[^\r\n]+;\r?\n/gm,'');
 res.end(content);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--disable-gpu']});
 const ctx=await browser.newContext({viewport:{width:1024,height:768}});
 await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 await ctx.addInitScript(bootstrap);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
 await page.locator('.step-card').first().waitFor();
 await page.evaluate(()=>startQuiz());
 const f=page.frameLocator('#lp-planner-frame');
 await f.locator('[data-choice="privacy"]').click();await f.locator('#next').click();
 assert.ok(await f.locator('[data-product]').count()>=12);
 await f.locator('[data-product="interview"]').click();await f.locator('#next').click();
 await f.locator('[data-choice="other"]').click();await f.locator('#next').click();
 assert.match(await f.locator('#error').innerText(),/another tool/);
 await f.locator('#tool-own').fill('Recorder');await f.locator('#next').click();
 await f.locator('[data-choice="speaking"]').click();await f.locator('#next').click();
 await f.getByRole('button',{name:'Save my project idea',exact:true}).click();
 await page.getByText('Now wait for your teacher to group you.').waitFor();
 let saved=await page.evaluate(()=>__mockDB.contracts.student);
 assert.equal(saved.topic,'Sharing safely online');assert.equal(saved.productType,'Interview');assert.equal(saved.status,'awaiting_grouping');assert.equal(saved.plannerVersion,'passport-v1');assert.equal(saved.weaknessTips.length,3);assert.equal(saved.platformsOtherText,'Recorder');
 // Teacher grouping is server owned; fixture changes only in this isolated test.
 await page.evaluate(()=>{__mockDB.contracts.student.status='draft';return renderStep3Screen();});
 await f.locator('[data-goal="unitWords"]').waitFor();
 assert.equal(await f.locator('[data-passport-step]').count(),3);
 assert.equal(await f.locator('[data-goal]').count(),8);
 assert.equal(await f.locator('[data-goal="evidence"],[data-goal="easyUnderstand"],[data-goal="topicImpact"],.structure-help').count(),0);
 assert.equal(await f.locator('.contract-paper .contract-focus').count(),1);
 assert.doesNotMatch(await f.locator('#screen').innerText(),/at home|matters to me|detailed description/);
 await f.locator('#passport-next').click();assert.match(await f.locator('#passport-error').innerText(),/at least 3/);
 for(const key of ['unitWords','spelling','speakClear'])await f.locator('[data-goal="'+key+'"]').check();
 await f.locator('#passport-next').click();
 const steps=['I will I will prepare my questions.','practise speaking.','record my interview.'];
 for(let i=0;i<3;i++)await f.locator('#plan-'+i).fill(steps[i]);
 await f.locator('#passport-next').click();
 await f.locator('#teacher-target').fill('85');await f.locator('#peer-target').fill('90');
 assert.equal(await f.locator('.send-teacher').innerText(),'Save and send to the teacher');
 await f.getByRole('button',{name:'Save and send to the teacher',exact:true}).click();
 await f.getByText('Your Learning Passport has been saved. Your teacher can now review it.').waitFor();
 saved=await page.evaluate(()=>__mockDB.contracts.student);
 assert.equal(saved.status,'pending');assert.equal(saved.editUnlocked,false);assert.equal(saved.evalTeacherPct,'85');assert.equal(saved.evalPeerPct,'90');assert.equal(saved.planSteps[0],'I will prepare my questions.');
 assert.equal(await f.locator('[data-passport-edit]').count(),0);
 assert.match(await f.locator('.focus-overview').innerText(),/Practise your talk|1.5–2 minutes/);
 await page.screenshot({path:path.join(root,'verification/passport-production.png'),fullPage:true});
 await f.getByRole('button',{name:'Back to Home',exact:true}).click();
 await page.locator('#lp-passport-tab').click();await f.getByRole('heading',{name:'My Learning Passport',exact:true}).waitFor();
 assert.match(await f.locator('#screen').innerText(),/85%/);
 for(const width of [1024,390]){await page.setViewportSize({width,height:768});const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width+1);}
 // A teacher-unlocked passport can be edited; changes survive replacing its UI.
 await page.evaluate(()=>{__mockDB.contracts.student.editUnlocked=true;return renderStep3Screen(true);});
 await f.getByRole('button',{name:'Edit my plan',exact:true}).click();await f.locator('#plan-0').fill('revise my questions.');
 await f.getByRole('button',{name:'Save changes and return to passport',exact:true}).click();
 await f.locator('#save-status').filter({hasText:'Draft saved'}).waitFor();
 await page.evaluate(()=>renderStep3Screen(true));await f.getByRole('heading',{name:'My Learning Passport',exact:true}).waitFor();
 assert.match(await f.locator('#screen').innerText(),/I will revise my questions/);
 assert.deepEqual(errors,[]);console.log('PASS: production planner, grouping, combined goals, autosave, send/lock, overview, restore, scores, tablet/mobile, no external calls.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
