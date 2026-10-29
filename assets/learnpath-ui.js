/* Presentation-only helpers. Never reads or writes the database. */
(function () {
  'use strict';
  var states = [false, false, false, false];
  var enabled = [true, true, false, true];
  var paused = false;
  var labels = ['What are we learning?', 'Get Ideas', 'Set goals and plan', 'Choose Resources'];
  var mapLabels = ['Explore', 'Plan', 'Create', 'Reflect'];
  var actions = ['renderStep1Screen', 'startQuiz', 'renderStep3Screen', 'renderResourcesScreen'];
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (s) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]; });
  }
  function mascot() {
    return '<div class="lp-mascot"><div class="lp-mascot-note"><strong>One step at a time.</strong><br>Your ideas make this project yours.</div><div class="lp-clock'+(paused?' paused':'')+'" role="img" aria-label="Compass learning companion"></div><button type="button" class="lp-motion-toggle" aria-pressed="'+paused+'" onclick="LearnPathUI.toggleMotion()">'+(paused?'Play animation':'Pause animation')+'</button></div>';
  }
  function hasPassport(c) {
    if (!c || !c.productType || !(c.submittedAt || c.status === 'pending' || c.status === 'approved')) return false;
    var goals = Object.keys(c.goals || {}).filter(function (key) { return c.goals[key] === true; }).length;
    if (/[\p{L}\p{N}]/u.test(String(c.goalsOtherText || '').replace(/^\s*i\s+will\b/i, ''))) goals++;
    return goals >= 3 && Array.isArray(c.planSteps) && c.planSteps.length >= 3 && c.planSteps.every(function (s) {
      return /[\p{L}\p{N}]/u.test(String(s || '').replace(/^(?:\s*i\s+will\b[\s.…]*)+/i, ''));
    });
  }
  function productLaunch(product) {
    var name = String(product || 'Your project');
    var key = name.toLowerCase();
    var formats = [
      ['infographic','infographics','How do short facts and pictures work together?'],
      ['visual slide','visual slide stories','How does each slide move the story forward?'],
      ['poster','posters','What catches your eye first? How much text is there?'],
      ['comic','comics','How do pictures and speech bubbles tell the story?'],
      ['written interview','written interviews','How are the questions and answers arranged?'],
      ['interview','interviews','How does the interviewer start and ask follow-up questions?'],
      ['podcast','podcasts','How does the speaker welcome listeners and introduce the topic?'],
      ['short talk','short talks','How does the speaker open, explain an idea and finish?'],
      ['role play','role plays','Who are the characters? What do they say to each other?'],
      ['how-to','how-to guides','How do the steps help someone follow the instructions?'],
      ['how to','how-to guides','How do the steps help someone follow the instructions?'],
      ['blog','blogs','How do the title and short paragraphs help the reader?'],
      ['story','stories','How does the story begin, develop and end?']
    ];
    var match = formats.find(function (format) { return key.indexOf(format[0]) !== -1; });
    var plural = match ? match[1] : name + ' examples';
    var prompt = match ? match[2] : 'How is it organised? What helps you understand its message?';
    var search = 'https://www.google.com/search?q=' + encodeURIComponent(plural + ' examples for students digital citizenship');
    return '<section class="lp-product-launch" aria-labelledby="lp-launch-title">'
      + '<div class="lp-launch-guide"><div class="lp-clock'+(paused?' paused':'')+'" role="img" aria-label="Compass learning companion"></div>'
      + '<button type="button" class="lp-motion-toggle" aria-pressed="'+paused+'" onclick="LearnPathUI.toggleMotion()">'+(paused?'Play animation':'Pause animation')+'</button></div>'
      + '<div class="lp-launch-paper"><p class="lp-launch-saved">Project idea saved</p><p class="lp-launch-format">'+escapeText(name)+'</p>'
      + '<h1 id="lp-launch-title">Let’s find a little inspiration.</h1>'
      + '<p class="lp-launch-invite">Check some '+escapeText(plural)+' online.</p>'
      + '<div class="lp-launch-notice"><strong>Look with Compass</strong><p>'+escapeText(prompt)+'</p><p>Borrow an idea about the format. Use your own words and ideas about Your Digital Self.</p></div>'
      + '<a class="btn bts lp-launch-examples" href="'+escapeText(search)+'" target="_blank" rel="noopener noreferrer">Explore examples <span aria-hidden="true">↗</span><small>Opens a search in a new tab</small></a>'
      + '<div class="lp-launch-next"><p>Ready to plan your own?</p><button type="button" class="btn btp" onclick="renderStep3Screen()">Set my goals and plan →</button></div></div></section>';
  }
  function drawMap() {
    var host = document.getElementById('lp-map');
    if (!host || document.body.dataset.role !== 'student') { if (host) host.hidden = true; return; }
    host.hidden = false;
    var screens = {step1:0,quiz:1,step3:2,resources:3};
    var current = screens[window._currentScreen];
    if (current === undefined) current = states.findIndex(function (s) { return !s; });
    var live = window._liveSession;
    var isSessionLocked = false;
    var html = '<svg class="lp-route" viewBox="0 0 1100 130" preserveAspectRatio="none" aria-hidden="true"><path d="M0 62 C130 128 195 -10 365 25 S560 126 730 68 S940 54 1100 100"/></svg><div class="lp-stations">';
    labels.forEach(function (label, i) {
      var status = states[i] ? 'Completed' : (i === current ? 'Current step' : (enabled[i] ? 'Available' : 'Choose a project idea first'));
      var blocked = !enabled[i] || isSessionLocked;
      html += '<button type="button" class="lp-station'+(states[i]?' done':'')+(i===current?' current':'')+'" '+(i===current?'aria-current="step" ':'')+(blocked?'disabled ':'')+'data-step="'+i+'" aria-label="'+escapeText(mapLabels[i]+': '+label+'. '+status)+'"><span class="lp-pin">'+(states[i]?'✓':i+1)+'</span><strong>'+mapLabels[i]+'</strong><small>'+status+'</small></button>';
    });
    host.innerHTML = html + '</div>';
    host.querySelectorAll('[data-step]').forEach(function (button) {
      button.addEventListener('click', function () { var fn = window[actions[Number(button.dataset.step)]]; if (typeof fn === 'function') fn(); });
    });
  }
  function decorateScreen() {
    var mc = document.getElementById('mc');
    if (!mc) return;
    mc.dataset.screen = window._currentScreen || '';
    // Legacy choice rows keep the exact same onclick handler; add keyboard parity.
    mc.querySelectorAll('.qo[onclick],.goal-row[onclick],.chip[onclick],.role-card[onclick]').forEach(function (el) {
      if (!el.getAttribute('onclick')) return;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-pressed', String(el.classList.contains('sel')));
      el.onkeydown = function (event) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); el.click(); } };
    });
    // Input IDs are presentation metadata, not data-model identifiers.
    mc.querySelectorAll('.fg').forEach(function (group, i) {
      var label = group.querySelector('label');
      var input = group.querySelector('input,select,textarea');
      if (label && input) { if (!input.id) input.id = 'lp-field-'+i; label.htmlFor = input.id; }
    });
    drawMap();
  }
  window.LearnPathUI = {
    escapeText:escapeText,
    mascot:mascot,
    productLaunch:productLaunch,
    hasPassport:hasPassport,
    setPassportReady:function (ready) {
      var label = ready ? 'My Learning Passport' : 'Set goals and plan';
      if (labels[2] !== label) { labels[2] = label; drawMap(); }
    },
    grammarFeedback:function (question, answer) {
      if (answer === question.correct) return '<p class="lp-grammar-correct">✓ Correct</p>';
      var explanation = (question.feedback || [])[answer] || 'Look at the meaning of the sentence and review the correct answer.';
      return '<div class="lp-grammar-feedback"><div class="lp-clock'+(paused?' paused':'')+'" role="img" aria-label="Compass learning companion"></div><div><strong>Let’s look at this together.</strong><p>'+escapeText(explanation)+'</p><p>Correct answer: <strong>'+escapeText(question.options[question.correct])+'</strong></p><button type="button" class="lp-motion-toggle" aria-pressed="'+paused+'" onclick="LearnPathUI.toggleMotion()">'+(paused?'Play animation':'Pause animation')+'</button></div></div>';
    },
    setProgress:function (done, unlocked) { states = done.map(Boolean); enabled = unlocked.map(Boolean); drawMap(); },
    setRole:function (role) { document.body.dataset.role = role; drawMap(); },
    openResources:function () {
      if(typeof window.renderResourcesScreen==='function') window.renderResourcesScreen();
    },
    toggleMotion:function () {
      paused = !paused;
      document.querySelectorAll('.lp-clock').forEach(function (el) { el.classList.toggle('paused', paused); });
      document.querySelectorAll('.lp-motion-toggle').forEach(function (el) { el.setAttribute('aria-pressed',String(paused)); el.textContent = paused?'Play animation':'Pause animation'; });
    },
    categoryIcon:function (cat) {
      var paths = {
        written:'<path d="M14 8h24l10 10v38H14z"/><path d="M38 8v12h10M22 29h18M22 37h18M22 45h12"/><path d="m45 48 9-9 4 4-9 9-6 2z" fill="#edbd60"/>',
        spoken:'<rect x="25" y="8" width="15" height="31" rx="7.5" fill="#a0c9cf"/><path d="M18 30v4a14 14 0 0 0 29 0v-4M33 48v9M24 57h18M29 17h7M29 23h7M29 29h7"/>',
        visual:'<path d="m10 12 42-3 4 44-42 4z"/><path d="m19 43 9-12 8 8 7-7 7 13z" fill="#afc9a2"/><circle cx="25" cy="23" r="5" fill="#edbd60"/><path d="m48 13 7-7 4 4-7 7-5 1z" fill="#edbd60"/>'
      };
      return '<svg viewBox="0 0 64 64" aria-hidden="true">'+paths[cat]+'</svg>';
    }
  };
  var mc = document.getElementById('mc');
  if (mc) new MutationObserver(function (mutations) {
    if (mutations.some(function (m) { return m.type === 'childList'; })) decorateScreen();
  }).observe(mc,{childList:true,subtree:true});
  document.addEventListener('visibilitychange', function () {
    document.querySelectorAll('.lp-clock').forEach(function (el) { el.style.animationPlayState = document.hidden || paused ? 'paused' : 'running'; });
  });
}());
