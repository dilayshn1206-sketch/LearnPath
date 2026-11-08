const fs=require('node:fs'),assert=require('node:assert/strict');
const source=['compass-library','compass-topics','compass-products','compass-prepared'].map(n=>fs.readFileSync('assets/'+n+'.js','utf8')).join('\n');
const {reply,products}=new Function(source+';return {reply:preparedReply,products:COMPASS_PRODUCTS};')();
const ask=(text,c={})=>reply('product',text,{topicName:'Safe Accounts',topicId:'privacy',...c});
const names=r=>r.bullets.map(b=>b.keyword);
assert.equal(products.length,20);
for(const w of ['draw','drawing','paint','painting','write','writing','talk','speak','record','film','edit','design','build','ask','count','research','solve','guess','collect','explain','invite']){const r=ask(w);assert.equal(r.intent,'product-suggestions',w);assert.equal(r.bullets.length,2,w);}
for(const [input,expected] of [['draw characters','Comic'],['paint','Poster / Infographic'],['write opinions','Opinion Blog'],['write daily','Digital Diary'],['record voice','Podcast'],['film','Educational Video'],['design buttons screens','App Prototype'],['solve clues','Escape Room'],['collect display','Digital Museum'],['write choices endings','Choice Story'],['design products prices','Mock Online Store'],['ask count','Survey Report'],['act','Role-play'],['invite persuade','Club Pitch'],['research evidence','Detective File'],['cards dice','Board Game'],['questions answers','Quiz'],['edit captions','Post Series'],['avatar pfp','Profile Makeover'],['write advice tips','Tips Guide']]){
 const r=ask(input);assert.ok(names(r).includes(expected),input+': '+names(r));assert.equal(r.bullets.length,2);assert.ok(r.bullets.every(b=>b.detail.includes('Safe Accounts')));
}
for(const word of ['Roblox','Minecraft','Fortnite','Brawl Stars','Among Us','Instagram','TikTok','Snapchat','YouTube','Discord','Trendyol','watch','make'])assert.equal(ask(word).intent,'product-clarify',word);
let r=ask('Roblox');r=ask('draw',{productMemory:r.productMemory});assert.ok(names(r).includes('Comic'));
r=ask('characters',{productMemory:r.productMemory});assert.equal(names(r)[0],'Comic');
assert.equal(ask('second',{productMemory:r.productMemory}).intent,'product-selection');
const next=ask('another',{productMemory:r.productMemory});assert.ok(names(next).every(n=>!names(r).includes(n)));
r=ask("I don't like drawing but I like speaking");assert.ok(names(r).includes('Podcast'));assert.ok(!names(r).includes('Comic'));
r=ask('draw',{topicName:'Online Shopping'});assert.ok(r.bullets.every(b=>b.detail.includes('Online Shopping')));
r=ask('voice',{topicName:'Screen Time',productMemory:r.productMemory});assert.ok(r.bullets.every(b=>b.detail.includes('Screen Time')));
assert.equal(ask('my password is SECRET').intent,'privacy');
assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest/);
console.log('PASS: 20 products, verbs, game/platform clarification, topic context, multi-turn choices, negatives and privacy.');
