const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('integrations/google-sheets/Code.gs','utf8');
const props=new Map([['LP_EXPORT_KEY','a'.repeat(64)],['LP_FILES',JSON.stringify({grammar:'grammar',learning_diaries:'diary'})]]);
const books=new Map();let failDiary=true,acked=0;
function sheet(){
 const rows=[];
 return {rows,getLastRow:()=>rows.length,getMaxRows:()=>10000,insertRowsAfter:()=>{},getName:()=> 'Kayıtlar',
 getRange(r,c,n,m){const range={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),setValues(values){if(this.fail)throw Error('write failed');values.forEach((v,i)=>{rows[r-1+i]??=[];v.forEach((x,j)=>rows[r-1+i][c-1+j]=x);});return range;},setNumberFormat:()=>range,setWrap:()=>range,setVerticalAlignment:()=>range,setBackground:()=>range,setFontColor:()=>range,setFontWeight:()=>range,createFilter:()=>range};return range;},
 setFrozenRows:()=>{},setRowHeight:()=>{},setColumnWidths:()=>{},setColumnWidth:()=>{},getFilter:()=>({remove(){}})};
}
['grammar','diary'].forEach(id=>{const s=sheet();books.set(id,{getSheetByName:()=>s,getSheets:()=>[s]});});
const events=[{id:1,kind:'grammar',payload:{answers:{0:0},questions:[{q:'Question',options:['wrong','right'],correct:1}]},unit_context:{}},{id:2,kind:'learning_diaries',payload:{learned:'=IMPORTXML("evil")'},unit_context:{}}];
const context={console,Session:{getEffectiveUser:()=>({getEmail:()=> 'dilayshn1206@gmail.com'})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},UrlFetchApp:{fetch(url,options){const args=JSON.parse(options.payload);if(url.endsWith('lp_sheet_ack')){acked=args.p_cursor;return{getResponseCode:()=>200,getContentText:()=> 'null'};}return{getResponseCode:()=>200,getContentText:()=>JSON.stringify(events.filter(e=>e.id>args.p_after))};}},SpreadsheetApp:{openById(id){if(id==='diary'&&failDiary)throw Error('Simulated spreadsheet outage');return books.get(id);},flush(){}}};
vm.createContext(context);vm.runInContext(source+'\nthis.test={rows:lpRows_,cell:lpCell_,sync:syncLearnPath};',context);
assert.equal(context.test.cell('  =1+1'),"'  =1+1");
const long=context.test.rows({id:99,kind:'learning_diaries',payload:{learned:'a'.repeat(75000)},unit_context:{}});
assert.equal(long.length,3);assert.equal(long.map(r=>r[10]).join(''),'a'.repeat(75000));assert.equal(new Set(long.map(r=>r[0])).size,3);
assert.throws(()=>context.test.sync(),/outage/);assert.equal(props.get('LP_CURSOR'),undefined);assert.equal(acked,0);
const before=books.get('grammar').getSheetByName().rows.length;assert.ok(before>1);
failDiary=false;context.test.sync();
assert.equal(books.get('grammar').getSheetByName().rows.length,before,'Partial retry duplicated already-written rows');
assert.equal(props.get('LP_CURSOR'),'2');assert.equal(acked,2);
const diary=books.get('diary').getSheetByName().rows;assert.equal(diary[1][10],"'=IMPORTXML(\"evil\")");
context.test.sync();assert.equal(books.get('diary').getSheetByName().rows.length,diary.length);
context.Session.getEffectiveUser=()=>({getEmail:()=> 'wrong@example.test'});assert.throws(()=>context.test.sync(),/1206/);
console.log('PASS: partial retries, cursor safety, row deduplication, 75k-character answers, formula injection escaping, owner account guard');
