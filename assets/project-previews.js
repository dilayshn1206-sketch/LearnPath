/* Private attachments stay in this browser. No third-party document viewer. */
(function(){
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function kind(type,name){
  type=(type||'').split(';')[0].toLowerCase();const ext=(name||'').split('.').pop().toLowerCase();
  if(type.startsWith('image/')||/^(png|jpe?g|gif|webp|avif)$/.test(ext))return 'image';
  if(type.startsWith('video/')||/^(mp4|webm|mov)$/.test(ext))return 'video';
  if(type.startsWith('audio/')||/^(mp3|wav|m4a|ogg)$/.test(ext))return 'audio';
  if(type==='application/pdf'||ext==='pdf')return 'pdf';
  if(ext==='pptx'||type==='application/vnd.openxmlformats-officedocument.presentationml.presentation')return 'slides';
  return 'file';
 }
 function html(url,type,name){
  if(!url||!(/^(https?:|blob:)/i.test(url)||/^data:(image|video|audio)\//i.test(url)||/^data:application\/pdf[;,]/i.test(url)))return '';const k=kind(type,name),src=escape(url),title=escape(name||'Project file');
  const link='<a href="'+src+'" target="_blank" rel="noopener" class="obtn">Open original file ↗</a>';
  let media='';
  if(k==='image')media='<img src="'+src+'" alt="'+title+'" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Image preview unavailable. Open the original file below.</p>';
  if(k==='video')media='<video src="'+src+'" controls playsinline preload="metadata"></video>';
  if(k==='audio')media='<audio src="'+src+'" controls preload="metadata"></audio>';
  if(k==='pdf')media='<iframe src="'+src+'#toolbar=0" title="PDF preview: '+title+'" loading="lazy"></iframe>';
  if(k==='slides')media='<div class="lp-slides" data-slide-url="'+src+'"><div class="lp-slide-surface"><p role="status">Loading slide preview…</p></div></div>';
  if(k==='file')media='<p>Preview is not available for this file type.</p>';
  return '<section class="lp-file-preview" aria-label="Project attachment"><div class="lp-file-name">'+title+'</div>'+media+link+'</section>';
 }
 const elements=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
 const xml=text=>{const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Invalid document');return doc;};
 const resolve=(base,target)=>{const parts=base.split('/').slice(0,-1);for(const p of target.split('/')){if(p==='..')parts.pop();else if(p!=='.')parts.push(p);}return parts.join('/');};
 async function slides(el){
  let urls=[];
  try{
   const response=await fetch(el.dataset.slideUrl);if(!response.ok)throw new Error('File unavailable');
   const blob=await response.blob();if(blob.size>100*1024*1024)throw new Error('File too large');
   const zip=await JSZip.loadAsync(blob);let expanded=0;
   for(const entry of Object.values(zip.files)){expanded+=entry._data?.uncompressedSize||0;if(expanded>250*1024*1024)throw new Error('Presentation too large');}
   const presentation=xml(await zip.file('ppt/presentation.xml').async('string'));
   const size=elements(presentation,'sldSz')[0],w=Number(size?.getAttribute('cx'))||9144000,h=Number(size?.getAttribute('cy'))||5143500;
   const rels=xml(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));
   const paths=new Map(elements(rels,'Relationship').filter(r=>r.getAttribute('TargetMode')!=='External').map(r=>[r.getAttribute('Id'),resolve('ppt/presentation.xml',r.getAttribute('Target'))]));
   const names=elements(presentation,'sldId').map(s=>paths.get(s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'))).filter(Boolean);
   if(!names.length)throw new Error('No slides');let index=0;
   el.innerHTML='<div class="lp-slide-surface" aria-live="polite"></div><div class="lp-slide-controls"><button type="button" class="obtn" data-slide-back>Previous slide</button><span role="status"></span><button type="button" class="obtn" data-slide-next>Next slide</button></div><p class="lp-preview-note">Slide preview · Open the original for full formatting and animations.</p>';
   let generation=0;
   async function show(){
    const current=++generation;urls.forEach(URL.revokeObjectURL);urls=[];
    const surface=el.querySelector('.lp-slide-surface');surface.replaceChildren();surface.style.aspectRatio=w+'/'+h;
    el.querySelector('[role="status"]').textContent='Slide '+(index+1)+' of '+names.length;
    el.querySelector('[data-slide-back]').disabled=index===0;el.querySelector('[data-slide-next]').disabled=index===names.length-1;
    const path=names[index],doc=xml(await zip.file(path).async('string')),relationPath=path.replace('/slides/','/slides/_rels/')+'.rels';
    const relations=zip.file(relationPath)?xml(await zip.file(relationPath).async('string')):null;
    const media=new Map(relations?elements(relations,'Relationship').filter(r=>r.getAttribute('TargetMode')!=='External').map(r=>[r.getAttribute('Id'),resolve(path,r.getAttribute('Target'))]):[]);
    const bg=elements(doc,'bg')[0],color=bg&&elements(bg,'srgbClr')[0]?.getAttribute('val');surface.style.background=/^[0-9a-f]{6}$/i.test(color||'')?'#'+color:'#fff';
    const tree=elements(doc,'spTree')[0];let supported=0;
    for(const shape of Array.from(tree?.children||[])){
     if(current!==generation||!el.isConnected)return;
     const transform=elements(shape,'xfrm')[0],off=transform&&elements(transform,'off')[0],ext=transform&&elements(transform,'ext')[0];
     const block=document.createElement('div');block.className='lp-slide-element';
     if(off&&ext){block.style.left=100*Number(off.getAttribute('x'))/w+'%';block.style.top=100*Number(off.getAttribute('y'))/h+'%';block.style.width=100*Number(ext.getAttribute('cx'))/w+'%';block.style.height=100*Number(ext.getAttribute('cy'))/h+'%';}else{block.classList.add('lp-slide-unpositioned');}
     const image=elements(shape,'blip')[0],target=image&&media.get(image.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed'));
     if(target&&/\.(png|jpe?g|gif|webp)$/i.test(target)&&zip.file(target)){
      const data=await zip.file(target).async('uint8array');if(current!==generation)return;
      const url=URL.createObjectURL(new Blob([data],{type:/\.png$/i.test(target)?'image/png':/\.gif$/i.test(target)?'image/gif':/\.webp$/i.test(target)?'image/webp':'image/jpeg'}));urls.push(url);
      const img=new Image();img.src=url;img.alt='Slide image';block.append(img);supported++;
     }else{
      const paragraphs=elements(shape,'p').filter(p=>elements(p,'t').length);
      for(const paragraph of paragraphs){const p=document.createElement('p');p.textContent=elements(paragraph,'t').map(t=>t.textContent).join('');const props=elements(paragraph,'rPr')[0];const pts=Number(props?.getAttribute('sz'))/100||18;p.style.fontSize=Math.min(6,Math.max(1.2,pts*12700/w*100))+'cqw';if(props?.getAttribute('b')==='1')p.style.fontWeight='700';const clr=props&&elements(props,'srgbClr')[0]?.getAttribute('val');if(/^[0-9a-f]{6}$/i.test(clr||''))p.style.color='#'+clr;block.append(p);supported++;}
     }
     if(block.childNodes.length)surface.append(block);
    }
    if(!supported)surface.textContent='This slide contains elements available in the original file.';
   }
   el.querySelector('[data-slide-back]').onclick=()=>{index--;show().catch(fail);};el.querySelector('[data-slide-next]').onclick=()=>{index++;show().catch(fail);};
   function fail(){el.innerHTML='<p>Slide preview unavailable. Open the original file below.</p>';}
   await show();
   new MutationObserver(function(_,observer){if(!el.isConnected){generation++;urls.forEach(URL.revokeObjectURL);observer.disconnect();}}).observe(document.body,{childList:true,subtree:true});
  }catch{el.innerHTML='<p>Slide preview unavailable. Open the original file below.</p>';}
 }
 const visible=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){visible.unobserve(target);slides(target);}}),{rootMargin:'200px'});
 function scan(){document.querySelectorAll('.lp-slides:not([data-preview-ready])').forEach(el=>{el.dataset.previewReady='true';visible.observe(el);});}
 new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true});
 window.LearnPathFiles={html,kind};
})();
