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
  question:function(index,self){return (self?selfQuestions:peerQuestions)[index]||'Which Step describes the work?';},
  criterion:function(index,area){return companion(area,explanations[index]||'Read the three descriptions and compare them with the work.')+'<p class="lp-share-guide-note">Choose the description that matches the work today. There is no need to choose the highest Step.</p>';},
  goals:function(c,goals,page,error){
   if(error)return companion('Before you share','Your saved goals could not be loaded. You can still share your work.');
   c=c||{};var name=focusNames[c.weakness],tips=c.weaknessTips||[],html=companion('Before you share',name?'You told me you needed help with '+name+'.':'Let’s look at your project before you share it.');
   if(tips.length)return html+'<ul class="lp-share-focus-questions">'+tips.map(function(t){return '<li>'+e(focusQuestions[t]||'Did you try this: “'+t+'”?')+'</li>';}).join('')+'</ul>';
   return html+'<p>No focus goals have been saved yet. Think about what helped you make your project.</p>';
  }
 };
}());
