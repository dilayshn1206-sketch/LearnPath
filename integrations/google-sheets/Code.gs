/* LearnPath: run setupLearnPath once as dilayshn1206@gmail.com.
 * Before running, enter LP_EXPORT_KEY in Project Settings > Script Properties.
 * The key only reads the export queue; it cannot edit student data.
 * Do not publish this script as a public web app. Keep this project private.
 */
const LP_OWNER = 'dilayshn1206@gmail.com';
const LP_API = 'https://wrgkupncvgrcjsbfcqze.supabase.co/rest/v1/rpc/';
const LP_PUBLIC_KEY = 'sb_publishable_wHrLNg7N4NMwCnMJiBSHow_eraqDopE';
const LP_KINDS = {
  learning_contracts: 'Öğrenme sözleşmeleri',
  learning_diaries: 'Öğrenme günlükleri',
  self_evaluations: 'Öz değerlendirmeler',
  peer_evaluations: 'Akran değerlendirmeleri',
  teacher_evaluations: 'Öğretmen değerlendirmeleri',
  project_reflections: 'Proje sonu yansıtmalar',
  vocabulary: 'Kelime ön ve son değerlendirmeleri',
  grammar: 'Dilbilgisi ön ve son değerlendirmeleri',
  project_posts: 'Proje paylaşımları',
  other_inputs: 'Diğer öğrenci girdileri'
};
const LP_HEADERS = ['Satır kimliği','Kayıt kimliği','Kayıt zamanı (UTC)','Öğrenci kimliği','Öğrenci adı','Girdiyi yapan','Form kimliği','İşlem','Alan','Soru / açıklama','Yanıt','Bölüm','Parça'];

function lpOwner_() {
  if (Session.getEffectiveUser().getEmail().toLowerCase() !== LP_OWNER) {
    throw new Error('Kurulum ve tetikleyici dilayshn1206@gmail.com hesabıyla çalıştırılmalı.');
  }
}

function setupLearnPath() {
  lpOwner_();
  const props = PropertiesService.getScriptProperties();
  if (!/^[a-f0-9]{64}$/.test(props.getProperty('LP_EXPORT_KEY') || '')) {
    throw new Error('Önce Proje ayarları > Komut dosyası özellikleri bölümüne LP_EXPORT_KEY ekleyin.');
  }
  // Validate the key before creating files or a schedule.
  lpRpc_('lp_sheet_export', {p_after: Number(props.getProperty('LP_CURSOR') || 0), p_limit: 1});
  const files = lpFiles_();
  Object.keys(LP_KINDS).forEach(kind => {
    if (!files[kind]) {
      const title = 'LearnPath — ' + LP_KINDS[kind];
      // Recover an interrupted creation instead of duplicating an existing owned file.
      const existing = DriveApp.getFolderById(props.getProperty('LP_FOLDER_ID')).getFilesByName(title);
      const book = existing.hasNext() ? SpreadsheetApp.openById(existing.next().getId()) : SpreadsheetApp.create(title);
      files[kind] = book.getId();
      props.setProperty('LP_FILES', JSON.stringify(files));
      DriveApp.getFileById(book.getId()).moveTo(DriveApp.getFolderById(props.getProperty('LP_FOLDER_ID')));
    }
    lpSheet_(files[kind]);
  });
  syncLearnPath(); // No trigger created if the first sync fails.
  const triggers = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncLearnPath');
  if (!triggers.length) ScriptApp.newTrigger('syncLearnPath').timeBased().everyMinutes(5).create();
  console.log('Kurulum tamamlandı. Klasör: https://drive.google.com/drive/folders/' + props.getProperty('LP_FOLDER_ID'));
}

function lpFiles_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('LP_FOLDER_ID')) {
    const roots = DriveApp.getFoldersByName('ChatGPT');
    const root = roots.hasNext() ? roots.next() : DriveApp.createFolder('ChatGPT');
    const existing = root.getFoldersByName('LearnPath öğrenci kayıtları');
    const folder = existing.hasNext() ? existing.next() : root.createFolder('LearnPath öğrenci kayıtları');
    props.setProperty('LP_FOLDER_ID', folder.getId());
  }
  return JSON.parse(props.getProperty('LP_FILES') || '{}');
}

function lpSheet_(id) {
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName('Kayıtlar');
  if (!sheet) sheet = book.getSheets()[0].setName('Kayıtlar');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LP_HEADERS.length).setValues([LP_HEADERS]).setBackground('#16787d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 44);
    sheet.setColumnWidths(1, 9, 150);
    sheet.setColumnWidth(10, 320);
    sheet.setColumnWidth(11, 420);
    sheet.setColumnWidths(12, 2, 100);
    sheet.getRange(1, 1, 1, LP_HEADERS.length).createFilter();
  } else if (JSON.stringify(sheet.getRange(1, 1, 1, LP_HEADERS.length).getValues()[0]) !== JSON.stringify(LP_HEADERS)) {
    throw new Error('Başlıklar değiştirilmiş. Kayıtlar sekmesinin başlıklarını geri yükleyin.');
  }
  return sheet;
}

function lpRpc_(name, args) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('LP_EXPORT_KEY');
  const response = UrlFetchApp.fetch(LP_API + name, {
    method: 'post', contentType: 'application/json', headers: {apikey: LP_PUBLIC_KEY},
    payload: JSON.stringify(Object.assign({p_token: token}, args)), muteHttpExceptions: true
  });
  if (response.getResponseCode() >= 300) throw new Error('LearnPath aktarım isteği başarısız: HTTP ' + response.getResponseCode());
  return JSON.parse(response.getContentText() || 'null');
}

// Escape spreadsheet formulas, including leading whitespace before the formula marker.
function lpCell_(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

function lpLeaves_(value, path, result) {
  if (value !== null && typeof value === 'object' && Object.keys(value).length) {
    Object.keys(value).forEach(k => lpLeaves_(value[k], path.concat(k), result));
  } else {
    result.push({path: path, value: value !== null && typeof value === 'object' ? JSON.stringify(value) : value});
  }
}

function lpQuestion_(event, path) {
  const p = event.payload || {};
  if (event.kind === 'grammar' && path[0] === 'answers') {
    const q = (p.questions || (event.unit_context || {}).grammarQuestions || [])[Number(path[1])];
    return q ? q.q + ' | ' + q.options.map((o,i) => String.fromCharCode(97+i)+') '+o).join(' / ') : 'Soru ' + (Number(path[1])+1);
  }
  if (event.kind === 'vocabulary' && path[0] === 'checked') {
    return (p.words || String((event.unit_context || {}).words || '').split('\n'))[Number(path[1])] || 'Kelime ' + (Number(path[1])+1);
  }
  const labels = {well:'What went well?',improve:'What could be improved?',learned:'What I learned today / this week',difficult:'The most difficult part for me',satisfied:'I am satisfied with my product',followedPlan:'I followed my project plan',achievedGoals:'I achieved my goals',gotScore:'I got the score I wanted',teacherComment:'Teacher feedback'};
  return labels[path[0]] || path.join(' / ');
}

function lpRows_(event) {
  const leaves=[];
  lpLeaves_(event.payload, [], leaves);
  // Preserve question/word context even when a teacher later replaces the unit.
  if (event.kind === 'grammar' || event.kind === 'vocabulary') lpLeaves_(event.unit_context, ['unitContext'], leaves);
  const rows=[];
  leaves.forEach(leaf => {
    const text=leaf.value === null ? 'null' : String(leaf.value);
    const chunks=Math.max(1, Math.ceil(text.length/30000));
    for(let part=0;part<chunks;part++) {
      const field=JSON.stringify(leaf.path);
      const key=event.id + ':' + field + ':' + part;
      rows.push([key,event.id,event.recorded_at,event.student_id,event.student_name,event.actor,event.record_id,event.operation,field,lpQuestion_(event,leaf.path),text.slice(part*30000,(part+1)*30000),((event.payload||{}).stage||''),String(part+1)+'/'+chunks].map(lpCell_));
    }
  });
  return rows;
}

function syncLearnPath() {
  lpOwner_();
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  const props=PropertiesService.getScriptProperties();
  try {
    const files=JSON.parse(props.getProperty('LP_FILES') || '{}');
    let cursor=Number(props.getProperty('LP_CURSOR') || 0);
    const stop=Date.now()+200000;
    while (Date.now()<stop) {
      const events=lpRpc_('lp_sheet_export',{p_after:cursor,p_limit:25});
      if (!events.length) break;
      const grouped={};
      events.forEach(event => {
        if(!LP_KINDS[event.kind] || !files[event.kind]) throw new Error('Eksik kayıt dosyası: '+event.kind);
        (grouped[event.kind] || (grouped[event.kind]=[])).push(...lpRows_(event));
      });
      Object.keys(grouped).forEach(kind => {
        const sheet=lpSheet_(files[kind]);
        const last=sheet.getLastRow();
        const seen=new Set(last>1?sheet.getRange(2,1,last-1,1).getValues().map(r=>String(r[0])):[]);
        const rows=grouped[kind].filter(row=>!seen.has(row[0]));
        if(rows.length) {
          const needed=last+rows.length;
          if(needed>sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
          sheet.getRange(last+1,1,rows.length,LP_HEADERS.length).setNumberFormat('@').setValues(rows).setWrap(true).setVerticalAlignment('top');
          const filter=sheet.getFilter();if(filter)filter.remove();
          sheet.getRange(1,1,needed,LP_HEADERS.length).createFilter();
        }
      });
      SpreadsheetApp.flush();
      cursor=Number(events[events.length-1].id);
      // Persist cursor only after every target file is written; partial retries deduplicate by row key.
      props.setProperty('LP_CURSOR',String(cursor));
      lpRpc_('lp_sheet_ack',{p_cursor:cursor,p_files:files});
    }
    lpRpc_('lp_sheet_ack',{p_cursor:cursor,p_files:files});
    props.setProperty('LP_LAST_SUCCESS',new Date().toISOString());
    props.deleteProperty('LP_LAST_ERROR');
  } catch(error) {
    props.setProperty('LP_LAST_ERROR',new Date().toISOString()+' '+error.message);
    throw error;
  } finally {lock.releaseLock();}
}

function stopLearnPath() {
  lpOwner_();
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncLearnPath').forEach(t=>ScriptApp.deleteTrigger(t));
  // Files and Supabase records are retained. Disable the key in the teacher panel separately.
}
