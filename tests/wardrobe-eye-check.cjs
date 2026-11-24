/* Independent pixel check against the rabbit jacket's two illustrated pupils.
   The previous box-based fitting covered the near eye while passing bounds. */
module.exports=async function(page){
 const fs=require('fs'),path=require('path'),assert=require('assert/strict');
 const source=fs.readFileSync(path.join(__dirname,'../assets/magical-wardrobe-parts.js'),'utf8');
 const frame=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1)).heads.moonrabbit.frames[1];
 const opacity=await page.evaluate(async frame=>{
  const art=document.querySelector('.mw-dressing .mw-headwear'),rect=['left','top','width','height'].map(k=>parseFloat(art.style[k]));
  const img=new Image();img.src='assets/magic-heads-moonrabbit.webp';await img.decode();
  const canvas=document.createElement('canvas');canvas.width=frame[2];canvas.height=frame[3];
  const ctx=canvas.getContext('2d');ctx.drawImage(img,...frame,0,0,frame[2],frame[3]);
  return [[55.5,21],[71.5,15.5]].map(([x,y])=>{
   const px=Math.floor((x-rect[0])/rect[2]*frame[2]),py=Math.floor((y-rect[1])/rect[3]*frame[3]);
   if(px<0||py<0||px>=frame[2]||py>=frame[3])return 0;
   return ctx.getImageData(px,py,1,1).data[3];
  });
 },frame);
 opacity.forEach(alpha=>assert.ok(alpha<32,'A helmet strap must not cover a rabbit pupil: alpha '+alpha));
};
