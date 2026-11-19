export const animals = [
  {id:'magic-hedgehog',name:'Prickle Pickle',cost:0,description:'A tiny glowing garden in my spines.'},
  {id:'magic-rainotter',name:'Otterly Drizzly',cost:0,description:'A little rain follows my tail.'},
  {id:'magic-moonrabbit',name:'Hop Moon',cost:0,description:'Moonlight and star freckles.'},
  {id:'magic-sunpanda',name:'Sunny Side Up',cost:0,description:'A sunset wrapped around my tail.'},
  {id:'magic-cloudowl',name:'Cloud Nine',cost:0,description:'Soft clouds around my wings.'},
  {id:'magic-auroradeer',name:'Deerly Magical',cost:20,description:'Crystal antlers and northern lights.'},
  {id:'magic-starlion',name:'Sir Roars-a-Lot',cost:24,description:'A whole night sky in my mane.'}
];
export const items = [
  {id:'magic-scarf',slot:'outfit',name:'Knot a Problem',cost:4},
  {id:'magic-jacket',slot:'outfit',name:'Pocket Rocket',cost:8},
  {id:'magic-cape',slot:'outfit',name:'Cape Escape',cost:15},
  {id:'magic-patch-vest',slot:'outfit',name:'Oops! Patch Vest',cost:4},
  {id:'magic-raincoat',slot:'outfit',name:'Puddle Patrol',cost:8},
  {id:'magic-cap',slot:'head',name:'Beanie There',cost:4},
  {id:'magic-helmet',slot:'head',name:'Captain Whoosh',cost:8},
  {id:'magic-crown',slot:'head',name:'Your Sparkle Highness',cost:15},
  {id:'magic-wobble-ears',slot:'head',name:'Wobble Ears',cost:8},
  {id:'magic-tiny-orbit',slot:'head',name:'Tiny Orbit',cost:15},
  {id:'magic-book',slot:'item',name:'Little Book of Oops',cost:4},
  {id:'magic-camera',slot:'item',name:'Cheese Please',cost:8},
  {id:'magic-lantern',slot:'item',name:'Glow Getter',cost:15},
  {id:'magic-pocket-kite',slot:'item',name:'Pocket Kite',cost:4},
  {id:'magic-bubble-lab',slot:'item',name:'Bubble Lab',cost:15}
];
const fields = {outfit:'avatarOutfit',head:'avatarHead',item:'avatarItem'};
const groups = ['outfit','head','item'];
const escapeText = text => String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const isAnimal = id => animals.some(animal=>animal.id===id);
export const fieldForSlot = slot => fields[slot];
export const coin = '<img class="mw-coin" src="assets/magic-coin.webp" alt="" aria-hidden="true">';
function layer(id,row,column,mask,feather=false) {
  return '<span class="mw-layer" style="background-image:url(assets/magic-fitted-'+id+'.webp);background-position:'+(column*25)+'% '+(row*50)+'%;'+(feather?'mask-image:linear-gradient(to bottom,#000 '+(97-headCuts[id])+'%,transparent '+(100-headCuts[id])+'%);':mask?'clip-path:'+mask+';':'clip-path:inset(0 0 2% 0);')+'"></span>';
}
const headCuts = {hedgehog:47,rainotter:68,moonrabbit:60,sunpanda:63,cloudowl:60,auroradeer:65,starlion:61};
const propAreas = {
  hedgehog:['inset(48% 9% 2% 34% round 10%)','inset(50% 9% 10% 35% round 10%)','inset(43% 10% 0 35% round 10%)','inset(26% 0 0 33% round 10%)','inset(46% 7% 3% 34% round 10%)'],
  rainotter:['inset(29% 10% 28% 38% round 8%)','inset(33% 9% 27% 38% round 8%)','inset(30% 10% 8% 38% round 8%)','inset(17% 0 6% 29% round 8%)','inset(28% 7% 28% 41% round 8%)'],
  moonrabbit:['inset(36% 9% 5% 36% round 8%)','inset(45% 6% 17% 39% round 8%)','inset(22% 7% 7% 47% round 8%)','inset(15% 0 0 38% round 8%)','inset(32% 5% 8% 40% round 8%)'],
  sunpanda:['inset(37% 4% 12% 40% round 8%)','inset(41% 3% 15% 37% round 8%)','inset(27% 1% 8% 43% round 8%)','inset(29% 0 0 32% round 8%)','inset(35% 1% 11% 40% round 8%)'],
  cloudowl:['inset(33% 7% 6% 34% round 8%)','inset(39% 3% 13% 30% round 8%)','inset(23% 1% 0 40% round 8%)','inset(20% 0 0 28% round 8%)','inset(28% 0 6% 38% round 8%)'],
  auroradeer:['inset(27% 0 0 48% round 8%)','inset(33% 0 0 42% round 8%)','inset(18% 0 0 48% round 8%)','inset(13% 0 0 44% round 8%)','inset(28% 0 0 48% round 8%)'],
  starlion:['inset(35% 0 0 43% round 8%)','inset(41% 0 0 41% round 8%)','inset(29% 0 0 44% round 8%)','inset(23% 0 0 37% round 8%)','inset(33% 0 0 43% round 8%)']
};
export function avatar(user) {
  if(!isAnimal(user?.avatarAnimal)) return '';
  const id = user.avatarAnimal.slice(6);
  const equipped = groups.map(slot=>items.find(item=>item.slot===slot && item.id===user[fields[slot]]));
  const baseRow = equipped.findIndex(Boolean);
  let contents = '<img src="assets/magic-'+id+'.webp" alt="" class="mw-base" loading="lazy">';
  if(baseRow>=0) {
    const column=items.filter(item=>item.slot===groups[baseRow]).indexOf(equipped[baseRow]);
    contents=layer(id,baseRow,column);
  }
  if(equipped[0] && equipped[1]) {
    contents+=layer(id,1,items.filter(item=>item.slot==='head').indexOf(equipped[1]),'inset(0 0 '+headCuts[id]+'% 0)',true);
  }
  if(equipped[2] && baseRow!==2) {
    const column=items.filter(item=>item.slot==='item').indexOf(equipped[2]);
    contents+=layer(id,2,column,propAreas[id][column]);
  }
  return '<span class="mw-avatar" role="img" aria-label="'+escapeText(animals.find(animal=>animal.id===user.avatarAnimal).name)+'">'+contents+'</span>';
}
function button(label,handler,disabled=false,primary=false) {
  return '<button type="button" class="btn '+(primary?'btp':'bts')+'" onclick="'+handler+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
}
export function shop(state) {
  const tab=state.tab||'animals';
  const animal=isAnimal(state.user.avatarAnimal)?state.user.avatarAnimal:animals[0].id;
  const previewUser={...state.user,...state.preview,avatarAnimal:state.preview.avatarAnimal||animal};
  let html='<section class="mw-shop"><div class="mw-shop-heading"><div><h1>My magical animal</h1><p>Choose your animal. Try an outfit and make it yours.</p></div><div class="mw-wallet">'+coin+'<strong>'+state.coins+'</strong><span>coins</span></div></div>';
  html+='<nav class="mw-tabs" aria-label="Animal shop">';
  for(const [id,label] of [['animals','Animals'],['outfit','Outfits'],['head','Accessories'],['item','Things to hold'],['earn','Earn coins'],['classic','Classic collection']]) {
    html+='<button type="button" aria-pressed="'+(id===tab)+'" onclick="magicShopTab(\''+id+'\')">'+label+'</button>';
  }
  html+='</nav><div class="mw-shop-layout"><aside class="mw-dressing"><h2>'+escapeText(animals.find(entry=>entry.id===previewUser.avatarAnimal)?.name||'Your animal')+'</h2><div class="mw-large-preview">'+avatar(previewUser)+'</div><p>'+(Object.keys(state.preview).length?'Trying it on':isAnimal(state.user.avatarAnimal)?'Your saved look':'Choose an animal to save your look')+'</p>'+button('Show saved look','magicClearPreview()',state.busy)+'</aside><div class="mw-catalog">';
  if(tab==='animals') {
    for(const [paid,title] of [[false,'Choose a free animal'],[true,'Special animals']]) {
      html+='<h2>'+title+'</h2><div class="mw-cards">';
      for(const entry of animals.filter(candidate=>(candidate.cost>0)===paid)) {
        const owned=!entry.cost || !!state.owned[entry.id];
        const selected=state.user.avatarAnimal===entry.id;
        html+='<article class="mw-card'+(entry.cost?' mw-special':'')+'"><div class="mw-card-art">'+avatar({...state.user,avatarAnimal:entry.id})+'</div><h3>'+entry.name+'</h3><p>'+entry.description+'</p><div class="mw-price">'+(entry.cost?coin+entry.cost+' coins':'Free')+'</div><div class="mw-actions">';
        if(entry.cost) html+=button('Try','magicTryAnimal(\''+entry.id+'\')',state.busy);
        html+=button(selected?'Selected':owned?'Choose':state.coins<entry.cost?(entry.cost-state.coins)+' more coins':'Buy and choose','magicChooseAnimal(\''+entry.id+'\')',state.busy||selected||(!owned&&state.coins<entry.cost),true);
        html+='</div></article>';
      }
      html+='</div>';
    }
  } else if(groups.includes(tab)) {
    html+='<h2>'+({outfit:'Outfits',head:'Head accessories',item:'Things to hold'})[tab]+'</h2><p>Every piece is shown on your chosen animal.</p><div class="mw-cards">';
    for(const entry of items.filter(candidate=>candidate.slot===tab)) {
      const owned=!!state.owned[entry.id];
      const wearing=state.user[fields[tab]]===entry.id;
      html+='<article class="mw-card"><div class="mw-card-art">'+avatar({avatarAnimal:previewUser.avatarAnimal,[fields[tab]]:entry.id})+'</div><h3>'+entry.name+'</h3><div class="mw-price">'+coin+entry.cost+' coins</div><div class="mw-actions">'+button('Try','magicTryItem(\''+entry.id+'\')',state.busy)+button(wearing?'Take off':owned?'Wear':state.coins<entry.cost?(entry.cost-state.coins)+' more coins':'Buy and wear','magicWearItem(\''+entry.id+'\')',state.busy||(!owned&&state.coins<entry.cost),true)+'</div></article>';
    }
    html+='</div>';
  } else if(tab==='earn') {
    html+='<h2>How you earn coins</h2><dl class="mw-earn">';
    for(const [label,value] of [['Finish the unit word check and grammar',2],['Save your project idea',2],['Send your Learning Passport',2],['Share a project',5],['Give feedback on a classmate’s project',5],['Complete a lesson reflection',2],['Complete your project reflection',5],['Share a resource your teacher approves',3]]) {
      html+='<div><dt>'+label+'</dt><dd>'+coin+'+'+value+'</dd></div>';
    }
    html+='</dl><p>The same saved activity earns its reward once. Separate project shares, feedback, lesson reflections and approved resources can add more coins.</p><div class="mw-budget"><strong>An example unit earns 28 coins</strong><p>This example includes one project share, one classmate’s feedback, two lesson reflections and one approved resource.</p><p>A free animal + three 4-coin pieces costs 12 coins. Deerly Magical + an 8-coin piece costs 28. Sir Roars-a-Lot + a 4-coin piece costs 28.</p></div>';
  }
  return html+'</div></div><p class="mw-shop-status" role="status">'+escapeText(state.message||'')+'</p></section>';
}

