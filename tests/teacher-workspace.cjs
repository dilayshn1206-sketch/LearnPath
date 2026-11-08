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
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN, headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1024, height:768}, hasTouch:true});
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.goto(origin);
    await page.getByRole('heading', {name:'Your class', exact:true}).waitFor();
    assert.equal(await page.locator('#bnav .ni').count(), 5);
    await page.getByRole('button', {name:'More', exact:true}).click();
    await page.getByRole('button', {name:'Project options', exact:true}).click();
    await page.locator('.teacher-product-options').waitFor();
    assert.equal(await page.locator('.teacher-product-row').count(), 9);
    await page.getByRole('button', {name:'More', exact:true}).click();
    await page.getByRole('button', {name:'Unit and grammar', exact:true}).click();
    await page.locator('#gq-image-3').waitFor();
    const encoded = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 120; canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#16787d'; ctx.fillRect(0, 0, 120, 80);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const photo = {name:'test-photo.png', mimeType:'image/png', buffer:Buffer.from(encoded, 'base64')};
    await page.locator('#gq-image-3').setInputFiles(photo);
    await page.waitForFunction(() => __mockDB.unitInfo.grammarQuestions[3].imageUrl?.startsWith('data:image/jpeg'));
    await page.locator('#gq-image-remove-3').click();
    await page.waitForFunction(() => !__mockDB.unitInfo.grammarQuestions[3].imageUrl);
    await page.locator('#gq-image-new').setInputFiles(photo);
    await page.waitForFunction(() => window._newGrammarImageUrl?.startsWith('data:image/jpeg'));
    await page.locator('#gq-text').fill('A teacher question with a photo');
    for (let i = 0; i < 4; i++) await page.locator('#gq-opt-' + i).fill('Option ' + i);
    await page.getByRole('button', {name:'Add Question', exact:true}).click();
    await page.waitForFunction(() => __mockDB.unitInfo.grammarQuestions.at(-1).q === 'A teacher question with a photo');
    assert.ok(await page.evaluate(() => __mockDB.unitInfo.grammarQuestions.at(-1).imageUrl.startsWith('data:image/jpeg')));
    await page.getByRole('button', {name:'Groups', exact:true}).click();
    await page.locator('[data-student="peer"]').waitFor();
    await page.locator('#grp-name').fill('Second team');
    await page.getByRole('button', {name:'Create group', exact:true}).click();
    await page.getByRole('heading', {name:'Second team · 0'}).waitFor();
    const destination = page.locator('.teacher-group').filter({has:page.getByRole('heading', {name:'Second team · 0'})});
    const groupId = await destination.getAttribute('data-group');
    await page.locator('[data-student="peer"]').dragTo(destination);
    await page.waitForFunction(id => __mockDB.users.peer.groupId === id, groupId);
    await page.locator('[data-student="peer"]').click();
    await page.getByRole('button', {name:'Move selected student to Ungrouped', exact:true}).click();
    await page.waitForFunction(() => !__mockDB.users.peer.groupId);
    const handle = await page.locator('[data-student="peer"] .teacher-drag-handle').boundingBox();
    const target = await destination.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const point = {x:handle.x + handle.width / 2, y:handle.y + handle.height / 2};
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[point]});
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:point.x + (target.x + 80 - point.x) * i / 12, y:point.y + (target.y + 80 - point.y) * i / 12}]});
    }
    await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await page.waitForFunction(id => __mockDB.users.peer.groupId === id, groupId);
    await page.getByRole('button', {name:'Lesson controls', exact:true}).click();
    await page.locator('.teacher-session-grid').waitFor();
    await page.getByRole('button', {name:'Send Lesson Reflection', exact:true}).click();
    await page.waitForFunction(() => __mockDB.liveSession.step === 'eval1');
    await page.getByRole('button', {name:'End Session', exact:false}).click();
    await page.waitForFunction(() => !__mockDB.liveSession.active);
    await page.evaluate(() => window.__loginAsStudent());
    await page.getByText('of 4 milestones completed.', {exact:false}).waitFor();
    await page.locator('.step-card').filter({hasText:'What are we learning?'}).click();
    await page.locator('.lp-question-picture').waitFor();
    const positions = await page.locator('.lp-question-picture').evaluate(image => ({photo:image.getBoundingClientRect().x, question:image.parentElement.querySelector('legend').getBoundingClientRect().x}));
    assert.ok(positions.photo < positions.question);
    assert.equal(await page.locator('script[src*="compass-motion"],script[src*="compass-acting"]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('ES-module teacher/student photo flow, nine formats, mouse/touch grouping and lesson controls passed.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
