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
 assert.equal(await page.locator('.lp-feed-stamp.sent').innerText(),'Sent to the teacher');
 assert.match(await page.locator('.lp-feed-passport').first().innerText(),/Teacher\n0%/);
 assert.equal(await page.locator('.lp-feed-passport h2').last().innerText(),'<b>My topic</b>');
 await page.locator('.lp-feed-author').first().click();assert.equal(await page.evaluate(()=>__viewedProfile),'student');
 await page.locator('.lp-feed-goals summary').first().focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('.lp-feed-goals').first().getAttribute('open')!==null);
 assert.match(await page.locator('.lp-feed-goals').first().innerText(),/eight unit words/);
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
 assert.deepEqual(errors,[]);console.log('PASS: collection tabs, native goal disclosure, versioned goals, zero targets, escaped content, profile/review actions, media links, empty states, tablet/mobile; no record writes.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
