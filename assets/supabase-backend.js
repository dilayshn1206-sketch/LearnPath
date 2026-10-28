import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.118.0';
export const client=createClient('https://wrgkupncvgrcjsbfcqze.supabase.co','sb_publishable_wHrLNg7N4NMwCnMJiBSHow_eraqDopE',{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const auth=client.auth,db={},storage={};
export async function rpc(name,args={}){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
export const ref=(_db,path)=>String(path).replace(/^\/+|\/+$/g,'');
export const sref=(_storage,path)=>({path});
const urls=new Map(),listeners=new Map();
function snapshot(value,key){return {key,exists:()=>value!==null&&value!==undefined,val:()=>structuredClone(value),forEach:fn=>Object.entries(value||{}).some(([k,v])=>fn(snapshot(v,k))===true)};}
async function refreshFileUrls(value){
 if(!value||typeof value!=='object')return value;
 if(value.filePath){value.fileUrl=await getDownloadURL({path:value.filePath});}
 await Promise.all(Object.values(value).filter(v=>v&&typeof v==='object').map(refreshFileUrls));return value;
}
export async function get(path){let data=await rpc('lp_read',{p_path:path});if(path.split('/')[0]==='posts')data=await refreshFileUrls(data);return snapshot(data,path.split('/').at(-1));}
async function write(path,value,operation){
 // Feedback notifications are emitted by the database when a comment is saved.
 if(currentUser?.role!=='teacher'&&path.startsWith('notifications/')&&path.split('/')[1]!==currentUser?.uid)return;
 const data=await rpc('lp_write',{p_path:path,p_value:value??null,p_operation:operation});
 refreshListeners();return data;
}
export const set=(path,value)=>write(path,value,'set');
export const update=(path,value)=>write(path,value,'update');
export const remove=path=>write(path,null,'remove');
export async function push(path,value){const key=crypto.randomUUID();await set(path+'/'+key,value);return {key};}
let refreshing=false;
async function refreshListeners(){
 if(refreshing||!currentUser||document.hidden)return;refreshing=true;
 try{await Promise.all([...listeners].map(async([path,entry])=>{try{const s=await get(path),hash=JSON.stringify(s.val());if(hash!==entry.last){entry.last=hash;entry.callback(s);}}catch(e){console.error('Supabase subscription',path,e);}}));}finally{refreshing=false;}
}
export function onValue(path,callback){const entry={callback,last:undefined};listeners.set(path,entry);refreshListeners();return ()=>{if(listeners.get(path)===entry)listeners.delete(path);};}
setInterval(refreshListeners,3000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshListeners();});
let currentUser=null;
export function onAuthStateChanged(_auth,callback){
 let lastToken=undefined;
 const deliver=async session=>{
  if(session?.access_token===lastToken)return;lastToken=session?.access_token??null;
  if(!session){currentUser=null;listeners.clear();await callback(null);return;}
  try{
   const profile=await rpc('lp_provision');
   if(!profile.enrolled){
    currentUser=null;await callback(null);
    const button=document.getElementById('gsign');button.disabled=false;button.textContent='Check teacher approval';
    let note=document.getElementById('lp-approval-note');if(!note){note=document.createElement('p');note.id='lp-approval-note';button.after(note);}
    note.textContent='Your account is waiting for teacher approval. Return here after your teacher approves access.';
    button.onclick=()=>location.reload();
    let switchButton=document.getElementById('lp-switch-account');
    if(!switchButton){switchButton=document.createElement('button');switchButton.id='lp-switch-account';switchButton.className='gbtn';switchButton.textContent='Use another Google account';note.after(switchButton);}
    switchButton.onclick=async()=>{switchButton.disabled=true;try{await signOut();await signInWithPopup();}catch(e){switchButton.disabled=false;window.alert('Could not switch accounts. Please try again.');}};
    return;
   }
   currentUser={uid:session.user.id,displayName:profile.name,email:profile.email,photoURL:profile.photo,role:profile.role};
   await callback(currentUser);
  }catch(e){console.error(e);document.getElementById('auth').style.display='flex';document.getElementById('app').style.display='none';const button=document.getElementById('gsign');button.disabled=false;button.textContent='Sign in with Google';window.alert('Could not open your account: '+e.message);}
 };
 const {data}=client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>deliver(session),0);});
 client.auth.getSession().then(({data,error})=>{if(error)throw error;return deliver(data.session);}).catch(console.error);
 return ()=>data.subscription.unsubscribe();
}
export async function signInWithPopup(){const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(error)throw error;}
export async function signOut(){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;listeners.clear();currentUser=null;}
export async function getDownloadURL(fileRef){
 const cached=urls.get(fileRef.path);if(cached&&cached.expires>Date.now())return cached.url;
 const {data,error}=await client.storage.from('learnpath-work').createSignedUrl(fileRef.path,3600);
 if(error)throw error;urls.set(fileRef.path,{url:data.signedUrl,expires:Date.now()+45*60000});return data.signedUrl;
}
export function uploadBytesResumable(fileRef,file,metadata={}){
 const task={snapshot:{ref:fileRef,bytesTransferred:0,totalBytes:file.size},on(event,progress,error,complete){
  (async()=>{
   const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required');
   await new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST','https://wrgkupncvgrcjsbfcqze.supabase.co/storage/v1/object/learnpath-work/'+fileRef.path.split('/').map(encodeURIComponent).join('/'));
    xhr.setRequestHeader('Authorization','Bearer '+session.access_token);
    xhr.setRequestHeader('apikey','sb_publishable_wHrLNg7N4NMwCnMJiBSHow_eraqDopE');
    xhr.setRequestHeader('Content-Type',metadata.contentType||file.type||'application/octet-stream');
    xhr.upload.onprogress=e=>{task.snapshot.bytesTransferred=Math.min(e.loaded,file.size);progress?.(task.snapshot);};
    xhr.onerror=()=>reject(new Error('Upload network error'));
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Upload failed ('+xhr.status+'): '+xhr.responseText));
    xhr.send(file);
   });
   task.snapshot.bytesTransferred=file.size;progress?.(task.snapshot);await complete?.();
  })().catch(error);
 }};return task;
}
// Retain research files; database history retains the deleted post's file path.
export async function deleteObject(){return;}
