/* Local-only visual regression. All non-local network requests are blocked. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function bootstrap(){
  const data={users:{student:{role:'student',name:'Ada Student',groupId:'g1'}},contracts:{},unitInfo:{title:'My daily life',words:'breakfast,school'},wordChecks:{student:{submittedAt:123}},coinAwards:{student:{step1:true,step2:true,step3:true}},coins:{student:45},ideaCatalog:{written:{mini_story:{name:'Mini Story',active:true},profile_article:{name:'Profile Article',active:true},howto:{name:'How-to Guide',active:true},comparison:{name:'Comparison Article',active:true},report:{name:'Mini Report',active:true},letter:{name:'Proposal Letter',active:true}},spoken:{diary:{name:'Character Voice Diary',active:true},tour:{name:'Audio Tour',active:true},tutorial:{name:'Audio Tutorial',active:true},review:{name:'Audio Review',active:true},news:{name:'News Bulletin',active:true},pitch:{name:'One-Minute Pitch',active:true}},visual:{comic:{name:'Comic Story',active:true},exhibit:{name:'Visual Exhibit',active:true},process:{name:'Process Infographic',active:true},comparison:{name:'Comparison Infographic',active:true},fact:{name:'Fact File',active:true},poster:{name:'Campaign Poster',active:true}}},posts:{},resourceSuggestions:{},resources:{},notifications:{},grammarAnswers:{}};
  const read=p=>p.split('/').filter(Boolean).reduce((o,k)=>o?.[k],data);
  const write=(p,v,merge)=>{const ks=p.split('/'),last=ks.pop();let o=data;ks.forEach(k=>o=o[k]??={});o[last]=merge?{...o[last],...v}:v;};
  const snap=(v,key)=>({exists:()=>v!=null,val:()=>v==null?null:structuredClone(v),key,forEach:fn=>Object.entries(v||{}).forEach(([k,x])=>fn(snap(x,k)))});
  Object.assign(window,{auth:{},db:{},storage:{},rpc:async()=>45,initializeApp:()=>({}),getAuth:()=>({}),getDatabase:()=>({}),getStorage:()=>({}),GoogleAuthProvider:class{},onAuthStateChanged:(_a,fn)=>setTimeout(()=>fn({uid:'student',displayName:'Ada Student',email:'fake@example.test'}),0),signInWithPopup:async()=>{},signOut:async()=>{},ref:(_d,p)=>p,sref:(_d,p)=>p,get:async p=>snap(read(p)),set:async(p,v)=>write(p,v),update:async(p,v)=>write(p,v,true),push:async(p,v)=>write(p+'/mock',v),remove:async p=>write(p,null),onValue:()=>{},uploadBytesResumable:()=>{},getDownloadURL:async()=>'',deleteObject:async()=>{},__mockDB:data});
}
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  let content;try{content=fs.readFileSync(file);}catch{res.writeHead(404);return res.end();}
  const ext=path.extname(file);res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'text/plain');
  if(ext==='.html')content=content.toString().replace('<script type="module">','<script>').replace(/^import[^\r\n]+;\r?\n/gm,'');
  res.end(content);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const localBinary=path.resolve(root,'../browser-runtime/chromium');
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||(fs.existsSync(localBinary)?localBinary:chromium.executablePath()),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true,env:{...process.env,LD_LIBRARY_PATH:path.resolve(root,'../browser-runtime')}});
  const errors=[];
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
  await context.addInitScript(bootstrap);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const out=path.join(root,'verification');fs.mkdirSync(out,{recursive:true});
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.locator('.lp-welcome').waitFor();
    assert.equal(await page.locator('.step-card').count(),4);
    await page.screenshot({path:path.join(out,'home-landscape.png'),fullPage:true});
    await page.locator('.lp-station[data-step="1"]').click();
    await page.locator('.qo').first().press('Enter');
    await page.getByRole('button',{name:'Continue →',exact:true}).click();
    await page.locator('.lp-project-grid').waitFor();
    assert.equal(await page.locator('[data-product-id]').count(),18);
    await page.locator('[data-product-id="mini_story"]').click();
    assert.equal(await page.locator('[data-product-id="mini_story"]').getAttribute('aria-pressed'),'true');
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(out,'projects-landscape.png'),fullPage:true});
    const animation=await page.locator('.lp-clock').evaluate(el=>{
      const a=el.getAnimations()[0];a.pause();const positions=[];
      for(let i=0;i<24;i++){a.currentTime=i*125+1;positions.push(getComputedStyle(el).backgroundPosition);}
      a.currentTime=3001;const loop=getComputedStyle(el).backgroundPosition;
      const duration=a.effect.getTiming().duration;
      return {unique:new Set(positions).size,first:positions[0],loop,duration};
    });
    assert.equal(animation.unique,24);assert.equal(animation.duration,3000);assert.equal(animation.loop,animation.first);
    await page.getByRole('button',{name:'Pause animation'}).click();
    assert.equal(await page.locator('.lp-clock').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
    const overflow=[];
    for(const size of [{width:1024,height:768},{width:1366,height:768},{width:390,height:844}]){
      await page.setViewportSize(size);
      const o=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      assert.ok(o.document<=o.viewport+1,JSON.stringify(o));overflow.push({...size,...o});
    }
    await page.screenshot({path:path.join(out,'projects-mobile.png'),fullPage:true});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.lp-clock').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.setViewportSize({width:1280,height:800});
    await page.getByRole('button',{name:'Resources',exact:true}).click();
    await page.locator('#res-sugg-title').waitFor();
    await page.getByRole('button',{name:'Submit for Approval'}).click();
    assert.match(await page.locator('#toast').textContent(),/Fill in/);
    assert.equal(errors.length,0,errors.join('\n'));
    fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({checks:['Home milestone routing','Keyboard platform choice','All 18 teacher-defined product options','Choice-state retention','24 distinct CSS sprite frames','Exact 3000ms seamless cycle','Pause control','Reduced motion','1024/1366/390px overflow checks','Resource invalid-submit feedback','No JavaScript errors'],animation,overflow,errors,network:'All external requests blocked; mocked Firebase; no student data touched'},null,2)+'\n');
    console.log('Browser checks passed. Screenshots: verification/*.png');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
