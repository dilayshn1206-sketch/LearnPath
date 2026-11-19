/* Real host/frame workflow with isolated persistence; no live accounts. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(__dirname,'browser.cjs'),'utf8');
const bootstrap=new Function('return '+source.slice(source.indexOf('function bootstrap()'),source.indexOf('const server=')))();
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 let content;try{content=fs.readFileSync(file);}catch{res.writeHead(404);return res.end();}
 res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'text/plain');
 if(file.endsWith('.html'))content=content.toString().replace('<script type="module">','<script>').replace(/^import[^\r\n]+;\r?\n/gm,'');
 res.end(content);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
 try{for(const guided of [false,true]){
  const ctx=await browser.newContext({viewport:{width:1024,height:768}}),errors=[],loaded=[];
  await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
  await ctx.addInitScript(bootstrap);
  const wardrobe=(fs.readFileSync(path.join(root,'assets/magical-wardrobe-layers.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'assets/magical-wardrobe.js'),'utf8').replace(/^import[^\r\n]+;\r?\n/gm,'')).replace(/^export /gm,'');
  await ctx.addInitScript('(function(){'+wardrobe+';window.MagicalWardrobe={animals,items,isAnimal,fieldForSlot,coin,avatar,shop};})();');
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>loaded.push(r.url()));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.locator('.lp-welcome').waitFor();
  await page.evaluate(g=>{if(g)supportProfile=LearnPathSupport.profile;return startQuiz();},guided);
  const f=page.frameLocator('#lp-planner-frame');
  for(let step=0;step<5;step++){
   await f.locator('.project-help').waitFor();
   assert.equal(await f.locator('.project-help p').innerText(),'Ask your friends or ask Google.');
   assert.equal(await f.locator('#chat-input,#prepared-guide,.chat-guide,[data-ask-compass],.chat-log').count(),0);
   assert.equal(await f.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+1),true);
   if(step===0){await f.locator('[data-choice="care"]').click();await page.screenshot({path:path.join(root,'verification/no-chat-'+(guided?'guided':'standard')+'.png'),fullPage:true});}
   if(step===1)await f.locator('[data-product]').first().click();
   if(step===2)await f.locator('[data-choice="own"]').click();
   if(step===3)await f.locator('[data-choice="writing"]').click();
   if(step<4)await f.locator('#next').click();
  }
  await f.locator('#next').click();await page.locator('.lp-product-launch').waitFor();
  assert.ok(await page.evaluate(()=>__mockDB.contracts.student.productType));
  assert.equal(loaded.filter(u=>/compass-(prepared|library|topics|products)\.js/.test(u)).length,0);
  assert.deepEqual(errors,[]);await ctx.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 console.log('PASS: standard and supported five-step planners, save, no chatbot UI or chatbot requests, tablet layout.');
})().catch(e=>{console.error(e);process.exitCode=1;});
