/* Prepared guidance only. No storage, grading or model calls. */
(function(){
 'use strict';
 var e=function(v){return LearnPathUI.escapeText(v);};
 var explanations=[
  'Ideas are the message you want to share. Look at what you explain, the details you add, and any reasons or examples.',
  'Order is how the parts of the project fit together. Look at the sequence, connecting words, and the beginning and ending.',
  'Clear English means the reader or listener can understand your message. Look at meaning as well as mistakes.',
  'Words are the vocabulary you chose. Look at repetition, topic words, and how well each word fits your meaning.',
  'This is about how you keep going when something is difficult. Think about notes, pictures, simpler words, or explaining another way.',
  'Audience means the people your project is for. Think about whether your words suit those people and the situation.'
 ];
 var selfQuestions=['How well did I explain my ideas?','How well did I organise my ideas?','How clear is my English?','How well did I choose my words?','What did I do when I got stuck?','How well did my words fit my audience?'];
 var peerQuestions=['How well are the ideas explained?','How well are the ideas organised?','How clear is the English?','How well do the words fit the topic?','What happens when this person gets stuck?','How well do the words fit the audience?'];
 var focusNames={speaking:'speaking',writing:'writing clearly',visual:'designing your project',ideas:'finding ideas'};
 var focusQuestions={
  'Practise your talk out loud.':'Did you practise your talk out loud?',
  'Record yourself once and listen.':'Did you record yourself and listen before sharing?',
  'Take a breath and speak slowly.':'Did you take a breath and speak slowly?',
  'Write three short ideas before you start.':'Did you write three short ideas before you started?',
  'Put one main idea in each paragraph.':'Did you put one main idea in each paragraph?',
  'Read your work aloud and fix confusing sentences.':'Did you read your work aloud and fix confusing sentences?',
  'Draw a quick plan before you start.':'Did you draw a quick plan before you started?',
  'Use only two or three colours.':'Did you use two or three colours?',
  'Use large, easy-to-read words.':'Did you use large, easy-to-read words?',
  'Think about something you know or enjoy.':'Did you think about something you know or enjoy?',
  'Write down three possible ideas.':'Did you write down three possible ideas?',
  'Choose the idea you can explain best.':'Did you choose the idea you can explain best?'
 };
 function companion(title,text){return '<div class="lp-share-guide-top">'+LearnPathUI.mascot()+'<div><p class="lp-eyebrow">Compass guide</p><h2>'+e(title)+'</h2></div></div><p class="lp-share-guide-copy">'+e(text)+'</p>';}
 window.LearnPathShare={
  question:function(index,self,rubric){return rubric&&rubric[index]&&rubric[index].stem?rubric[index].q:(self?selfQuestions:peerQuestions)[index]||'Which Step describes the work?';},
  criterion:function(index,area,rubric){var current=rubric&&rubric[index]&&rubric[index].stem;var cues=['Look for their own ideas.','Look for sentences and links.','Notice details, examples or pictures.','Think about how much you understood.','Look at words and grammar.'];return companion(area,current?cues[index]:'Compare the work with each description.')+'<p class="lp-share-guide-note">Choose what matches the work.</p><details class="lp-rubric-help"><summary>How to answer</summary><p>'+e(current?(rubric===LearnPathRubrics.self?LearnPathRubrics.selfInstruction:LearnPathRubrics.instruction):'Read each Step and choose one.')+'</p><p lang="tr">'+e(current?(rubric===LearnPathRubrics.self?LearnPathRubrics.selfInstructionTR:LearnPathRubrics.instructionTR):'Her açıklamayı oku ve birini seç.')+'</p></details>';},
  goals:function(c,goals,page,error,checks){
   if(error)return companion('Check your three goals','Your goals could not load. Please try again before sharing.')+'<button type="button" class="btn bts" onclick="openNewPost()">Try again</button>';
   c=c||{};var tips=c.weaknessTips||[],html=companion('My three goal checks','Choose ✓ Yes or ✕ Not yet.');
   if(tips.length!==3)return html+'<p>Choose what feels hardest in Get Ideas first, then return here.</p><button type="button" class="btn bts" onclick="startQuiz()">Open Get Ideas</button>';
   return html+'<p class="lp-share-check-hint" role="status">'+tips.filter(function(_,i){return typeof (checks||[])[i]==='boolean';}).length+' of 3 answered · Either is OK.</p><div class="lp-share-focus-questions">'+tips.map(function(t,i){return '<fieldset class="lp-share-focus-item"><legend>'+e(focusQuestions[t]||'Did you try this: “'+t+'”?')+'</legend><div class="lp-focus-answers">'+[true,false].map(function(value){return '<label class="lp-focus-answer"><input type="radio" name="focus-'+i+'" data-focus-check="'+i+'" data-focus-value="'+value+'" '+(checks&&checks[i]===value?'checked':'')+' required><span>'+(value?'✓ Yes':'✕ Not yet')+'</span></label>';}).join('')+'</div></fieldset>';}).join('')+'</div>';
  }
 };
}());
