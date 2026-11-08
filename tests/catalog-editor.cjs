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
  data.ideaCatalog = {written:{mini_story:{name:'Mini Story',active:true}},spoken:{audio_tour:{name:'Audio Tour',active:true}},visual:{campaign_poster:{name:'Campaign Poster',active:true}}};
  const originalUpdate=window.update;
  window.update=async(p,v)=>{if(window.__failCatalogWrite&&p.startsWith('ideaCatalog/'))throw Error('Test save failed. Your edits are still here.');return originalUpdate(p,v);};
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
    return response.end('(' + bootstrap.toString() + ')();(' + teacherFixture.toString() + ')(' + JSON.stringify(unit) + ');');
  }
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); return response.end(); }
  let content;
  try { content = fs.readFileSync(file); } catch { response.writeHead(404); return response.end(); }
  response.setHeader('content-type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
  if (file.endsWith('index.html')) content = content.toString().replace('<head>', '<head><script src="/teacher-test-boot.js"></script>');
  response.end(content);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});try{const page=await browser.newPage({viewport:{width:1024,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());await page.goto(origin);await page.getByRole('heading',{name:'Your class',exact:true}).waitFor();const preserved=await page.evaluate(()=>JSON.stringify(__mockDB.contracts));await page.getByRole('button',{name:'More',exact:true}).click();await page.getByRole('button',{name:'Project options',exact:true}).click();await page.locator('.teacher-product-row').first().waitFor();assert.equal(await page.locator('.teacher-product-row').count(),9);
await page.getByRole('button',{name:'Remove Blog',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.teacher-product-row').length===8);assert.equal(await page.evaluate(()=>__mockDB.ideaCatalog.written.blog.deleted),true);await page.evaluate(()=>tgo('ideas'));await page.locator('.teacher-product-row').first().waitFor();assert.equal(await page.getByRole('button',{name:'Remove Blog',exact:true}).count(),0);
const poster=()=>page.locator('.teacher-product-item[data-product-id="poster"]');await poster().getByRole('button',{name:'Edit Poster',exact:true}).click();await poster().locator('input[type=text]').fill('My classroom poster');await poster().locator('input[type=url]').fill('javascript:alert(1)');await poster().getByRole('button',{name:'Save changes',exact:true}).click();await poster().locator('[role=status]').filter({hasText:'complete http'}).waitFor();assert.equal(await page.evaluate(()=>__mockDB.ideaCatalog.visual.poster),undefined);
await poster().locator('input[type=url]').fill('https://www.google.com/search?q=classroom+poster+examples');await page.evaluate(()=>window.__failCatalogWrite=true);await poster().getByRole('button',{name:'Save changes',exact:true}).click();await poster().locator('[role=status]').filter({hasText:'Test save failed'}).waitFor();assert.equal(await poster().locator('input[type=text]').inputValue(),'My classroom poster');await page.evaluate(()=>window.__failCatalogWrite=false);await poster().getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('button',{name:'Edit My classroom poster',exact:true}).waitFor();assert.equal(await page.evaluate(()=>__mockDB.ideaCatalog.visual.poster.exampleUrl),'https://www.google.com/search?q=classroom+poster+examples');
await page.locator('#new-idea-written').fill('Video diary');await page.locator('#new-idea-link-written').fill('https://example.test/student-examples');await page.locator('#new-idea-written').locator('..').getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Remove Video diary',exact:true}).waitFor();await page.getByRole('button',{name:'Remove Video diary',exact:true}).click();await page.waitForFunction(()=>![...document.querySelectorAll('.teacher-product-row')].some(e=>e.textContent.includes('Video diary')));assert.equal(await page.evaluate(()=>JSON.stringify(__mockDB.contracts)),preserved);
await page.screenshot({path:require('path').join(root,'verification/catalog-editor-teacher.png'),fullPage:true});await page.evaluate(()=>window.__loginAsStudent());await page.locator('.step-card').first().waitFor();await page.evaluate(()=>startQuiz());const f=page.frameLocator('#lp-planner-frame');await f.locator('[data-choice="care"]').click();await f.locator('#next').click();await f.locator('[data-product="poster"]').waitFor();assert.equal(await f.locator('[data-product="blog"]').count(),0);assert.match(await f.locator('[data-product="poster"]').innerText(),/My classroom poster/);const href=await f.locator('.product-item').filter({has:f.locator('[data-product="poster"]')}).locator('.product-example-link').getAttribute('href');assert.equal(href,'https://www.google.com/search?q=classroom+poster+examples');assert.match(await f.locator('.product-item').filter({has:f.locator('[data-product="comic"]')}).locator('a').getAttribute('href'),/^https:\/\/www.google.com\/search/);await page.screenshot({path:require('path').join(root,'verification/catalog-editor-student.png'),fullPage:true});
await page.evaluate(()=>{__mockDB.contracts.student={productId:'blog',productType:'Blog',topic:'An old idea',category:'written',weakness:'writing',weaknessTips:['Plan','Write','Check'],platforms:['own'],status:'draft'};return startQuiz();});await f.getByRole('heading',{name:'My project idea',exact:true}).waitFor();const frame=page.frames().find(x=>x.url().includes('planner.html'));await frame.evaluate(()=>{state.step=1;render();});assert.match(await f.locator('.retired-product-note').innerText(),/Blog/);assert.equal(await page.evaluate(()=>__mockDB.contracts.student.productType),'Blog');assert.deepEqual(errors,[]);console.log('PASS: virtual default removal persists, existing names and links editable, unsafe links rejected, failed saves retain edits, custom add/remove, student catalog and teacher destinations, Google fallback and saved plans preserved.');}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});