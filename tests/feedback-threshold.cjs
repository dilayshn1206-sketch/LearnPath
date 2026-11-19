/* Read-only synthetic verification: received averages, four stars and 65% boundary. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(__dirname,'browser.cjs'),'utf8'),bootstrap=new Function('return '+source.slice(source.indexOf('function bootstrap()'),source.indexOf('const server=')))();
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}let b;try{b=fs.readFileSync(file);}catch{res.writeHead(404);return res.end();}res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'text/plain');if(file.endsWith('.html'))b=b.toString().replace('<script type="module">','<script>').replace(/^import[^\r\n]+;\r?\n/gm,'');res.end(b);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());await ctx.addInitScript(bootstrap);const page=await ctx.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.locator('.step-card').first().waitFor();
 const results=await page.evaluate(()=>{
  function inspect(comments,own=true){const before=JSON.stringify(comments),post={id:'case',uid:own?CU.uid:'another-student'},host=document.createElement('div');host.innerHTML=buildCommentSummary(post,comments);return {text:host.textContent,unchanged:before===JSON.stringify(comments),cards:[...host.querySelectorAll('.lp-average-match')].map(el=>({criterion:Number(el.dataset.criterion),tier:el.querySelector('.lp-feedback-tier')?.textContent,stars:el.querySelectorAll('svg').length,filled:el.querySelectorAll('path[fill="#dca631"]').length,text:el.querySelector('.lp-average-ending').textContent})),scores:[...host.querySelectorAll('.lp-feedback-score>strong')].map(el=>el.textContent)};}
  const cm=values=>({peerRubricVersion:LearnPathRubrics.version,peerRubric:values});
  return {
   low:inspect([cm([0,1,2,1,2]),cm([1,2,1,2,1])]),
   boundary:inspect([cm([1,1,2,2,2])]),
   belowBoundary:inspect([cm([1,1,2,2,2]),cm([1,1,1,2,2])]),
   other:inspect([cm([1,1,2,2,2])],false),
   sources:inspect([{...cm([0,0,0,0,0]),isTeacher:true},cm([3,3,3,3,3])]),
   legacy:inspect([{peerRubric:[0,1,2,0,1,2]}]),
   supported:inspect([{peerRubricVersion:LearnPathSupport.rubricVersion,peerRubric:[0,1,1,0,1]}]),
   mixed:inspect([{peerRubric:[0,0,0,0,0,0]},cm([3,3,3,3,3])]),
   highWithLow:inspect([cm([0,3,3,3,3])]),
   criterion65:inspect([1,1,2,2,2].map(v=>cm([v,v,v,v,v]))),
   criterionBelow65:inspect([1,1,2,2].map(v=>cm([v,v,v,v,v]))),
   missing:inspect([cm([null,undefined,9,-1,null])])
  };
 });
 for(const r of Object.values(results)){assert.ok(r.unchanged);r.cards.forEach(c=>assert.equal(c.stars,4));}
 assert.equal(results.low.scores[1],'58%');assert.ok(results.low.cards.every(c=>!/successfully|was easy/.test(c.text)));
 assert.deepEqual(results.low.cards.map(c=>c.filled),[2,3,3,3,3]);
 assert.equal(results.boundary.scores[1],'65%');assert.match(results.boundary.cards.find(c=>c.criterion===0).text,/Make new sentences/);assert.match(results.boundary.cards.find(c=>c.criterion===3).text,/Most of your message/);
 assert.equal(results.belowBoundary.scores[1],'63%');assert.match(results.belowBoundary.cards.find(c=>c.criterion===0).text,/Make new sentences/);
 assert.match(results.other.text,/My classmate/);assert.doesNotMatch(results.other.text,/You successfully/);
 assert.deepEqual(results.sources.scores,['25%','100%']);assert.match(results.sources.cards[0].text,/Make new sentences/);assert.match(results.sources.cards[5].text,/You made new sentences/);
 assert.equal(results.legacy.cards.length,5);assert.ok(results.legacy.cards.every(c=>c.filled===0&&c.text==='Not rated yet'));assert.match(results.legacy.text,/Earlier assessments/);assert.doesNotMatch(results.legacy.text,/Audience|Clear English/);
 assert.equal(results.mixed.scores[1],'100%');assert.equal(results.mixed.cards.length,5);assert.equal(results.highWithLow.scores[1],'85%');assert.match(results.highWithLow.cards[0].text,/Make new sentences/);assert.doesNotMatch(results.highWithLow.cards[0].text,/successfully|You made/);
 assert.equal(results.supported.cards.length,5);assert.deepEqual(results.supported.cards.map(c=>c.filled),[1,1,4,4,4]);assert.equal(results.missing.cards.length,0);
 assert.ok(results.criterion65.cards.every(c=>!/^Make|^Connect|^Add|^Check/.test(c.text)));assert.ok(results.criterionBelow65.cards.every(c=>/^Make|^Connect|^Add|^Check/.test(c.text)));
 const profiles=await page.evaluate(()=>{const results=[];for(const profile of ['',LearnPathSupport.profile]){supportProfile=profile;for(const self of [true,false]){const rubric=activeRubric(self),key='verify_'+profile+'_'+self,el=document.createElement('div');el.id=key;document.getElementById('mc').appendChild(el);window._rubricStores[key]={values:Array(5).fill(null),rubric,containerId:key,index:0};for(let i=0;i<5;i++){_rubricStores[key].index=i;renderRubricBlock(key,rubric,_rubricStores[key].values,key);results.push({supported:!!profile,version:activeRubricVersion(),areas:rubric.map(r=>r.area),levels:el.querySelectorAll('input[type=radio]').length,first:el.querySelector('.rub-pill')?.textContent,question:el.querySelector('.lp-rubric-heading').textContent,expected:rubric[i].q});}el.remove();}}return results;});
 profiles.forEach(p=>{assert.equal(p.version,p.supported?'grade6-support-binary-20261108-v1':'grade6-20261102-v2');assert.deepEqual(p.areas,['Sharing Ideas','Words and Sentences','Impact','Easy to Understand','English']);assert.equal(p.levels,p.supported?2:4);if(!p.supported)assert.match(p.first,/Step 4Excellent/);assert.equal(p.question,p.expected);});
 await page.evaluate(()=>{const cm=(values,teacher)=>({peerRubricVersion:LearnPathRubrics.version,peerRubric:values,isTeacher:teacher,well:'Your pictures made the topic clear.',improve:'Connect the last two sentences.'});document.getElementById('mc').innerHTML='<h1>My project feedback</h1>'+buildCommentSummary({id:'preview',uid:CU.uid},[cm([0,2,3,2,3]),cm([0,2,3,2,3]),cm([2,2,3,2,3],true)]);document.querySelectorAll('.lp-score-details').forEach(b=>b.click());});
 await page.screenshot({path:path.join(root,'verification/feedback-four-stars.png'),fullPage:true});
 await page.locator('#fb-p-preview').scrollIntoViewIfNeeded();await page.locator('#fb-p-preview').screenshot({path:path.join(root,'verification/feedback-guidance-four-stars.png')});
 console.log('PASS: actual means before rounding; standard four-level and supported two-choice profiles preserved, historical scores separated; per-criterion 65% exact boundary; missing ratings; separate teacher/peer groups; own-project-only copy; no data mutation.');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
