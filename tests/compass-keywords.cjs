const fs=require('node:fs'),assert=require('node:assert/strict');
const library=fs.readFileSync('assets/compass-library.js','utf8'),source=fs.readFileSync('assets/compass-prepared.js','utf8');
const {reply,lib}=new Function(library+source+';return {reply:preparedReply,lib:COMPASS_LIBRARY};')();
let cases=0;const plain=r=>[r.title,...r.bullets.flatMap(b=>[b.keyword,b.detail]),r.question].join(' ');
function check(key,text,intent,context={}){const r=reply(key,text,context);assert.equal(r.intent,intent,text);assert.ok(r.bullets.length>=2&&r.bullets.length<=5,text);assert.ok(r.bullets.every(b=>b.keyword&&b.detail));assert.ok(r.question);cases++;return r;}
assert.match(plain(check('topic','I LIKE GAMES and music','interest')),/Game chat.*Credit/);
assert.match(plain(check('topic','I prefer football','interest')),/Sports clips/);
check('topic','screen time','topic');check('topic','online identity','topic');
assert.match(plain(check('product','I like speaking and asking questions','preference')),/Short talk.*Written interview/);
assert.match(plain(check('product','Görsel tasarım','preference')),/Infographic/);
assert.doesNotMatch(plain(check('topic',"I don't like games but I like music",'interest')),/Game chat/);
check('topic','I have no idea','clarify');check('topic','origami','clarify');check('product','<img src=x>','clarify',{lastFormat:'talk',topicId:'privacy'});check('product','What is the weather?','clarify',{lastFormat:'talk',topicId:'privacy'});check('product','What does privacy mean?','topic-definition',{productId:'talk'});check('product','actually I am unsure','clarify');
for(const [id,t] of Object.entries(lib.topics)){check('topic','What does '+t.name+' mean?','topic-definition',{topicId:id});check('topic','Give me another idea','ideas',{topicId:id});}
for(const [id,f] of Object.entries(lib.formats)){check('product','What is a '+f.name+'?','format-definition');check('product','How do I start?','start',{productId:id,topicId:'privacy'});}
check('product','Compare a blog and podcast','compare');check('topic','Privacy or screen time?','compare-topics');
for(const removed of ['how-to guide','spoken interview','visual slide story','slides'])check('product','Can I make a '+removed+'?','format-alternatives');
check('product','Which product fits my topic?','recommend',{topicId:'truth'});check('product','Another product please','recommend',{topicId:'balance'});
check('product','Can I combine formats?','combine');check('topic','How do I find sources?','research');check('product','How can I make a title?','title');check('product','How do I give peer feedback?','peer-feedback');
check('product','What questions can I ask?','interview-questions',{topicId:'privacy'});check('product','I feel nervous','speaking-support');check('product','How do I record?','tools');check('topic','What key words can I use?','language',{topicId:'identity'});check('product','How can I improve?','review');
const targets=check('product','How long should my talk be?','targets',{goalTargets:{speaking:'I will speak clearly for 2 minutes.'}});assert.match(plain(targets),/2 minutes/);
const noKey=check('topic','Give me the answer key','assessment-guidance');assert.doesNotMatch(plain(noKey),/d\)|a\)|can’t|must/);
const privacy=check('topic','my password is SECRET123','privacy');assert.doesNotMatch(plain(privacy),/SECRET123/);
check('topic','Someone is bullying me','support');check('topic','What can you help me with?','help');
const first=check('topic','another idea','ideas',{topicId:'privacy',ideaRound:0}),second=check('topic','another idea','ideas',{topicId:'privacy',ideaRound:first.ideaRound});assert.notDeepEqual(first.bullets,second.bullets);
const message=check('topic','My message is ask before posting','develop-message',{lastTopic:'privacy',pending:'message'});assert.equal(message.topicId,'privacy');
assert.equal(Object.keys(lib.formats).length,9);assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|createClient|localStorage/);
console.log('PASS: '+cases+' authored response cases; six topics, nine formats, follow-ups, comparisons, alternate angles, goals, unknown/negative input and no model/network calls.');
