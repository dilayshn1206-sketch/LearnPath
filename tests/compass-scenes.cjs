/* Real ES-module entry point with isolated records and blocked external requests. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const browserSource = fs.readFileSync(path.join(__dirname, 'browser.cjs'), 'utf8');
const bootstrap = new Function('return ' + browserSource.slice(browserSource.indexOf('function bootstrap()'), browserSource.indexOf('const server=')))();
const unit = JSON.parse(fs.readFileSync(path.join(root, 'assets/unit-starter.json'), 'utf8'));
function teacherFixture(unitInfo) {
  const data = window.__mockDB;
  data.users.student.role = 'teacher';
  data.users.student.enrolled = true;
  data.users.peer = {role:'student', enrolled:true, name:'Test learner', groupId:'g1'};
  data.groups = {g1:{name:'First team', members:{peer:'Test learner'}}};
  data.contracts = {peer:{productType:'Comic', topic:'Online kindness', studentName:'Test learner', status:'pending'}};
  data.unitInfo = unitInfo;
  data.ideaCatalog = {};
  const snapshot = value => ({
    exists: () => value != null, val: () => structuredClone(value),
    forEach: fn => Object.entries(value || {}).forEach(([key, item]) => fn({...snapshot(item), key}))
  });
  window.onValue = (record, callback) => {
    callback(snapshot(record.split('/').filter(Boolean).reduce((obj, key) => obj?.[key], data)));
    return () => {};
  };
  window.onAuthStateChanged = (_auth, callback) => {
    window.__loginAsStudent = () => {
      data.users.student.role = 'student';
      return callback({uid:'student', displayName:'Test student', email:'student@example.test'});
    };
    setTimeout(() => callback({uid:'student', displayName:'Test teacher', email:'teacher@example.test'}), 0);
  };
  window.rpc = async (name, args) => {
    if (name !== 'lp_assign_group') return 45;
    const student = data.users[args.p_student];
    const group = args.p_group;
    if (!student || (group && !data.groups[group])) throw Error('Unavailable assignment');
    if (student.groupId) delete data.groups[student.groupId].members[args.p_student];
    student.groupId = group;
    student.groupName = group ? data.groups[group].name : null;
    if (group) data.groups[group].members[args.p_student] = student.name;
    return {groupId:group};
  };
}
const exported = 'auth,db,storage,rpc,ref,set,get,push,onValue,update,remove,sref,uploadBytesResumable,getDownloadURL,deleteObject,onAuthStateChanged,signInWithPopup,signOut';
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://local');
  if (url.pathname === '/assets/supabase-backend.js') {
    response.setHeader('content-type', 'text/javascript');
    return response.end('export const {' + exported + '}=window;');
  }
  if (url.pathname === '/teacher-test-boot.js') {
    response.setHeader('content-type', 'text/javascript');
    return response.end('(' + bootstrap.toString() + ')();');
  }
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); return response.end(); }
  let content;
  try { content = fs.readFileSync(file); } catch { response.writeHead(404); return response.end(); }
  response.setHeader('content-type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
  if (file.endsWith('index.html')) content = content.toString().replace('<head>', '<head><script src="/teacher-test-boot.js"></script>');
  response.end(content);
});

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});try{const page=await browser.newPage({viewport:{width:1024,height:768}});page.setDefaultTimeout(10000);const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))failed.push(r.url());});await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());await page.goto(origin);await page.locator('.step-card').first().waitFor();await page.locator('.workshop-compass[data-workshop-ready]').waitFor();assert.equal(await page.evaluate(()=>LearnPathScenes.activeScene),'home');
await page.evaluate(()=>startQuiz());await page.locator('#lp-planner-frame').waitFor();await page.waitForFunction(()=>document.querySelector('#lp-planner-frame').contentWindow?.LearnPathScenes);const frame=page.frames().find(f=>f.url().includes('planner.html'));await frame.waitForFunction(()=>window.LearnPathScenes?.activeScene==='idea-topic');const manifest=[];
async function check(id){await frame.waitForFunction(id=>window.LearnPathScenes.activeScene===id,id);await frame.locator('[data-workshop-ready]').waitFor();assert.equal(await frame.locator('.workshop-compass,.point-v1-sprite').count(),1,id);const value=await frame.evaluate(()=>({id:LearnPathScenes.activeScene,variant:document.querySelector('[data-variant]').dataset.variant,overflow:document.documentElement.scrollWidth>innerWidth+1,animations:document.getAnimations().length}));if(value.overflow)console.log(await frame.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,c:e.className,x:e.getBoundingClientRect().x,r:e.getBoundingClientRect().right,w:e.getBoundingClientRect().width})).filter(e=>e.r>innerWidth+1).slice(-12)));assert.equal(value.overflow,false,JSON.stringify(value));manifest.push(value);}
for(let step=0;step<5;step++){await frame.evaluate(step=>{state.step=step;state.topic='care';state.format='poster';state.category='visual';state.tools=['design'];state.weakness='writing';state.saved=false;render();},step);await check(['idea-topic','idea-product','idea-tools','idea-hardest','idea-recap'][step]);if(step===1){await frame.locator('#chat-input').fill('I like games');assert.equal(await frame.locator('#chat-input').inputValue(),'I like games');}}
await frame.evaluate(()=>{openPassport();passport.goals={unitWords:true,grammar:true,structure:true};passport.planTails=['plan my work.','write my draft.','check my work.'];});
for(let step=0;step<3;step++){await frame.evaluate(step=>{passport.step=step;passport.view='edit';render();},step);await check(['passport-goals','passport-plan','passport-targets'][step]);}
await frame.evaluate(()=>showOverview());await check('passport-review');await frame.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.passport-plan-section')).opacity)>.99);await page.screenshot({path:path.join(root,'verification/approved-passport-motion.png'),fullPage:true});
await page.emulateMedia({reducedMotion:'reduce'});await frame.waitForFunction(()=>document.querySelectorAll('.workshop-compass').length===1&&document.querySelector('[data-workshop-ready]'));assert.equal(await frame.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest('.workshop-compass')).length),0);await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>{document.querySelector('#mc').innerHTML=LearnPathUI.productLaunch('Poster');});await page.waitForFunction(()=>LearnPathScenes.activeScene==='examples');await page.locator('[data-workshop-ready]').waitFor();assert.equal(await page.locator('.point-v1-sprite').count(),1);assert.ok(await page.locator('.lp-launch-examples').isVisible());await page.screenshot({path:path.join(root,'verification/approved-examples-motion.png'),fullPage:true});
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelectorAll('.point-v1-sprite').length===1);await page.emulateMedia({reducedMotion:'no-preference'});
await page.setViewportSize({width:1024,height:768});await page.route('**/compass-workshop-wave.png',r=>r.abort());await page.goto(origin);await page.locator('.step-card').first().waitFor();await page.waitForFunction(()=>window.LearnPathScenes?.activeScene==='home'&&!document.querySelector('.lp-welcome .workshop-compass')&&document.querySelector('.lp-welcome .lp-clock'));assert.ok(await page.locator('.lp-welcome .lp-clock').isVisible());assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({passed:true,scenes:11,manifest,errors,failed}));}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
