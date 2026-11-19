const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const app = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import[^\r\n]+;\r?\n/gm,'');
const wardrobe = fs.readFileSync(path.join(root,'assets/magical-wardrobe.js'),'utf8').replace(/^export /gm,'');
const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'dangerously',url:'https://example.test/LearnPath/'});
const w = dom.window;
const data = {users:{student:{role:'student',name:'Ada',avatarAnimal:'magic-hedgehog'}},ownedAccessories:{student:{}},coins:{student:28}};
const prices = {'magic-jacket':8,'magic-cap':4,'magic-camera':8,'magic-starlion':24};
const calls = [];
let failNextWrite = false;
const read = key => key.split('/').reduce((value,part)=>value?.[part],data);
const snap = value => ({exists:()=>value!=null,val:()=>structuredClone(value)});
Object.assign(w,{
  auth:{},db:{},storage:{},initializeApp:()=>({}),getAuth:()=>({}),getDatabase:()=>({}),getStorage:()=>({}),GoogleAuthProvider:class {},
  onAuthStateChanged:()=>{},signInWithPopup:async()=>{},signOut:async()=>{},onValue:()=>()=>{},
  ref:(_db,key)=>key,sref:(_db,key)=>key,get:async key=>snap(read(key)),
  set:async()=>{},push:async()=>{},remove:async()=>{},uploadBytesResumable:()=>{},getDownloadURL:async()=>'',deleteObject:async()=>{},
  update:async(key,patch)=>{
    if(failNextWrite){failNextWrite=false;throw new Error('Synthetic network failure');}
    Object.assign(read(key),structuredClone(patch));
  },
  rpc:async(name,args)=>{
    if(name!=='lp_purchase')return data.coins.student;
    calls.push(args.p_item);
    await new Promise(resolve=>setTimeout(resolve,1));
    if(!data.ownedAccessories.student[args.p_item]){
      const cost=prices[args.p_item];
      if(data.coins.student<cost)throw new Error('Not enough coins');
      data.coins.student-=cost;
      data.ownedAccessories.student[args.p_item]=true;
    }
    return data.coins.student;
  }
});
w.eval('(function(){'+wardrobe+';window.MagicalWardrobe={animals,items,isAnimal,fieldForSlot,coin,avatar,shop};})();');
w.eval(fs.readFileSync(path.join(root,'assets/learnpath-ui.js'),'utf8'));
w.eval(fs.readFileSync(path.join(root,'assets/learning-support.js'),'utf8'));
w.eval(fs.readFileSync(path.join(root,'assets/rubric-v2.js'),'utf8'));
w.eval(fs.readFileSync(path.join(root,'assets/navigation.js'),'utf8'));
w.eval(app+'\nwindow.__magicTest={start(){CU={uid:"student"};UP=dataUser;},render:renderShop};');
w.dataUser=data.users.student;
w.__magicTest.start();
(async()=>{
  await w.openCoins();
  assert.equal(w.document.querySelectorAll('.mw-card').length,7);
  await w.magicWearItem('magic-jacket');
  assert.equal(data.users.student.avatarOutfit,'magic-jacket');
  assert.equal(data.coins.student,20);
  await w.magicWearItem('magic-jacket');
  assert.equal(data.users.student.avatarOutfit,null);
  assert.equal(calls.filter(id=>id==='magic-jacket').length,1);
  const first=w.magicWearItem('magic-cap');
  const second=w.magicWearItem('magic-cap');
  await Promise.all([first,second]);
  assert.equal(calls.filter(id=>id==='magic-cap').length,1);
  assert.equal(data.users.student.avatarHead,'magic-cap');
  failNextWrite=true;
  await w.magicWearItem('magic-camera');
  assert.equal(data.coins.student,8);
  assert.notEqual(data.users.student.avatarItem,'magic-camera');
  await w.magicWearItem('magic-camera');
  assert.equal(data.users.student.avatarItem,'magic-camera');
  assert.equal(calls.filter(id=>id==='magic-camera').length,1);
  await w.openCoins();
  assert.equal(w.document.querySelectorAll('.mw-dressing .mw-layer').length,2);
  await w.magicChooseAnimal('magic-starlion');
  assert.equal(data.users.student.avatarAnimal,'magic-hedgehog');
  assert.equal(data.coins.student,8);
  assert.ok(w.document.querySelector('#uav .mw-avatar'));
  assert.equal(w.MagicalWardrobe.items.length,15);
  console.log('Wardrobe save, reload, concurrent click, retry, owned items and insufficient balance OK');
  dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});

