// A tour guide is told who they are walking with, on their slip and in
// their email, because finding out in the cafeteria on the morning is
// half the fun gone. Guides only: a panel and a greeting crew are a
// group standing in one place, and naming the rest of them is a list
// nobody needs.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 set('Can Solo','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
[['2026-11-04','Sam Visitor','PS 41','6','Female','WP','M'],
 ['2026-11-04','Lee Visitor','Grace','7','Male','WP','Q']]
 .forEach((v,i)=>['Tour Date','Name','School','Grade','Gender','Race','Borough']
   .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1).setValue(v[k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-11-04');
const panel=api_handChoices('2026-11-04',JOBS.PANELIST).rows.slice(0,4).map(r=>r.name);
api_saveByHand('2026-11-04',JOBS.PANELIST,panel);
clearReadCache_();
const plan=planTour('2026-11-04',true);
const can=[];
plan.spare.filter(c=>c.jobs[JOBS.GUIDE]&&panel.indexOf(c.name)===-1).forEach(c=>{
  if(can.length>=3) return;
  if(can.some(x=>keptApart_(x.name,c.name))) return;
  can.push(c.name);});
const crew=plan.spare.filter(c=>c.jobs[JOBS.TABLE]&&can.indexOf(c.name)===-1&&
  panel.indexOf(c.name)===-1).slice(0,2).map(c=>c.name);
commitTour('2026-11-04',true,panel,
  [{visitor:'Sam Visitor',to:can[0],add:true},
   {visitor:'Sam Visitor',to:can[1],add:true},
   {visitor:'Lee Visitor',to:can[2],add:true}]
   .concat(crew.map(n=>({job:JOBS.TABLE,to:n,add:true}))),[]);
clearReadCache_();
const slipOf=n=>lockerSlipData_(wed).filter(s=>s.name===n)[0];
const mailTo=who=>{
  const addr=String((ambassadors_().filter(a=>a.name===who)[0]||{}).email||'x').toLowerCase();
  const hit=global.__sent.filter(x=>String(x.to||'').toLowerCase().indexOf(addr)===0)[0];
  return String((hit||{}).htmlBody||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
};
global.__sent.length=0;
sendStudentEmails('2026-11-04');

console.log('a guide is told who they are walking with');
ok(slipOf(can[0]).jobs.join(' / ')==='Tour Guide for Sam Visitor, with '+can[1],
   can[0]+'\'s slip: "'+slipOf(can[0]).jobs.join(' / ')+'"');
ok(slipOf(can[1]).jobs.join(' / ')==='Tour Guide for Sam Visitor, with '+can[0],
   'and '+can[1]+'\'s says the other way round');
ok(new RegExp('Tour Guide for Sam Visitor, with '+can[1]).test(mailTo(can[0])),
   'their email says it too');

console.log('\nand a guide walking a family alone is not told about nobody');
ok(slipOf(can[2]).jobs.join(' / ')==='Tour Guide for Lee Visitor',
   can[2]+' is on their own: "'+slipOf(can[2]).jobs.join(' / ')+'"');
ok(!/with ,|, with\s*$/.test(mailTo(can[2])),'and their email has no dangling "with"');

console.log('\nthe panel and the crews are not given a list of each other');
const pan=slipOf(panel[0]);
ok(pan.jobs.every(j=>!/with/.test(j)),
   panel[0]+'\'s slip: "'+pan.jobs.join(' / ')+'"');
ok(!/Panelist, with/.test(mailTo(panel[0])),'nor their email');
const greeter=slipOf(crew[0]);
ok(greeter.jobs.every(j=>!/with/.test(j)),
   crew[0]+'\'s slip: "'+greeter.jobs.join(' / ')+'"');
ok(!new RegExp(JOBS.TABLE+', with').test(mailTo(crew[0])),'nor theirs');

console.log('\nand two children on one tour name the partner on each line');
m.sheets[P].getRange(2,col_(P,'Tour With')+1).setValue('Lee Visitor');
clearReadCache_();
commitTour('2026-11-04',true,panel,[],[]);
clearReadCache_();
const both=slipOf(can[0]);
ok(both.jobs.length===2,'two lines: "'+both.jobs.join('" / "')+'"');
ok(both.jobs.every(j=>/, with /.test(j)),'each naming who they are with');

console.log('\ntheir partner, before the morning.');
