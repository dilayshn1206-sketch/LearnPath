// Fixed, authored guidance only. No model, free-text input or remote requests.
const COMPASS_PREPARED={
 topic:{question:'What do you enjoy? Choose one or more.',options:[
 ['games','I like games','Games connect to digital life. Explore kind game chats, your gaming identity or balancing screen time.',['care','identity','balance']],
 ['videos','I like videos','Explore what makes a video believable, or asking permission before sharing a clip.',['truth','privacy']],
 ['music','I like music or art','Explore expressing yourself online, or giving credit and asking before sharing someone’s work.',['identity','privacy','learning']],
 ['friends','I like talking with friends','Explore kind messages, online friendship or sharing photos safely.',['care','privacy']],
 ['sports','I like sports','Explore sharing sports clips, kind comments or checking sports news online.',['privacy','care','truth']],
 ['making','I like making things','Explore learning a skill online or making something useful with technology.',['learning']],
 ['unsure','I’m not sure yet','Think about a game, photo, message or video from your day. Which digital choice would you like to explore?',['identity','care','balance','privacy','learning','truth']]
 ]},
 product:{question:'How would you like to work? Choose one or more.',options:[
 ['write','I like writing','Try a blog for opinions, a story for an experience, a written interview for viewpoints or a how-to guide for advice.',['blog','story','written_interview','howto']],
 ['speak','I like speaking','Try a short talk to explain, a podcast to discuss, an interview to ask questions or a role-play to act out a situation.',['talk','podcast','interview','roleplay']],
 ['draw','I like pictures and design','Try a poster for one message, a comic for a situation, an infographic for facts or a slide story for pictures and captions.',['poster','comic','infographic','slides']],
 ['ask','I like asking people questions','A written or spoken interview helps you compare people’s views on your topic.',['written_interview','interview']],
 ['act','I like telling stories or acting','A story, role-play, comic or visual slide story can show a digital choice and what happens next.',['story','roleplay','comic','slides']],
 ['advice','I want to give advice','A how-to guide, poster or infographic can help someone make safer, kinder digital choices.',['howto','poster','infographic']]
 ]}
};
function preparedGuideHTML(key){
 const config=COMPASS_PREPARED[key];if(!config)return '<p class="bubble assistant">'+esc(opening())+'</p>';
 state.chatChoices??={};const selected=state.chatChoices[key]||[],sent=state.chat[key]?.selected||[];
 const replies=config.options.filter(o=>sent.includes(o[0]));
 const ids=[...new Set(replies.flatMap(o=>o[3]))];
 const suggestions=key==='topic'?topics:formats;
 return '<details class="compass-choice-editor" '+(!replies.length?'open':'')+'><summary>Choose or change my interests</summary><form id="prepared-guide" novalidate><fieldset class="compass-options"><legend>'+esc(config.question)+'</legend>'+config.options.map(([id,label])=>'<label><input type="checkbox" data-compass-choice="'+id+'" '+(selected.includes(id)?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+'</fieldset><button class="primary" id="compass-reply" type="submit" '+(!selected.length?'disabled':'')+'>Show me ideas</button></form></details><div class="chat-log" role="status" aria-live="polite">'+(replies.length?'<p class="bubble user">'+esc(replies.map(o=>o[1]).join(' · '))+'</p>'+replies.map(o=>'<p class="bubble assistant">'+esc(o[2])+'</p>').join('')+'<p class="hint">Choose one below, or use the choices on the left.</p><div class="compass-suggestions">'+ids.map(id=>{const item=suggestions.find(t=>t[0]===id);return item?'<button type="button" class="secondary" data-compass-pick="'+id+'">'+esc(item[1])+'</button>':'';}).join('')+'</div>':'<p class="bubble assistant">'+esc(opening())+'</p>')+'</div>';
}
function bindPreparedGuide(){
 const key=chatKey(),form=$('#prepared-guide');if(!form)return;
 document.querySelectorAll('[data-compass-choice]').forEach(input=>input.onchange=()=>{state.chatChoices[key]=Array.from(document.querySelectorAll('[data-compass-choice]:checked'),x=>x.dataset.compassChoice);$('#compass-reply').disabled=!state.chatChoices[key].length;});
 form.onsubmit=e=>{e.preventDefault();const selected=state.chatChoices[key]||[];if(!selected.length)return;state.chat[key]={selected:[...selected]};render();$('.compass-choice-editor summary').focus({preventScroll:true});};
 document.querySelectorAll('[data-compass-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.compassPick;if(key==='topic')state.topic=id;else{state.format=id;state.category=groups.find(g=>g.formats.some(f=>f[0]===id)).id;}render();document.querySelector(key==='topic'?'[data-choice="'+id+'"]':'[data-product="'+id+'"]').focus({preventScroll:true});});
}
