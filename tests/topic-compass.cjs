const fs=require('node:fs'),assert=require('node:assert/strict');
const source=['compass-library','compass-topics','compass-prepared'].map(n=>fs.readFileSync('assets/'+n+'.js','utf8')).join('\n');
const {reply,bank}=new Function(source+';return {reply:preparedReply,bank:COMPASS_TOPIC_BANK};')();
const plain=r=>[r.title,...r.bullets.flatMap(b=>[b.keyword,b.detail]),r.question].join(' ');
let checks=0;
function ask(text,context={}){const r=reply('topic',text,context);assert.equal(r.bullets.length,r.compact?0:2);assert.ok(r.question);checks++;return r;}
function title(text,expected,context={}){const r=ask(text,context);assert.equal(r.bullets[1].keyword,expected,text);assert.equal(r.question,'Which topic interests you?');return r;}
for(const [input,expected] of [
 ['roblox avatar','My Avatar'],['my pfp','My Profile'],['Instagram selfies','Photos and Filters'],['insta filters','Photos and Filters'],['followers likes','Likes and Followers'],
 ['roblox teammates rude','Friendly Gaming'],['emoji misunderstood','Messages and Emojis'],['I hate rude comments','Kind Comments'],
 ['reels all night sleep','Screen Time'],['phone homework buzzing','Phones and Homework'],["I don't want them to post my photo",'Sharing Photos'],
 ['password account','Safe Accounts'],['free robux link','Online Scams'],['YouTube tutorial drawing','Online Learning'],['Roblox coding','Digital Creations'],
 ["I don't know if this video is real",'Real or Fake?'],['influencer sponsored','Influencers and Shopping'],['Instagram ads buy clothes','Ads and Shopping'],
 ['online shopping reviews fake','Online Reviews'],['Trendyol discount price','Shopping Tips'],['online shopping password payment','Safe Online Shopping'],
 ['online shopping refund delivery','Before You Buy'],['online shopping','Online Shopping'],['smartwatch future','Future Technology']])title(input,expected);
for(const input of ['Instagram','insta','INSTGRAM','ig','TikTok','youtube','Roblox','I like games','music','origami','cats','outside','shopping','I have no idea','idk','<img src=x onerror=alert(1)>'])assert.equal(ask(input).intent,'topic-clarify',input);
for(const input of ['Instagram selfies','selfies Instagram','INSTAGRAM SELFIES','instgram selfie'])title(input,'Photos and Filters');
for(const input of ["I don't like games but I like music","I don’t like games but I like music",'I dont like games but I like music'])assert.doesNotMatch(plain(ask(input)),/Friendly Gaming|My Avatar|teammates/);
let r=ask('Instagram');r=ask('reels',{topicMemory:r.topicMemory});r=title('sleep','Screen Time',{topicMemory:r.topicMemory});
assert.equal(ask('the second one',{topicMemory:r.topicMemory}).intent,'topic-selection');
assert.match(plain(ask('2',{topicMemory:r.topicMemory})),/Screen Time/);
assert.match(plain(ask('first',{topicMemory:r.topicMemory})),/Life with technology/);
assert.equal(ask('Screen Time',{topicMemory:r.topicMemory}).intent,'topic-selection');
r=title('online shopping reviews','Online Reviews');
r=title('avatar','My Avatar',{topicMemory:r.topicMemory});
r=ask('actually music',{topicMemory:r.topicMemory});assert.equal(r.intent,'topic-clarify');assert.doesNotMatch(plain(r),/Shopping|My Avatar/);
r=title('phone homework','Phones and Homework');const other=ask('another idea',{topicMemory:r.topicMemory,topicId:r.topicId});assert.notEqual(other.bullets[1].keyword,r.bullets[1].keyword);
r=ask('Instagram');r=ask('learning',{topicMemory:r.topicMemory});assert.equal(r.bullets[1].keyword,'Online Learning');
for(const [,topic,title] of bank){assert.ok(title.split(/\s+/).length<=4,title);assert.ok(['identity','care','balance','privacy','learning','truth'].includes(topic));}
assert.equal(ask('my password is SECRET123').intent,'privacy');assert.doesNotMatch(plain(ask('my password is SECRET123')),/SECRET123/);
assert.equal(ask('Someone is bullying me').intent,'support');
assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage/);
console.log('PASS: '+checks+' topic cases: word families, context, short titles, shopping, negative preferences, deliberate choices and no network calls.');

const initial=ask('Instagram');const repeated=ask('Instagram',{topicMemory:initial.topicMemory});assert.notEqual(initial.question,repeated.question);assert.equal(initial.title,'');assert.equal(initial.bullets.length,0);
const render=new Function(source+';const esc=s=>String(s).replace(/</g,"&lt;");return preparedAnswerHTML;')();
assert.equal(render(initial),'<p>'+initial.question+'</p>');assert.doesNotMatch(render(initial),/Your interest|Your choice|<h3|<ul/);
assert.doesNotMatch(plain(ask('online shopping')),/A Topic of My Own|enter|Choose “/);
console.log('PASS: concise prompts, varied follow-ups and no form instructions.');
