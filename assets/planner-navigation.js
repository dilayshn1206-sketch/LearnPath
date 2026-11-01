/* Parent owns history: iframe changes do not create a second browser history. */
(function(){
 let applying=false;
 const snapshot=()=>({state:structuredClone(state),passport:passport&&structuredClone(passport),paused});
 function checkpoint(){if(!applying&&host)parent.postMessage({learnpathNavigation:true,snapshot:snapshot()},location.origin);}
 const previous=render;
 render=function(){previous();checkpoint();};
 function restore(value){if(!value)return;applying=true;state=structuredClone(value.state);passport=value.passport&&structuredClone(value.passport);paused=!!value.paused;render();applying=false;checkpoint();}
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.learnpathNavigation&&event.data.restore)restore(event.data.restore);});
 document.addEventListener('input',checkpoint);document.addEventListener('change',checkpoint);
 window.restorePlannerNavigation=restore;
})();
