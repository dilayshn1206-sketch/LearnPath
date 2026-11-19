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

import {wardrobeParts} from './magical-wardrobe-parts.js?v=20261119-4';
const headTemplates = {
 hedgehog:[[40,10,42,26],[36,8,48,38],[43,5,37,26],[41,3,40,30],[42,3,40,30]],
 rainotter:[[31,-5,40,22],[29,-5,44,31],[34,-8,34,23],[32,-8,40,23],[32,-8,40,23]],
 moonrabbit:[[45,-5,38,25],[39,-5,47,41],[47,-7,34,28],[45,-6,39,30],[46,-6,39,30]],
 sunpanda:[[36,-4,41,25],[32,-3,48,41],[40,-7,34,28],[38,-6,39,30],[39,-6,39,30]],
 cloudowl:[[31,-4,44,27],[27,-3,53,41],[37,-7,36,29],[33,-7,42,31],[33,-7,42,31]],
 auroradeer:[[46,7,40,25],[41,7,47,36],[49,5,34,25],[46,3,40,29],[46,3,40,29]],
 starlion:[[42,-5,43,27],[38,-4,51,40],[46,-7,36,28],[43,-7,43,31],[43,-7,43,31]]
};
const propTargets = {
 hedgehog:[[44,58,31,37],[43,65,35,29],[50,57,24,40],[44,48,38,49],[49,60,28,35]],
 rainotter:[[44,42,33,37],[43,43,35,32],[37,47,27,47],[43,33,42,56],[48,42,30,36]],
 moonrabbit:[[45,38,30,52],[43,38,34,52],[48,37,27,54],[44,36,37,55],[48,38,28,51]],
 sunpanda:[[42,38,31,48],[40,38,35,49],[46,37,28,52],[41,35,40,55],[45,38,29,49]],
 cloudowl:[[38,37,34,50],[35,37,38,51],[42,36,30,55],[36,34,44,58],[41,37,32,51]],
 auroradeer:[[53,40,29,43],[51,40,32,44],[54,39,27,49],[51,38,36,51],[54,40,28,44]],
 starlion:[[51,47,31,40],[47,47,35,41],[52,45,29,47],[48,44,39,49],[52,47,29,42]]
};
function piece(source,atlas,index,rect,classes,extra=''){
 const [left,top,width,height]=atlas.frames[index],[x,y,w,h]=rect;
 return '<span class="'+classes+'" '+extra+' style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%;background-image:url('+source+');background-size:'+(100*atlas.width/width)+'% '+(100*atlas.height/height)+'%;background-position:'+(100*left/(atlas.width-width))+'% '+(100*top/(atlas.height-height))+'%"></span>';
}
export function avatar(user) {
 if(!isAnimal(user?.avatarAnimal))return '';
 const id=user.avatarAnimal.slice(6);
 const [outfit,head,held]=groups.map(slot=>items.filter(item=>item.slot===slot).findIndex(item=>item.id===user[fields[slot]]));
 // The body owns its costume, face and every limb. Accessories never carry anatomy.
 let contents=piece('assets/magic-bodies-'+id+'.webp',wardrobeParts.bodies[id],outfit+1,[0,0,100,100],'mw-layer mw-body','data-outfit="'+(outfit>=0?items.filter(i=>i.slot==='outfit')[outfit].id:'')+'"');
 if(held>=0)contents+=piece('assets/magic-props-v2.webp',wardrobeParts.props,(['hedgehog','rainotter'].includes(id)?0:5)+held,id==='rainotter'&&outfit<0&&held===2?[46,39,27,47]:propTargets[id][held],'mw-piece mw-prop');
 if(head>=0)contents+=piece('assets/magic-heads-'+id+'.webp',wardrobeParts.heads[id],head,headTemplates[id][head],'mw-piece mw-headwear');
 const name=animals.find(animal=>animal.id===user.avatarAnimal).name;
 return '<span class="mw-avatar" role="img" aria-label="'+escapeText(name)+'"><span class="mw-doll">'+contents+'</span></span>';
}
const decodedArt=new Map();
export async function preload(user){
 if(!isAnimal(user?.avatarAnimal)||typeof Image!=='function')return;
 const id=user.avatarAnimal.slice(6),sources=['assets/magic-bodies-'+id+'.webp'];
 if(user.avatarHead)sources.push('assets/magic-heads-'+id+'.webp');
 if(user.avatarItem)sources.push('assets/magic-props-v2.webp');
 await Promise.all(sources.map(source=>{
  if(!decodedArt.has(source)){
   const art=new Image();art.src=source;
   const ready=typeof art.decode==='function'?art.decode():Promise.resolve();
   decodedArt.set(source,ready.catch(error=>{decodedArt.delete(source);throw error;}));
  }
  return decodedArt.get(source);
 }));
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
  for(const [id,label] of [['animals','Animals'],['outfit','Outfits'],['head','Accessories'],['item','Things to hold'],['earn','Earn coins']]) {
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

