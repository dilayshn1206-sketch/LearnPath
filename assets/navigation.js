/* Same-document history. Drafts and file objects stay in this tab's memory. */
(function(){
 const entries=new Map();let current=null,restoring=false,hooks=null,serial=0;
 function capture(){if(!current)return;const mc=document.getElementById('mc');current.scroll=scrollY;current.data=hooks.capture();if(current.shareStep!==undefined){const [stage,index]=current.shareStep.split(':').map(Number);current.data.stage=stage;current.data.rubricIndex=index;}if(!mc.querySelector('#lp-planner-frame'))current.nodes=Array.from(mc.childNodes);}
 function add(route,args,planner){const entry={id:++serial,route,args,planner,nodes:null};entries.set(entry.id,entry);current=entry;history.pushState({learnpathEntry:entry.id},'',location.href);}
 function enter(route,args=[]){if(!hooks||restoring)return;capture();if(current?.route===route&&JSON.stringify(current.args)===JSON.stringify(args)&&!current.planner)return;add(route,args,null);}
 function share(stage,index){if(restoring||current?.route!=='share')return;const signature=stage+':'+index;if(current.shareStep===undefined){current.shareStep=signature;return;}if(current.shareStep!==signature){capture();add('share',[],null);current.shareStep=signature;}}
 function planner(snapshot){if(restoring||!current)return;const signature=snapshot.passport?.active?'passport:'+snapshot.passport.view+':'+snapshot.passport.step:'idea:'+snapshot.state.step;const previous=current.planner;if(previous&&previous.signature!==signature){capture();add(current.route,current.args,{signature,snapshot});}else current.planner={signature,snapshot};}
 async function restore(entry){
  restoring=true;current=entry;
  try{
   if(entry.planner){
    const frame=document.getElementById('lp-planner-frame');
    if(frame&&window._plannerContext?.mode===(entry.route==='idea'?'idea':'passport')){frame.contentWindow.postMessage({learnpathNavigation:true,restore:entry.planner.snapshot},location.origin);}
    else await hooks.open(entry.route,entry.args);
   }else if(entry.nodes){document.getElementById('mc').replaceChildren(...entry.nodes);hooks.restore(entry.data);}
   else await hooks.open(entry.route,entry.args);
   requestAnimationFrame(()=>scrollTo({top:entry.scroll||0,behavior:'instant'}));
  }finally{restoring=false;}
 }
 window.addEventListener('popstate',event=>{const target=entries.get(event.state?.learnpathEntry);if(!target)return;capture();restore(target).catch(()=>hooks.open('go',['home']));});
 window.addEventListener('message',event=>{const frame=document.getElementById('lp-planner-frame');if(event.origin!==location.origin||event.source!==frame?.contentWindow||!event.data?.learnpathNavigation)return;if(event.data.snapshot)planner(event.data.snapshot);});
 window.LearnPathNavigation={enter,share,reset(){entries.clear();current=null;},resume:()=>restoring?current?.planner?.snapshot:null,install(value){hooks=value;current={id:++serial,route:'go',args:['home'],nodes:null};entries.set(current.id,current);history.replaceState({...history.state,learnpathEntry:current.id},'',location.href);}};
})();
