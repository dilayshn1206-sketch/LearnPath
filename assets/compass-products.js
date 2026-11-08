// Authored product suggestions. Interests are clues, never automatic form choices.
const COMPASS_PRODUCTS=[
 ['blog','Opinion Blog','write writing type typing opinion opinions reasons argue','Explain your view'],
 ['tips','Tips Guide','write writing advice tips explain explaining teach teaching steps','Share useful tips'],
 ['survey','Survey Report','ask asking interview interviewing count counting compare comparing measure survey votes data','Compare answers to a short survey'],
 ['diary','Digital Diary','write writing daily day routine diary journal','Describe a day of digital choices'],
 ['podcast','Podcast','talk talking speak speaking discuss discussing record recording voice audio narrate interviewing','Record a short discussion'],
 ['roleplay','Role-play','act acting perform performing pretend drama dialogue roles','Act out a digital situation'],
 ['club','Club Pitch','invite inviting persuade convince lead club team','Present a digital club idea'],
 ['comic','Comic','draw drawing sketch sketching doodle paint painting characters cartoon panels dialogue','Draw a short digital story'],
 ['video','Educational Video','record recording film filming edit editing animate animating explain demonstrate teach capcut effects transitions subtitles tutorial','Show and explain a digital choice'],
 ['poster','Poster / Infographic','draw drawing paint painting colour color colouring coloring design designing decorate information facts pictures canva layout','Show a clear message with pictures'],
 ['posts','Post Series','design designing edit editing captions posts caption reels carousel templates','Design three connected posts'],
 ['quiz','Quiz','guess guessing questions answers quiz trivia challenge kahoot','Write questions with answer explanations'],
 ['choice','Choice Story','write writing tell imagine invent choices endings story adventure','Write a story with different choices'],
 ['board','Board Game','build building cards dice board rules tokens players','Make a game about digital choices'],
 ['escape','Escape Room','solve solving clues puzzle puzzles code codes escape mystery challenge','Create puzzles about digital choices'],
 ['app','App Prototype','design designing build building create coding buttons screens app menu interface redstone','Sketch app screens and buttons'],
 ['store','Mock Online Store','design designing build building products prices cart basket delivery shop store robux gems coins trading','Design a pretend store with clear product information'],
 ['profile','Profile Makeover','avatar avatars profile pfp bio username outfit skins selfie selfies filters','Redesign an invented online profile'],
 ['museum','Digital Museum','collect collecting organise organize display gallery collection exhibit history','Create a digital gallery with captions'],
 ['detective','Detective File','research investigate search check discover evidence clues suspect impostor fake scam','Collect clues and explain what they show']
];
function compassProductReply(text,context={}){
 const n=compassNormal(text).replace(/[’‘]/g,"'"),tokens=s=>s.match(/[a-z0-9]+/g)||[];
 // Keep existing planning, definition and support answers available.
 if(/compare a|how (do|can|should)|what (is|are|does)|start|outline|rubric|feedback|how long|how many|grammar|vocabulary|nervous|shy|combine|title|weather|<|gorsel|interview questions|what questions|how-to|spoken interview|visual slide|slides/.test(n))return null;
 const topicName=context.topicName||COMPASS_LIBRARY.topics[context.topicId]?.name||COMPASS_LIBRARY.topics[context.lastTopic]?.name||'digital life';
 const old=context.productMemory?.topic===topicName?context.productMemory:{};
 let excluded=new Set(old.excluded||[]),words=[];
 for(const part of n.split(/\bbut\b|[,.!?;]/)){
  const negative=/\b(don't|dont|do not|dislike|hate|can't|cannot|no)\b/.test(part);
  for(const w of tokens(part)){if(negative)excluded.add(w);else {words.push(w);excluded.delete(w);}}
 }
 const fresh=new Set(words),all=new Set([...(old.words||[]),...words].filter(w=>!excluded.has(w)));
 const memory={topic:topicName,words:[...all],excluded:[...excluded],options:old.options||[]};
 const answer=(title,bullets,question,extra={})=>compassAnswer(title,bullets,question,{intent:'product-suggestions',topicId:context.topicId||context.lastTopic,productMemory:memory,...extra});
 const selected=/^(?:the )?(1|first|2|second)(?: one)?$/.exec(n.trim());
 const exact=COMPASS_PRODUCTS.find(p=>p[1].toLowerCase()===n.trim());
 const chosen=exact|| (selected&&COMPASS_PRODUCTS.find(p=>p[0]===memory.options[/1|first/.test(selected[1])?0:1]));
 if(chosen)return answer(chosen[1],[[chosen[1],chosen[3]+' about '+topicName+'.']], 'What is the main message you want to share?',{intent:'product-selection',formatId:chosen[0]});
 const platform=/\b(roblox|minecraft|fortnite|brawl|brawlstars|fifa|fc|among|valorant|pubg|genshin|instagram|insta|ig|tiktok|youtube|snapchat|snap|discord|whatsapp|twitch|amazon|trendyol|temu|shein|games|gaming|reels|shorts|streak|fyp|streamer|youtuber|subscribers|followers|likes)\b/.test(n);
 const other=/\b(other|another|different|new|creative)\b/.test(n);
 const topicWords=new Set(tokens(topicName));
 const rank=COMPASS_PRODUCTS.map((p,i)=>{
  const keys=p[2].split(' ');
  if(keys.some(k=>excluded.has(k)))return {p,score:-100,i};
  let score=keys.reduce((s,k)=>s+(fresh.has(k)?3:all.has(k)?1:0),0);
  if(score>0&&p[0]==='store'&&[...topicWords].some(w=>/shopping|shop|buy|reviews/.test(w)))score+=3;
  if(other&&memory.options.includes(p[0]))score-=20;
  return {p,score,i};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 const hits=rank.filter(r=>r.score>0);
 if(!hits.length&&!other){
  if(!platform&&!/\b(draw|make|create|play|watch|watching|build|idk|unsure|product|format|choose|design)\b/.test(n)&&!excluded.size)return null;
  const question=platform?'What do you enjoy doing there: drawing, building, writing or talking?':'What would you enjoy doing: drawing, writing, speaking or making a game?';
  return answer('',[],question,{compact:true,intent:'product-clarify'});
 }
 const picks=(hits.length>=2?hits:rank.filter(r=>r.score>=0)).slice(0,2).map(r=>r.p);
 memory.options=picks.map(p=>p[0]);
 return answer('For '+topicName,picks.map(p=>[p[1],p[3]+' about '+topicName+'.']),'Which would you like to make?');
}
