// The green/yellow light is gone. There is no Light column, nothing reads
// one if an older sheet still has it, no name is labelled "check first",
// and the tour saves without ticking a box to say she has checked
// anybody. This watches that it stays gone.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,sh=m.sheets[A];

console.log('no such column, and setup does not add one');
const heads=sh.getRange(1,1,1,30).getValues()[0].filter(Boolean);
ok(heads.indexOf('Light')===-1,'the Ambassadors sheet reads: '+heads.join(' | '));
ok(HEADERS[A].indexOf('Light')===-1,'and it is not in the headings the script makes');
ok(typeof LIGHT_OPTIONS==='undefined','there is no Green/Yellow list left in the script');
const again=setupSpreadsheet();
ok(sh.getRange(1,1,1,30).getValues()[0].filter(Boolean).indexOf('Light')===-1,
   'running setup again does not put it back');

console.log('\nand an older sheet that still has one is simply ignored');
const spare=sh.getLastColumn()+1;
sh.getRange(1,spare).setValue('Light');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 sh.getRange(i+2,spare).setValue('Yellow');   // every single one of them
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
ok(ambassadors_().every(a=>a.light===undefined),
   'an ambassador record carries no light at all');

const plan=planTour('2026-10-07',true);
ok(plan.needConfirm===undefined,'and a plan has nothing to confirm before saving');
ok(plan.spare.every(c=>c.yellow===undefined),'no name on the dropdowns is flagged');
ok(plan.free.every(f=>f.yellow===undefined),'nor on the panel list');
ok(api_handChoices('2026-10-07',JOBS.PANELIST).rows.every(r=>r.yellow===undefined),
   'nor on the one the panel step shows');

console.log('\nthe dialog says nothing about checking anybody first');
global.__dialogs.length=0; showStaffDialog();
const html=String(global.__dialogs[0].html);
ok(!/check first/i.test(html),'"check first" is nowhere in it');
ok(!/check with me first/i.test(html),'nor "check with me first"');
ok(!/check-first/.test(html),'nor the box it used to sit in');
ok(!/before saving/i.test(html),'nor the line that gated the save');
global.__dialogs.length=0; showSwapDialog();
ok(!/check (?:first|with me first)/i.test(String(global.__dialogs[0].html)),
   'and Change Who Is Working is clear of it too');

console.log('\nand the tour saves with nothing to tick');
const can=plan.spare.filter(c=>c.jobs[JOBS.GUIDE]).slice(0,2);
const res=commitTour('2026-10-07',true,[],
  can.map(c=>({visitor:'Sam Visitor',to:c.name,add:true})),[]);
clearReadCache_();
ok(res.written>0,res.written+' row(s) written straight to the Tour Tracker');
const guides=rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE)
  .map(r=>trim_(r[col_(T,'Ambassador')]));
ok(guides.length===2,'with both guides on it: '+guides.join(' and '));

console.log('\nthe light is out.');
