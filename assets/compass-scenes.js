/* Five scene-specific choreography choices. Art stays in the real page. */
(function(root){
 const rows={
  home:[
   ['Sakin selamlama','Kısa el sallama ve uzun dinlenme.','calm'],
   ['İki küçük selam','İki bilek hareketi, sonra bekleme.','double'],
   ['Yaklaş ve selamla','Kısa bir yaklaşma, el sallama ve yerine dönüş.','enter'],
   ['Meraklı karşılama','Hafif baş-gövde eğimiyle selamlama.','tilt'],
   ['Canlı karşılama','Küçük bir yaylanmayla el sallama.','bounce']],
  'idea-topic':[
   ['Kısa dans, uzun mola','Bir dans döngüsünün ardından sohbeti işaretleyen vurgu.','calm'],
   ['İki küçük hareket','İki kısa dans hareketi arasında duraklama.','double'],
   ['Sohbete yaklaş','Compass sohbet başlığına yaklaşarak dans eder.','enter'],
   ['Ritmik davet','Küçük bir yana eğilme ile dans daveti.','tilt'],
   ['Enerjik davet','Daha yüksek tek bir sıçrama, sonra sohbet vurgusu.','bounce']],
  'idea-product':[
   ['Başlıkta bekle','Her başlık üzerinde uzun bekleme ve alçak sıçrama.','calm'],
   ['Küçük çift sıçrama','Başlıklar arasında iki alçak yay, sonra bekleme.','double'],
   ['Soldan başlayan tur','Önce Written, sonra Spoken ve Visual.','enter'],
   ['Yumuşak geçiş','Geniş, düşük yayla başlıklar arasında ilerleme.','tilt'],
   ['Belirgin sıçrama','Yüksek yay ve yumuşak iniş, ardından başlıkta bekleme.','bounce']],
  'idea-tools':[
   ['Ekranı incele','Laptopu aç, yavaşça incele ve bekle.','calm'],
   ['İki kısa çalışma','Kısa yazma hareketini iki kez yap.','double'],
   ['Laptopla yaklaş','Compass laptopuyla rehber alanına yaklaşır.','enter'],
   ['Düşünerek çalış','Laptopa bakarken küçük bir yana eğilme.','tilt'],
   ['Bir fikrim var','Çalışmanın sonunda küçük bir sevinç hareketi.','bounce']],
  'idea-hardest':[["Yerinde zorlanma","Compass yerinde kalır, dambılı kaldırırken terler.","calm"],["İki kısa tekrar","Aynı yerde iki kısa kaldırma temposu.","double"],["Dengeli kaldırma","Yerinde, orta tempolu kaldırma ve indirme.","enter"],["Ağır ve yavaş","Ağırlığı daha yavaş kaldırır ve dinlenir.","tilt"],["Kısa egzersiz","Yerinde daha canlı bir kaldırma döngüsü.","bounce"]],
  'idea-recap':[["Hedef hedef göster","İlk hedefi gösterir, aşağı inip ikinci ve üçüncüyü gösterir.","calm"],["Kısa hatırlatmalar","Her hedefin yanında kısa bir işaret ve okuma molası.","double"],["Akıcı iniş","Hedeflerin yanından yavaşça aşağı iner.","enter"],["Uzun okuma molası","Her hedefte daha uzun bekleyerek sırayla işaret eder.","tilt"],["Dinamik işaret","Hedefler yanarken daha hızlı aşağı inip işaret eder.","bounce"]],
  'examples':[
   ['Sakin işaret','Düğmeye uzan ve uzun süre göster.','calm'],
   ['İki küçük dokunuş','Düğmeye doğru iki kısa el uzatma.','double'],
   ['Yaklaş ve göster','Compass düğmeye biraz yaklaşarak işaret eder.','enter'],
   ['Bak, sonra göster','Önce düğmeye bakış, sonra yavaş işaret.','tilt'],
   ['Dokunma denemesi','Parmak uzanırken düğme hafifçe yaylanır.','bounce']],
  'passport-goals':[
   ['Uzun düşünme','Gözlüklü düşünme pozunda okuma molası.','calm'],
   ['İki düşünme anı','Bir düşün, bekle ve yeniden düşün.','double'],
   ['Hedeflere yaklaş','Compass hedef listesinin yanına yaklaşır.','enter'],
   ['Meraklı bakış','Gözlüklerle hafif eğilerek hedefleri inceler.','tilt'],
   ['Fikir geldi','Düşündükten sonra küçük bir sevinç hareketi.','bounce']],
  'passport-plan':[
   ['Öneri, sonra boşluk','Önce yukarıdaki önerilere, sonra yazma alanına işaret.','calm'],
   ['İki kez hatırlat','Yukarı-aşağı yönlendirmesini iki kez yap.','double'],
   ['Yazmaya yaklaş','Yazma alanına küçük bir yaklaşma.','enter'],
   ['Dönüşümlü bakış','İşaret ederken öneri ve boşluk yönüne hafif eğilme.','tilt'],
   ['Yazma daveti','Yönlendirme sonunda boşluklarda kısa bir dikkat vurgusu.','bounce']],
  'passport-targets':[["Ağaç altında mola","Önceki ağaç tarzında rahat uzanış ve hafif yaprak hareketi.","calm"],["Kısa esinti","Aynı dinlenme sahnesinde daha hızlı bir yaprak döngüsü.","double"],["Dengeli mola","Ağaç altında dinlenme ve orta tempolu esinti.","enter"],["Uzun dinlenme","Yavaş yaprak hareketiyle sakin okuma alanı.","tilt"],["Hafif rüzgâr","Biraz daha canlı yaprak hareketi.","bounce"]],
  'passport-review':[
   ['Damga, sonra özet','Damgadan sonra hedefler ve adımlar sırayla açılır.','calm'],
   ['İki damga denemesi','İki kısa damga hareketi, sonra özet.','double'],
   ['Belgeye yaklaş','Compass belgeye yaklaşır, damgalar ve yerine döner.','enter'],
   ['İncele ve damgala','Küçük inceleme eğimi, sonra damga.','tilt'],
   ['Kutlama damgası','Damgadan sonra küçük bir kutlama ve özet.','bounce']]
 };
 const styles={
  calm:{duration:1.55,arc:14,hold:.38},
  double:{duration:1.2,arc:18,hold:.32},
  enter:{duration:1.35,arc:22,hold:.32},
  tilt:{duration:1.65,arc:10,hold:.42},
  bounce:{duration:1.3,arc:48,hold:.34}
 };
 root.CompassWorkshopOptions={
  rows,
  get(scene,index){
   const selected=rows[scene]?.[index-1]||rows[scene]?.[0];
   return selected?{title:selected[0],description:selected[1],style:selected[2],...styles[selected[2]]}:null;
  },
  index(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=5?n:1;}
 };
})(window);

/* Approved panel selections, revision 188. Decorative motion only. */
(function(){'use strict';
const base=new URL('.',document.currentScript.src),asset=name=>new URL(name,base).href;
const selections={"home":1,"idea-topic":3,"idea-product":3,"idea-tools":2,"idea-hardest":1,"idea-recap":3,"examples":3,"passport-goals":2,"passport-plan":1,"passport-targets":1,"passport-review":5};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,scheduled=false;
function identify(){
 const screen=document.getElementById('screen');
 if(screen){
  if(screen.querySelector('.passport-document'))return ['passport-review',screen.querySelector('.passport-document')];
  const guide=screen.querySelector('.contract-guide');
  if(guide){const selected=document.querySelector('#steps .current[data-passport-step]');return [['passport-goals','passport-plan','passport-targets'][Number(selected?.dataset.passportStep)||0],guide];}
  const step=Number(document.body.dataset.plannerStep);
  const id=['idea-topic','idea-product','idea-tools','idea-hardest','idea-recap'][step];
  const anchor=screen.querySelector(step===4?'.focus-goals':'.chat-header');
  if(id&&anchor)return [id,anchor];
 }
 const launch=document.querySelector('#mc .lp-product-launch');if(launch)return ['examples',launch];
 const home=document.querySelector('#mc .lp-welcome');if(home)return ['home',home];
 return null;
}
function mount(scene,anchor){
 let disposed=false;const animations=[],restore=[];
 const variant=selections[scene];
 function run(el,keys,settings){const a=el.animate(keys,settings);animations.push(a);if(document.hidden)a.pause();return a;}
 function dispose(){disposed=true;animations.forEach(a=>a.cancel());restore.forEach(fn=>fn());}
 const session={scene,anchor,animations,dispose};active=session;
 function sceneMotion(){  const scenes = {
    home: ['finish', 0, '.lp-welcome .lp-clock', '.lp-welcome', 'Welcome!'],
    'idea-topic': ['choices', 0, '.chat-header .lp-clock', '.chat-header', 'Ask me! Ask me!'],
    'idea-product': ['choices', 1, '.chat-header .lp-clock', '.chat-header'],
    'idea-tools': ['choices', 2, '.chat-header .lp-clock', '.chat-header'],
    'idea-hardest': ['choices', 3, '.chat-header .lp-clock', '.chat-header'],
    'idea-recap': ['goals', 0, '.focus-goals .lp-clock', '.focus-goals'],
    'passport-goals': ['goals', 2, '.contract-guide .lp-clock', '.contract-guide'],
    'passport-plan': ['goals', 3, '.contract-guide .lp-clock', '.contract-guide'],
    'passport-targets': ['finish', 1, '.contract-guide .lp-clock', '.contract-guide'],
    'passport-review': ['finish', 2, '.passport-document-guide .lp-clock', '.passport-document-guide']
  };
  const option=CompassWorkshopOptions.get(scene,variant);
  const spec = scenes[scene];
  if (!spec) return;
  const [sheet, row, mascotSelector, hostSelector, line] = spec;
  const idle = document.querySelector(mascotSelector);
  const host = idle?.parentElement || document.querySelector(hostSelector);
  if (!host) return;

  const styled=Promise.resolve();
  const art = document.createElement('div');
  art.className = 'workshop-compass';
  art.setAttribute('role', 'img');
  art.setAttribute('aria-label', 'Compass');
  art.dataset.variant=String(variant);
  const originalParent=idle?.parentElement,originalNext=idle?.nextSibling;
  restore.push(()=>{if(idle&&originalParent?.isConnected)originalParent.insertBefore(idle,originalNext?.parentElement===originalParent?originalNext:null);art.remove();});
  if (idle) idle.replaceWith(art);
  else host.append(art);
  const pose=document.createElement('div');
  pose.className='workshop-pose';
  art.append(pose);
  if (scene === 'idea-topic') {
    const ask = document.querySelector('[data-ask-compass]');
    if (ask) ask.textContent = line;
  }
  if (scene === 'home' && line) {
    const speech = document.createElement('span');
    speech.className = 'workshop-speech';
    speech.textContent = line;
    art.after(speech);
    restore.push(()=>speech.remove());
  }
  const bubble=document.querySelector('.contract-guide .compass-speech');
  if(bubble){
    if(scene==='passport-goals')bubble.textContent='Choose goals that fit your project.';
    if(scene==='passport-plan')bubble.textContent='Use these ideas.\nOr write your own steps.';
    if(scene==='passport-targets')bubble.textContent='Do grades matter?';
  }


  const timings = [0, .18, .42, .76, 1];
  const positions = [0, 1, 2, 3, 3];
  // Each revised sheet contains two adjacent eight-pose clips.
  const revised = {
    home: ['wave', 0, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]],
    'idea-topic': ['play', 0, [0,1,2,3,4,4,5,6,7,0,0]],
    'idea-product': ['tour', 0, [0,1,2,3,4,5,6,7]],
    'idea-tools': ['play', 8, [0,1,2,3,4,5,6,7]],
    'idea-hardest': ['weights-v2',0,[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]],
    'idea-recap': ['point',0,[0,1,2,3,4,5,6,7,8]],
    'passport-plan': ['passport', 0, [0,1,2,3,3,4,5,6,7,7]],
    'passport-targets': ['welcome', 8, [0,1,2,3,4,5,6,7]],
    'passport-review': ['passport', 8, [0,1,2,3,4,4,5,6,7]]
  }[scene];
  const sheetURL=name=>asset(name==='point'?'compass-point-v1.png':'compass-workshop-'+name+'.png');
  const spot = (column, line) => (column * 100 / 3) + '% ' + (line * 100 / 3) + '%';
  let floorOffsets = [];
  let bodyOffsets=[];
  const frames = (line, slots = positions) => slots.map((column, i) => ({
    offset: timings[i], backgroundPosition: spot(column, line), easing: 'steps(1,end)'
  }));
  function gesture(element, line, duration, delay = 0, slots) {
    const keys = revised ? revisedFrames(revised[2]) : frames(line, slots);
    return (element===art?pose:element).animate(keys, {duration:duration*option.duration, delay:delay*option.duration, iterations:option.style==='double'?2:1, fill:'forwards'});
  }
  function revisedFrames(sequence, first = revised[1], offsets) {
    return sequence.map((index, i) => {
      const cell = first + index;
      const x = (cell % 4 * 100 / 3) + '%';
      const y = (Math.floor(cell / 4) * 100 / 3) + '%';
      const shift = floorOffsets[cell] || 0;
      const body=bodyOffsets[cell]||{x:0,y:0,scale:1};
      return {offset: offsets?.[i] ?? i / (sequence.length - 1), backgroundPosition:x+' calc('+y+' + '+shift+'px)',transform:'translate('+body.x+'px,'+body.y+'px) scale('+body.scale+')',easing:'steps(1,end)'};
    });
  }
  function registerFloor(image) {
    if (!revised || ['idea-recap','passport-targets'].includes(scene)) return;
    const width = Math.floor(image.naturalWidth / 4);
    const height = Math.floor(image.naturalHeight / 4);
    const canvas = document.createElement('canvas');
    canvas.width = width * 4;
    canvas.height = height * 4;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(image,0,0);
    const {data} = ctx.getImageData(0,0,canvas.width,canvas.height);
    if(['home','idea-product'].includes(scene)){
      const centers=revised[2].filter((cell,i,all)=>all.indexOf(cell)===i).map(index=>{
        const cell=revised[1]+index,left=cell%4*width,top=Math.floor(cell/4)*height;
        let total=0,sumX=0,sumY=0,minX=width,maxX=0;
        for(let y=Math.floor(height*.14);y<height*.71;y++){
          for(let x=Math.floor(width*.15);x<width*.82;x++){
            const pixel=((top+y)*canvas.width+left+x)*4;
            const r=data[pixel],g=data[pixel+1],b=data[pixel+2],a=data[pixel+3];
            if(a>220&&r>170&&g>120&&r>g*1.06&&b<g*.93){total++;sumX+=x;sumY+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
          }
        }
        return {cell,x:total?sumX/total:width*.5,y:total?sumY/total:height*.45,width:total?maxX-minX:width*.6};
      });
      const median=key=>centers.map(c=>c[key]).sort((a,b)=>a-b)[Math.floor(centers.length/2)];
      const centerX=median('x'),centerY=median('y'),bodyWidth=median('width'),scale=art.getBoundingClientRect().width/width;
      centers.forEach(c=>{
        const factor=scene==='home'?Math.max(.96,Math.min(1.04,bodyWidth/c.width)):1;
        bodyOffsets[c.cell]={x:(centerX-width*.5-(c.x-width*.5)*factor)*scale,y:(centerY-height*.55-(c.y-height*.55)*factor)*scale,scale:factor};
      });
      return;
    }
    const feet = Array.from({length:Math.max(...revised[2])+1},(_,i) => {
      const cell = revised[1]+i;
      const left = (cell % 4)*width;
      const top = Math.floor(cell/4)*height;
      for (let y = height-3; y > height*.55; y--) {
        let solid = 0;
        for (let x = Math.floor(width*.17); x < width*.83; x++) {
          if (data[((top+y)*canvas.width+left+x)*4+3] > 220) solid++;
        }
        if (solid > width*.065) return y;
      }
      return null;
    });
    const usable = feet.filter(y=>y!==null).sort((a,b)=>a-b);
    const floor = usable[Math.floor(usable.length/2)];
    const scale = art.getBoundingClientRect().height / height;
    feet.forEach((y,i) => {
      if (y!==null) floorOffsets[revised[1]+i] = Math.max(-6,Math.min(6,(floor-y)*scale));
    });
  }
  function emphasize(element, delay, duration = 750) {
    if (!element) return;
    run(element,[
      {outlineColor: 'transparent'}, {outlineColor: '#b57b15', offset: .2},
      {outlineColor: '#b57b15', offset: .72}, {outlineColor: 'transparent'}
    ], {duration, delay});
    element.classList.add('workshop-cue');
  }
  function tour(targets,endTarget) {
    const start=art.getBoundingClientRect();
    const stops=targets.map(el=>{
      const r=el.getBoundingClientRect();
      return {x:r.left+r.width/2-start.left-start.width/2,y:r.top-start.top-start.height*.76};
    });
    const flight=680*option.duration,hold=1050*option.duration;
    const route=[],duration=(flight+hold)*(stops.length+1);
    const at=(time,x,y)=>route.push({offset:time/duration,transform:'translate('+x+'px,'+y+'px)'});
    let from=option.style==='enter'?stops[0]:{x:0,y:0};
    [...stops,{x:0,y:0}].forEach((to,i)=>{
      const begin=i*(flight+hold);
      for(let sample=0;sample<=40;sample++){
        const t=sample/40,e=t*t*(3-2*t);
        at(begin+flight*t,from.x+(to.x-from.x)*e,from.y+(to.y-from.y)*e-option.arc*Math.sin(Math.PI*t)**2);
      }
      at(begin+flight+hold,to.x,to.y);
      run(pose,revisedFrames([0,1,2,3,4,5,6,0]),{duration:flight,delay:begin,fill:'forwards'});
      emphasize(targets[i]||endTarget,begin+flight,hold);
      from=to;
    });
    run(art,route,{duration,fill:'both',easing:'linear'});
  }
  function reveal(list, start, interval) {
    list.forEach((el, i) => run(el,[
      {opacity: 0, transform:'translateY(8px)'}, {opacity: 1, transform:'translateY(0)'}
    ], {duration:500, delay:(start+i*interval)*option.duration, easing:'ease-out', fill:'both'}));
  }
  function pointAtGoals(){
    const box=document.querySelector('.focus-goals');
    const list=[...box.querySelectorAll('li')];
    box.classList.add('workshop-recap');
    const start=art.getBoundingClientRect();
    const stop=2200*option.duration;
    const route=[];
    const duration=stop*list.length;
    list.forEach((li,i)=>{
      const r=li.getBoundingClientRect();
      const y=r.top+r.height*.35-start.top-start.height*.35;
      const prev=i?route.at(-1).transform:'translate(-12px,'+y+'px)';
      route.push({offset:i*stop/duration,transform:prev,easing:'cubic-bezier(.4,0,.2,1)'});
      route.push({offset:(i*stop+650)/duration,transform:'translate(0,'+y+'px)'});
      route.push({offset:((i+1)*stop)/duration,transform:'translate(0,'+y+'px)'});
      run(pose,revisedFrames([0,2,4,6,8,8]),{duration:650,delay:i*stop,fill:'forwards'});
      run(li,[{opacity:i?0:1},{opacity:1}],{duration:400,delay:i*stop+500,fill:'both'});
      emphasize(li,i*stop+600,stop-650);
    });
    run(art,route,{duration,fill:'both'});
  }
  function stampPassport(){
    const documentBox=document.querySelector('.passport-document-layout');
    const target=document.querySelector('.passport-notice');
    if(!documentBox||!target)return;
    documentBox.classList.add('workshop-stamp-layout');
    documentBox.append(art);
    const start=art.getBoundingClientRect(),stamp=target.getBoundingClientRect();
    const x=stamp.left+Math.min(stamp.width*.5,90)-start.left-start.width*.3;
    const y=stamp.top+stamp.height*.5-start.top-start.height*.80;
    const tempo=option.duration,total=option.style==='double'?5600:4400;
    const travel=run(art,[
      {transform:'translate(0,0)',easing:'cubic-bezier(.4,0,.2,1)'},
      {transform:'translate('+x+'px,'+y+'px)',offset:.3,easing:'ease-out'},
      {transform:'translate('+x+'px,'+y+'px)',offset:.68,easing:'ease-in-out'},
      {transform:'translate(0,0)',offset:.95},
      {transform:'translate(0,0)'}
    ],{duration:total*tempo,fill:'both',easing:'linear'});
    travel.onfinish=()=>{if(!disposed&&originalParent?.isConnected)originalParent.append(art);};
    run(pose,revisedFrames([0,1,2,3,4,4,5,6,7]),{duration:(option.style==='double'?1000:1450)*tempo,delay:total*.3*tempo,iterations:option.style==='double'?2:1,fill:'forwards'});
    if(option.style==='tilt')run(art,[{rotate:'0deg'},{rotate:'-5deg',offset:.35},{rotate:'0deg',offset:.65},{rotate:'0deg'}],{duration:total*tempo,fill:'forwards'});
    if(option.style==='bounce')run(art,[{translate:'0 0'},{translate:'0 5px',offset:.5},{translate:'0 -3px',offset:.6},{translate:'0 0'}],{duration:total*tempo,fill:'forwards'});
    run(target,[{opacity:.25,scale:'.97'},{opacity:.25,scale:'.97',offset:.56},{opacity:1,scale:'1.04',offset:.65},{opacity:1,scale:'1'}],{duration:3800*tempo,fill:'both'});
    const goals=document.querySelector('.focus-overview'),steps=document.querySelector('.passport-plan-section');
    [goals,steps].filter(Boolean).forEach((el,i)=>run(el,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,delay:(total+i*1300)*tempo,fill:'both',easing:'ease-out'}));
  }
  function play() {
    pose.style.backgroundImage = 'url("' + sheetURL(revised?.[0] || sheet) + '")';
    pose.style.backgroundPosition = spot(0, revised ? revised[1] / 4 : row);
    if(scene==='passport-targets'){
      art.classList.add('workshop-tree');
      pose.style.backgroundImage='url("' + asset('compass-workshop-tree-v2.png') + '")';
      if(!reduced.matches){
        const leaf=document.createElement('span');leaf.className='workshop-leaf';art.append(leaf);
        run(leaf,[{transform:'translate(0,0) rotate(0deg)',opacity:0},{opacity:.7,offset:.15},{transform:'translate(22px,55px) rotate(95deg)',opacity:.6,offset:.7},{transform:'translate(35px,90px) rotate(150deg)',opacity:0}],{duration:6000*option.duration,iterations:Infinity,easing:'ease-in-out'});
      }
      return;
    }
    if (reduced.matches) return;
    if (scene === 'home') {
      run(pose,revisedFrames(revised[2]), {duration:3600*option.duration,iterations:Infinity});
    } else if (scene === 'idea-topic') {
      run(pose,revisedFrames(revised[2], 0, [0,.12,.17,.22,.27,.36,.41,.46,.51,.56,1]), {duration:3000*option.duration,iterations:Infinity});
      emphasize(document.querySelector('[data-ask-compass]'), 550);
    } else if (scene === 'idea-product') {
      tour([...document.querySelectorAll('.category-button')], document.querySelector('[data-ask-compass]'), 1350);
    } else if (scene === 'idea-hardest') {
      const choices=[...document.querySelectorAll('.choices [data-choice]')];
      run(pose,revisedFrames(revised[2]),{duration:3200*option.duration,iterations:Infinity});
      choices.forEach((el,i)=>emphasize(el,i*950*option.duration,1000));
    } else if (scene === 'idea-recap') {
      pointAtGoals();
    } else if (scene === 'passport-plan') {
      gesture(art, row, 3000);
      emphasize(document.querySelector('.plan-suggestions'), 200, 1300);
      emphasize(document.querySelector('.contract-plan'), 1550, 1300);
    } else if (scene === 'passport-review') {
      stampPassport();
    } else {
      gesture(art, row, revised ? 1500 : 2200, 160, [0,1,2,3,0]);
    }
  }
  function supportingMovement() {
    if(['home','idea-hardest','idea-recap','passport-review','passport-targets'].includes(scene))return;
    const duration=4200*option.duration;
    if(option.style==='enter')run(art,[{translate:'-36px 0',opacity:0},{translate:'0 0',opacity:1,offset:.24},{translate:'0 0',offset:.8},{translate:'0 0'}],{duration,fill:'forwards',easing:'ease-in-out'});
    if(option.style==='tilt')run(art,[{rotate:'0deg'},{rotate:'-4deg',offset:.25},{rotate:'3deg',offset:.6},{rotate:'0deg'}],{duration,fill:'forwards',easing:'ease-in-out'});
    if(option.style==='bounce')run(art,[{scale:'1 1'},{scale:'.96 1.04',offset:.25},{scale:'1.04 .96',offset:.42},{scale:'1 1'}],{duration:1400,delay:duration*.45,fill:'forwards',easing:'ease-in-out'});
  }

  const preload = new Image();
  preload.src=scene==='passport-targets'?asset('compass-workshop-tree-v2.png'):sheetURL(revised?.[0]||sheet);
  Promise.all([preload.decode(), styled]).then(() => {
    if (!art.isConnected || disposed) return;
    registerFloor(preload);
    play();
    if(!reduced.matches)supportingMovement();
    art.dataset.workshopReady = 'true';
  }).catch(() => {
    if (idle) art.replaceWith(idle);
    else art.remove();
  });

}
 function examplesMotion(){  const launch=document.querySelector('.lp-product-launch');
  const guide=launch?.querySelector('.lp-launch-guide');
  const target=launch?.querySelector('.lp-launch-examples');
  if(!guide||!target)return;
  const option=CompassWorkshopOptions.get('examples',variant);
  const sprite=document.createElement('div');
  sprite.className='point-v1-sprite';sprite.dataset.variant=String(variant);
  sprite.setAttribute('role','img');sprite.setAttribute('aria-label','Compass points towards Explore examples');
  const replay=document.createElement('button');replay.type='button';replay.className='lp-motion-toggle';
  const original=[...guide.childNodes]; restore.push(()=>{if(guide.isConnected)guide.replaceChildren(...original);layout.disconnect();}); guide.replaceChildren(sprite);launch.classList.add('point-v1');
  launch.querySelector('.lp-launch-notice').before(target);

  const poses=option.style==='double'
    ?[0,1,2,3,4,5,6,7,8,9,7,8,9,10,11,12,13,14,15,0]
    :[0,0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,13,14,15,15,0,0];
  let animations=[];
  function position(pose){return pose%4*100/3+'% '+Math.floor(pose/4)*100/3+'%';}
  function stop(){animations.forEach(a=>a.cancel());animations=[];}
  function label(paused){
    replay.textContent=paused?'Resume Compass':'Pause Compass';
    replay.setAttribute('aria-pressed',String(paused));
  }
  function play(){
    stop();
    if(reduced.matches){sprite.style.backgroundPosition=position(8);return;}
    const duration=3000*option.duration;
    animations.push(run(sprite,poses.map((pose,i)=>({offset:i/(poses.length-1),backgroundPosition:position(pose),easing:'steps(1,end)'})),{duration,fill:'forwards'}));
    animations.push(run(target,[{outlineColor:'transparent'},{outlineColor:'#b57b15',offset:.32},{outlineColor:'#b57b15',offset:.76},{outlineColor:'transparent'}],{duration,fill:'forwards'}));
    if(option.style==='enter')animations.push(run(sprite,[{translate:'-24px 0'},{translate:'14px 0',offset:.4},{translate:'14px 0',offset:.76},{translate:'0 0'}],{duration,easing:'ease-in-out',fill:'forwards'}));
    if(option.style==='tilt')animations.push(run(sprite,[{rotate:'0deg'},{rotate:'-3deg',offset:.18},{rotate:'0deg',offset:.36},{rotate:'0deg'}],{duration,fill:'forwards'}));
    if(option.style==='bounce')animations.push(run(target,[{scale:'1'},{scale:'.97',offset:.4},{scale:'1.02',offset:.5},{scale:'1',offset:.65},{scale:'1'}],{duration,fill:'forwards'}));
    label(false);
    animations[0].onfinish=()=>{replay.textContent='Replay Compass';replay.setAttribute('aria-pressed','true');};
  }
  replay.onclick=()=>{
    const primary=animations[0];
    if(!primary||primary.playState==='finished'){play();return;}
    const paused=primary.playState==='running';
    animations.forEach(a=>paused?a.pause():a.play());label(paused);
  };
  function align(){
    const section=launch.getBoundingClientRect(),button=target.getBoundingClientRect(),art=sprite.getBoundingClientRect();
    launch.style.setProperty('--point-guide-top',Math.max(0,button.top+button.height/2-section.top-art.height*.36)+'px');
  }
  const layout=new ResizeObserver(align);[launch,target,sprite].forEach(el=>layout.observe(el));

  replay.hidden=reduced.matches;
  const art=new Image();art.src=asset('compass-point-v1.png');
  art.decode().then(()=>{if(disposed||!sprite.isConnected)return;play();sprite.dataset.workshopReady='true';}).catch(()=>{sprite.classList.add('point-v1-fallback');replay.hidden=true;});

}
 try{if(scene==='examples')examplesMotion();else sceneMotion();}catch(error){dispose();console.warn('Compass could not start; original guide retained.',error);}
 return session;
}
function scan(){scheduled=false;const found=identify();if(active&&found&&active.scene===found[0]&&active.anchor===found[1])return;if(active){active.dispose();active=null;}if(found)mount(...found);}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
new MutationObserver(schedule).observe(document.getElementById('screen')||document.getElementById('mc')||document.body,{childList:true,subtree:true});
reduced.addEventListener('change',()=>{if(active){active.dispose();active=null;}schedule();});
document.addEventListener('visibilitychange',()=>{active?.animations.forEach(a=>{if(a.playState==='finished'||a.playState==='idle')return;document.hidden?a.pause():a.play();});});
window.addEventListener('pagehide',()=>{active?.dispose();active=null;});window.addEventListener('pageshow',schedule);
window.LearnPathScenes={selections,get activeScene(){return active?.scene||null;}};
schedule();
})();
