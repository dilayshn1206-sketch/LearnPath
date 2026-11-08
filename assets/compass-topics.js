// Authored English word families. Topic choices stay in the form, never automatic.
const COMPASS_TOPIC_WORDS={
 instagram:'instagram insta instgram ig',tiktok:'tiktok',youtube:'youtube yt',snapchat:'snapchat snap',whatsapp:'whatsapp',discord:'discord',
 game:'game games gaming gamer roblox minecraft fortnite brawl fifa',avatar:'avatar avatars character characters skin skins outfit outfits',profile:'profile profiles pfp username nickname bio identity',
 photo:'photo photos picture pictures image images',selfie:'selfie selfies',filter:'filter filters appearance',edit:'edit edits edited editing',likes:'likes followers views popular fame famous',
 team:'team teams teammate teammates teamwork',chat:'chat chats chatting voice',message:'message messages messaging text texts texting dm dms',emoji:'emoji emojis',joke:'joke jokes joking meme memes lol misunderstood misunderstanding sarcasm',
 rude:'rude mean toxic insult insults bullying bully nasty unkind',comment:'comment comments commenting',friend:'friend friends friendship classmates',exclude:'excluded ignored blocked kicked',
 scroll:'scroll scrolling reels reel',video:'video videos clip clips shorts watch watching',time:'time hours hour bedtime sleep sleeping tired midnight late',screen:'screen screens balance balanced',phone:'phone phones smartphone smartphones',
 notice:'notification notifications buzzing distraction distractions distracted',study:'homework study studying focus concentrate exam exams',
 share:'share shared sharing post posted posting upload uploaded uploading forward forwarded',permission:'permission consent asking ask tagged tag screenshot screenshots',
 account:'account accounts login passcode password passwords hacked hacking security private privacy',link:'link links click clicking',stranger:'stranger strangers scam scams phishing suspicious',prize:'prize prizes giveaway giveaways robux gems coins free',
 learn:'learn learns learning lesson lessons tutorial tutorials educational education',code:'code coding programmer programming',create:'create creates creating build building animation animations channel content',
 truth:'fake real true false proof evidence fact facts source sources rumour rumours rumor rumors clickbait trust believable',news:'news headline headlines',
 ads:'ad ads advert adverts advertisement advertisements sponsored sponsorship promotion promo',influencer:'influencer influencers youtuber youtubers tiktoker tiktokers creator creators',
 shop:'shop shops shopping buy buying purchase purchases cart basket checkout',store:'amazon trendyol temu shein ebay aliexpress',review:'review reviews rating ratings stars',price:'price prices discount discounts sale cheap cheaper expensive',order:'order orders ordering delivery shipping refund refunds return returns',payment:'payment payments credit checkout',
 future:'future wearable wearables smartwatch robot robots vr hologram invention inventions',digital:'online digital internet technology app apps website websites computer computers',
 music:'music song songs singer singers spotify guitar piano rap kpop',art:'art drawing draw painting origami crafts diy',sport:'sport sports football basketball soccer tennis cycling',animal:'animal animals cat cats dog dogs pets',
 outside:'outside outdoors offline park nature recycling plastic'
};
const COMPASS_TOPIC_ALIASES=new Map(Object.entries(COMPASS_TOPIC_WORDS).flatMap(([key,words])=>words.split(' ').map(word=>[word,key])));
const COMPASS_TOPIC_BANK=[
 ['avatar','identity','My Avatar','Explore what a game character shows about you.',['avatar'],[]],
 ['profile','identity','My Profile','Explore what a profile shows and keeps private.',['profile'],[]],
 ['filters','identity','Photos and Filters','Explore how edited photos change what we see.',['selfie','filter'],[]],
 ['likes','identity','Likes and Followers','Explore how online reactions affect our choices.',['likes'],[]],
 ['gaming','care','Friendly Gaming','Explore how players can support their teammates.',['team','rude','chat'],[['game']]],
 ['messages','care','Messages and Emojis','Explore how people understand digital messages.',['message','emoji','joke'],[]],
 ['comments','care','Kind Comments','Explore kinder ways to respond online.',['rude','comment','exclude'],[]],
 ['screen','balance','Screen Time','Explore when to pause a digital activity.',['time','screen'],[['digitalContext']]],
 ['focus','balance','Phones and Homework','Explore how notifications affect studying.',['study','notice'],[['digitalContext']]],
 ['photos','privacy','Sharing Photos','Explore asking before posting a photo or screenshot.',['permission'],[]],
 ['sharing','privacy','Sharing Photos','Explore asking before posting a photo.',['photo'],[['share']]],
 ['accounts','privacy','Safe Accounts','Explore ways to protect an online account.',['account'],[]],
 ['scams','privacy','Online Scams','Explore checking unfamiliar links and free offers.',['stranger','prize'],[]],
 ['learning','learning','Online Learning','Explore what makes an online lesson useful.',['learn'],[['digitalContext']]],
 ['creating','learning','Digital Creations','Explore creating something useful with digital tools.',['code','create'],[['digitalContext']]],
 ['truth','truth','Real or Fake?','Explore checking information before believing it.',['truth','news'],[['digitalContext']]],
 ['influencers','truth','Influencers and Shopping','Explore how creators influence buying decisions.',['influencer'],[['shop','ads','store']]],
 ['reviews','truth','Online Reviews','Explore which online reviews deserve our trust.',['review'],[['shoppingContext'],['digitalContext']]],
 ['prices','truth','Shopping Tips','Explore comparing prices and offers online.',['price'],[['shoppingContext'],['digitalContext']]],
 ['shopads','truth','Ads and Shopping','Explore how online ads affect what we want.',['ads'],[['shoppingContext'],['digitalContext']]],
 ['shopprivacy','privacy','Safe Online Shopping','Explore keeping personal details private while shopping.',['account','payment','stranger'],[['shoppingContext'],['digitalContext']]],
 ['delivery','truth','Before You Buy','Explore checking order and return details online.',['order'],[['shoppingContext'],['digitalContext']]],
 ['shopping','truth','Online Shopping','Explore making thoughtful choices in online shops.',['shop','store'],[['digitalContext']]],
 ['future','balance','Future Technology','Explore how digital tools could change communication.',['future'],[]]
];
function compassTopicTokens(text){
 return compassNormal(text).replace(/[’‘]/g,"'").match(/[a-z0-9]+(?:'[a-z]+)?/g)||[];
}
function compassTopicInput(text){
 const raw=compassNormal(text).replace(/[’‘]/g,"'"),excluded=new Set(),positive=[];
 // Negation parsing affects preferences, not topic recognition: "hate rude comments"
 // and "don't know if it is real" still carry useful topic words.
 for(const clause of raw.split(/\bbut\b|\bhowever\b|[.!?;,]/)){
  const negative=/(?:\b(?:don't|dont|do not|never|not)\s+(?:really\s+)?(?:like|enjoy|prefer|want(?!\s+(?:them|people|anyone|someone)\b))\b|\bdislike\b|\bhate\s+(?=(?:games?|gaming|music|instagram|tiktok|shopping)\b))/;
  const match=negative.exec(clause);
  if(match){positive.push(...compassTopicTokens(clause.slice(0,match.index)));compassTopicTokens(clause.slice(match.index+match[0].length)).forEach(w=>{if(COMPASS_TOPIC_ALIASES.has(w))excluded.add(COMPASS_TOPIC_ALIASES.get(w));});}
  else positive.push(...compassTopicTokens(clause));
 }
 const keys=[...new Set(positive.map(w=>COMPASS_TOPIC_ALIASES.get(w)).filter(Boolean))].filter(w=>!excluded.has(w));
 return {raw,keys,excluded:[...excluded]};
}
function compassTopicReply(text,context={}){
 const input=compassTopicInput(text),n=input.raw,prev=context.topicMemory||{};
 const reset=/\b(actually|instead)\b|different topic|new topic|start again/.test(n);
 const excluded=new Set([...(reset?[]:prev.excluded||[]),...input.excluded]);
 input.keys.forEach(w=>excluded.delete(w));
 const current=new Set(input.keys),words=new Set([...(reset?[]:prev.words||[]),...input.keys].filter(w=>!excluded.has(w)));
 const any=(s,keys)=>keys.some(k=>s.has(k));
 const platforms=['instagram','tiktok','youtube','snapchat','whatsapp','discord','store'];
 const digital=['screen','digital','game','avatar','profile','selfie','filter','likes','chat','message','emoji','scroll','video','phone','notice','account','code','future',...platforms];
 const decorate=s=>{if(any(s,digital))s.add('digitalContext');if(any(s,['shop','store'])){s.add('shoppingContext');if(s.has('store'))s.add('digitalContext');}return s;};
 decorate(current);decorate(words);
 const memory={words:[...words].filter(w=>!w.endsWith('Context')).slice(-48),excluded:[...excluded].slice(-24),options:prev.options||[],seen:reset?[]:prev.seen||[]};
 const response=(title,bullets,question,extra={})=>compassAnswer(title,bullets,question,{intent:'topic-suggestions',topicId:null,formatId:null,topicMemory:memory,...extra});
 const finish=option=>response(option.title,[], 'What would you like to explore about '+option.title+'?',{intent:'topic-selection',topicId:option.topicId,compact:true});
 const exact=(prev.options||[]).find(o=>compassNormal(o.title)===n.trim());
 if(!reset&&exact)return finish(exact);
 if(!reset&&prev.options?.length){
  if(/^(?:the )?(?:first(?: one)?|1|existing(?: one)?|listed(?: one)?)[.!]?$/.test(n.trim()))return finish(prev.options[0]);
  if(/^(?:the )?(?:second(?: one)?|2|new(?: one)?|my own|own(?: one)?)[.!]?$/.test(n.trim()))return finish(prev.options[1]);
 }
 const more=/\b(another|different|more|other)\b/.test(n)&&!reset;
 const named=Object.entries(COMPASS_LIBRARY.topics).find(([,t])=>n.includes(compassNormal(t.name)));
 const selectedId=named?.[0]||context.topicId||(more?prev.options?.[0]?.topicId:null)||null;
 if(named&&/\b(mean|means|explain|meaning)\b/.test(n))return response(named[1].name,[['Meaning',named[1].meaning],['Explore',named[1].question]],'Would you like this topic or a shorter topic of your own?',{intent:'topic-definition',topicId:named[0]});
 const rules=COMPASS_TOPIC_BANK.map(row=>{
  const [id,topicId,title,detail,anchors,needs]=row;
  if(!anchors.some(k=>words.has(k))||!needs.every(group=>any(words,group)))return null;
  // Broad everyday words need a digital connection, supplied by a previous
  // answer or another word in this message, not by a fixed phrase.
  let score=anchors.reduce((a,k)=>a+(current.has(k)?6:words.has(k)?1:0),0);
  score+=needs.reduce((a,group)=>a+(any(current,group)?3:1),0);
  if(['reviews','prices','shopads','shopprivacy','delivery'].includes(id))score+=6;
  if(id==='shopping')score-=1;
  if(id==='gaming'&&current.has('game'))score+=4;
  if(selectedId===topicId)score+=1;
  if(more&&memory.seen.includes(title))score-=30;
  return {id,topicId,title,detail,score,currentAnchor:anchors.some(k=>current.has(k))};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 // A fresh platform or hobby opens a new direction instead of repeating an old one.
 const active=rules.filter(r=>r.currentAnchor);
 const freshBroad=any(current,[...platforms,'game','music','art','sport','animal','outside'])&&!active.length&&input.keys.length;
 let pick=(active.length?active:rules)[0];
 if(freshBroad){pick=null;memory.words=input.keys;}
 if(more&&pick&&memory.seen.includes(pick.title))pick=null;
 if(!pick&&selectedId&&(more||named||!input.keys.length)){
  const candidates=COMPASS_TOPIC_BANK.filter(r=>r[1]===selectedId&&!['shopprivacy','reviews','prices','shopads','delivery','shopping'].includes(r[0]));
  const r=candidates.find(r=>!memory.seen.includes(r[2]))||candidates[0];
  if(r)pick={id:r[0],topicId:r[1],title:r[2],detail:r[3]};
 }
 if(pick){
  const existing=COMPASS_LIBRARY.topics[pick.topicId];
  memory.options=[{title:existing.name,topicId:pick.topicId,own:false},{title:pick.title,topicId:pick.topicId,own:true}];
  memory.seen=[...memory.seen.filter(t=>t!==pick.title),pick.title].slice(-8);
  return response('Two topic ideas',[[existing.name,existing.meaning],[pick.title,pick.detail]],'Which topic interests you?',{topicId:pick.topicId});
 }
 memory.options=[];
 const broad=current.size?current:words;
 let key='general',questions=['What do you enjoy doing online?','Which app or game do you enjoy?','What did you last watch or do online?'];
 if(any(broad,platforms)){key='platform';questions=['What do you do there: watch, share or chat?','What do you enjoy most about that app?','What did you last watch or share there?'];}
 else if(broad.has('game')){key='game';questions=['Do you prefer avatars, teammates or building?','What do you enjoy most in the game?','What would you like to change about gaming online?'];}
 else if(any(broad,['music','art','sport','animal','outside'])){key='hobby';questions=['Do you learn about it online or share it online?','How does technology connect to that interest?','What do you watch or read about it online?'];}
 else if(any(broad,['shop','price','review','order'])){key='shopping';questions=['Are you interested in online shopping?','Which shopping app or website do you know?','Would you like to explore online prices, ads or reviews?'];}
 else if(any(broad,['scroll','video'])){key='video';questions=['What videos do you like watching?','Are you interested in learning from videos or checking if they are real?','What catches your attention in an online video?'];}
 else if(any(broad,['photo','edit','share'])){key='photos';questions=['Are you interested in filters or sharing photos?','What do you like to share online?','What would you like people to know about online photos?'];}
 else if(any(broad,['friend','chat'])){key='friends';questions=['Would you like to explore messages or online game chats?','What interests you about talking online?','What makes an online conversation enjoyable?'];}
 const round=!reset&&prev.clarifyKey===key?(prev.clarifyRound||0)+1:0;
 memory.clarifyKey=key;memory.clarifyRound=round;
 return response('',[],questions[round%questions.length],{intent:'topic-clarify',compact:true});
}
