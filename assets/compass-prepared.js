// Authored keyword replies only. Text stays in this tab; no model or chat API.
const COMPASS_PREPARED={
 topic:[
  ['games',/\b(games?|gaming|gamer|minecraft|roblox|oyun\w*)\b/,'Games connect to digital life. Explore kind game chats, your gaming identity or balancing screen time.'],
  ['videos',/\b(videos?|youtube|tiktok|films?)\b/,'Explore what makes a video believable, or asking permission before sharing a clip.'],
  ['music',/\b(music|songs?|art|draw\w*|paint\w*|muzik|sarki\w*|resim|sanat)\b/,'Explore expressing yourself online, or giving credit and asking before sharing someone’s work.'],
  ['friends',/\b(friends?|friendship|chat\w*|messag\w*|arkadas\w*|mesaj\w*)\b/,'Explore kind messages, online friendship or sharing photos safely.'],
  ['sports',/\b(sports?|football|basketball|tennis|soccer|spor|futbol|basketbol)\b/,'Explore sharing sports clips, kind comments or checking sports news online.'],
  ['making',/\b(mak\w*|creat\w*|build\w*|cod\w*|learn\w*|yap\w*|uret\w*|ogren\w*)\b/,'Explore learning a skill online or making something useful with technology.'],
  ['privacy',/\b(priv\w*|safe\w*|passwords?|photos?|permission|paylas\w*|guven\w*|sifre\w*)\b/,'Explore what is safe to share and when to ask permission. Use invented examples, not personal details.'],
  ['balance',/\b(balance|screen time|too much|offline|denge)\b/,'Explore how to balance online activities with sleep, school, friends and hobbies. What could help someone take a break?'],
  ['identity',/\b(identity|profiles?|avatars?|kimlik|profil)\b/,'Explore how a profile, avatar or post shows who someone is. What would you choose to show about yourself?'],
  ['kindness',/\b(kind\w*|bully\w*|respect\w*|nazik|saygi\w*)\b/,'Explore how words affect people online. What could someone say to make a digital conversation kinder?'],
  ['truth',/\b(fake|news|believ\w*|trust\w*|true|haber\w*|dogru)\b/,'Explore how to check a post before believing or sharing it. What clues could help someone decide?']
 ],
 product:[
  ['write',/\b(writ\w*|blog\w*|words?|yaz\w*)\b/,'Try a blog for opinions, a story for an experience, a written interview for viewpoints or a how-to guide for advice.'],
  ['speak',/\b(speak\w*|talk\w*|voice|podcast\w*|audio|konus\w*|ses)\b/,'Try a short talk to explain, a podcast to discuss, an interview to ask questions or a role-play to act out a situation.'],
  ['draw',/\b(pictures?|draw\w*|design\w*|visual\w*|posters?|infographic\w*|slides?|presentations?|sunum\w*|resim|gorsel\w*|tasar\w*)\b/,'Try a poster for one message, a comic for a situation, an infographic for facts or a slide story for pictures and captions.'],
  ['ask',/\b(ask\w*|questions?|interview\w*|soru\w*|roportaj\w*)\b/,'A written or spoken interview helps you compare people’s views on your topic.'],
  ['act',/\b(stor\w*|act(?:ing|ors?)?|role[ -]?play|comic\w*|hikaye\w*|oyna\w*)\b/,'A story, role-play, comic or visual slide story can show a digital choice and what happens next.'],
  ['advice',/\b(advice|help\w*|tips?|guide\w*|tavsiye\w*|yardim\w*)\b/,'A how-to guide, poster or infographic can help someone make safer, kinder digital choices.']
 ]
};
function preparedReply(key,text){
 const normalized=String(text).toLowerCase().replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const clauses=normalized.split(/\bbut\b|\band\b|\bama\b|[,;.]/).filter(c=>!(/\b(don't|dont|do not|dislike|hate)\b/.test(c)));
 const matched=(COMPASS_PREPARED[key]||[]).filter(([,pattern])=>clauses.some(c=>pattern.test(c))).slice(0,2);
 if(matched.length)return matched.map(row=>row[2]).join(' ')+' '+(key==='topic'?'Which idea about Your Digital Self interests you?':'Which could fit your topic?');
 if(/no idea|not sure|don't know|dont know|bilmiyorum|emin degil/.test(normalized))return key==='topic'?'Think about a game, photo, message or video from your day. What do you enjoy doing online?':'Would you enjoy writing, speaking or using pictures? Tell me what you like doing.';
 return key==='topic'?'Let’s connect your interest to Your Digital Self. Tell me one thing you enjoy, such as games, music or sport.':'Tell me how you like sharing ideas: writing, speaking, drawing, asking questions or acting.';
}
function preparedGuideHTML(key){
 if(!COMPASS_PREPARED[key])return '<p class="bubble assistant">'+esc(opening())+'</p>';
 const turns=state.chat[key]?.turns||[];
 return '<div class="chat-log" role="log" aria-label="Compass conversation" aria-live="polite"><p class="bubble assistant">'+esc(opening())+'</p>'+turns.map(turn=>'<p class="bubble user"><span class="sr-only">You: </span>'+esc(turn.text)+'</p><p class="bubble assistant"><span class="sr-only">Compass: </span>'+esc(turn.reply)+'</p>').join('')+'</div><form id="prepared-guide" novalidate><label for="chat-input">'+(key==='topic'?'What do you enjoy?':'How would you like to share your ideas?')+'</label><div class="chat-compose"><input id="chat-input" maxlength="300" autocomplete="off" placeholder="'+(key==='topic'?'I like games and music…':'I like speaking…')+'"><button class="primary" id="compass-reply" type="submit">Send</button></div></form>';
}
function bindPreparedGuide(){
 const key=chatKey(),form=$('#prepared-guide');if(!form)return;
 state.chatDraft??={};const input=$('#chat-input'),button=$('#compass-reply');input.value=state.chatDraft[key]||'';button.disabled=!input.value.trim();
 input.oninput=()=>{state.chatDraft[key]=input.value;button.disabled=!input.value.trim();};
 form.onsubmit=e=>{e.preventDefault();const text=input.value.trim().slice(0,300);if(!text)return;const turns=state.chat[key]?.turns||[];state.chat[key]={turns:turns.concat({text,reply:preparedReply(key,text)}).slice(-4)};state.chatDraft[key]='';render();$('.chat-log').scrollTop=$('.chat-log').scrollHeight;$('#chat-input').focus({preventScroll:true});};
}
