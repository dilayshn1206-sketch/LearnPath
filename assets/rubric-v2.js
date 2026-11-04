/* EK 1 / EK 2, supplied 2026-11-02. Immutable version: never reinterpret old scores. */
(function(){
 const version='grade6-20261102-v2';
 function row(area,q,stem,endings){return {area,q,stem,levels:endings.slice().reverse().map((label,i)=>({label,itemNumber:4-i}))};}
 const self=[
  row('Sharing Ideas','How did I use English to share my ideas?','I…',[
   'put words I know together in my own way to share an idea.',
   'changed some words in sentences we learned to share my idea.',
   'used words or sentences exactly as we learned them.',
   'could not yet say or write what the task asked for.']),
  row('Words and Sentences','Did I use words, phrases, or sentences?','I used…',[
   'sentences and linked some of them together.',
   'sentences but did not link them together.',
   'mostly short phrases or lists.',
   'mostly single words.']),
  row('Impact','What did I add to keep my work interesting?','I added…',[
   'interesting details, examples, or pictures from start to finish.',
   'details, examples, or pictures in several parts.',
   'a detail, example, or picture in just one part.',
   'no details, examples, or pictures yet.']),
  row('Easy to Understand','How clear was my message?','I made…',[
   'my whole message easy to understand.',
   'most of my message easy to understand.',
   'only my main idea easy to understand.',
   'even my main idea hard to understand.']),
  row('English','How often did I use words and grammar correctly?','I used words and grammar…',[
   'correctly throughout my work.',
   'with a few mistakes.',
   'with mistakes in several parts.',
   'with mistakes in most parts.'])
 ];
 const peer=[
  row('Sharing Ideas','How did my classmate use English to share ideas?','My classmate…',[
   'made new sentences with words we know and added their own details.',
   'used class sentences but changed some words to say something new.',
   'used class sentences the same way we learned them.',
   'could not yet say or write.']),
  row('Words and Sentences','Did my classmate use words, phrases, or sentences?','My classmate used…',[
   'simple sentences and linked some of them with and, but, because.',
   'simple sentences without linking them.',
   'mostly short phrases or lists.',
   'mostly single words.']),
  row('Impact','How long did I stay interested?','My classmate held my interest…',[
   'from start to finish with details, examples, or pictures.',
   'during several parts of the presentation.',
   'for just a moment.',
   'at no point in the presentation.']),
  row('Easy to Understand','How much of the message was easy to understand?','My classmate made…',[
   'the whole message easy to understand.',
   'most of the message easy to understand.',
   'only the main idea easy to understand.',
   'even the main idea hard to understand.']),
  row('English','How often did my classmate use words and grammar correctly?','My classmate used words and grammar…',[
   'correctly throughout.',
   'with a few mistakes.',
   'with mistakes in several parts.',
   'with mistakes in most parts.'])
 ];
 [self,peer].forEach(rubric=>rubric.forEach((item,i)=>item.levels.forEach(level=>level.itemNumber+=i*4)));
 const explanations=[
  'Think about whether you used English in your own way, changed a class sentence, or used a sentence just as you learned it.',
  'Look for single words, short phrases, complete sentences and linking words such as and, but and because.',
  'Think about details, examples and pictures that make the work interesting. Look at how much of the work includes them.',
  'Think about the message as a whole. Could someone understand all of it, most of it, or just the main idea?',
  'Look at the words and grammar across the work. Think about where mistakes happen and how often.'
 ];
 function valid(values,rubric,complete=false){return Array.isArray(values)&&values.length===rubric.length&&Array.from(values).every(v=>(!complete&&v===null)||(Number.isInteger(v)&&v>=0&&v<rubric[0].levels.length));}
 function sentence(item,index){return (item.stem?item.stem.replace(/…$/,'')+' ':'')+item.levels[index].label;}
 function emphasize(text,escape){var parts=String(text).split(/(own details|own way|linked|without linking|did not link|single words|short phrases|start to finish|several parts|just one part|no details|whole message|most of|main idea|few mistakes|most parts|correctly throughout)/gi);return parts.map((part,i)=>i%2?'<strong>'+escape(part)+'</strong>':escape(part)).join('');}
 window.LearnPathRubrics={emphasize,version,legacyVersion:'legacy-6x3',self,peer,explanations,valid,sentence,performance:['Needs Work','Getting There','Good','Excellent'],instruction:'Read the beginning of each sentence. Tick one ending in each row.',selfInstruction:'Think about your work. Read each question, then tick one ending to finish each “I” sentence.',instructionTR:'Her cümlenin başlangıcını oku. Her satırda cümleyi tamamlayan bir seçenek işaretle.',selfInstructionTR:'Çalışmanı düşün. Her soruyu oku ve “I” ile başlayan cümleyi tamamlayan bir seçenek işaretle.'};
})();
