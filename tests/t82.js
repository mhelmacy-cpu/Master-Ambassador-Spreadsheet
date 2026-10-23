// The greeting crews go down at 8:15, ten minutes before everybody else:
// the first families are at the door before the ambassadors meet in the
// cafeteria. Their own email, their locker slip and their teacher all
// say 8:15, and nobody else's hour moves.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(r[0]+' '+r[1]).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
rows_(SHEETS.TEACHERS).forEach((r,i)=>m.sheets[SHEETS.TEACHERS]
  .getRange(i+2,col_(SHEETS.TEACHERS,'Teacher Email')+1).setValue('x@lrei.org'));
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');

console.log('the hours on the Jobs sheet');
const h=jobHours_();
ok(h[norm_(JOBS.LOBBY)].from==='8:15 AM','a lobby greeter is on the door from 8:15 AM');
ok(h[norm_(JOBS.TABLE)].from==='8:15 AM','and the table crew with them');
ok(h[norm_(JOBS.LOBBY)].to==='8:45 AM','both still finish at 8:45 AM, as before');
ok(h[norm_(JOBS.TABLE)].to==='8:45 AM','both of them');
ok(h[norm_(JOBS.GUIDE)].from==='8:25 AM' && h[norm_(JOBS.GUIDE)].to==='9:05 AM',
   'a tour guide is unchanged: '+h[norm_(JOBS.GUIDE)].from+' - '+h[norm_(JOBS.GUIDE)].to);
ok(h[norm_(JOBS.PANELIST)].from==='8:25 AM','and so is a panelist');
ok(setting_('Ambassadors Report At','')==='8:25 AM',
   'the hour everybody else meets is still 8:25 AM');

/* A tour, with the panel saved, so two of them cover the door and
 * somebody carries both jobs. The crews are hers to pick now, so the
 * table crew is picked here and the door is left to the panel. */
const panel=api_handChoices('2026-10-07',JOBS.PANELIST).rows.slice(0,4).map(r=>r.name);
const free=n=>planTour('2026-10-07',true).spare
  .filter(c=>c.jobs[JOBS.TABLE]&&!c.busy&&panel.indexOf(c.name)===-1)
  .slice(0,n).map(c=>c.name);
commitTour('2026-10-07',true,panel,
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true}],[]);
clearReadCache_();
const onTable=free(2);
commitTour('2026-10-07',true,panel,
  onTable.map(n=>({job:JOBS.TABLE,to:n,add:true})),[]);
clearReadCache_();
const jobsOf=n=>rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])===n)
  .map(r=>trim_(r[col_(T,'Job')]));
const greeter=rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.TABLE)
  .map(r=>trim_(r[col_(T,'Ambassador')]))[0];
const both=rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.LOBBY)
  .map(r=>trim_(r[col_(T,'Ambassador')]))
  .filter(n=>jobsOf(n).indexOf(JOBS.PANELIST)!==-1)[0];
ok(!!greeter,greeter+' is on the table crew');
ok(!!both,both+' is on the door and on the panel: '+jobsOf(both).join(' and '));

console.log('\ntheir own email says 8:15');
global.__sent.length=0;
sendStudentEmails('2026-10-07');
const mailTo=who=>{
  const addr=String((ambassadors_().filter(a=>a.name===who)[0]||{}).email||'x').toLowerCase();
  const hit=global.__sent.filter(x=>String(x.to||'').toLowerCase().indexOf(addr)===0)[0];
  return String((hit||{}).htmlBody||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
};
let mine=mailTo(greeter);
ok(/come to the cafeteria at 8:15 AM/.test(mine),
   'in so many words: "'+(mine.match(/Please come[^.]*\./)||[''])[0]+'"');
ok(/back in class by 8:45 AM/.test(mine),'and back in class by 8:45 AM, as before');

console.log('\nand a guide is still told 8:25');
const guide=mailTo('Blake Glenn');
ok(/come to the cafeteria at 8:25 AM/.test(guide),
   '"'+(guide.match(/Please come[^.]*\./)||[''])[0]+'"');

console.log('\nsomebody on the door and on the panel goes down with the crew');
const two=mailTo(both);
ok(/come to the cafeteria at 8:15 AM/.test(two),'they come at 8:15 AM');
ok(/back in class by 9:05 AM/.test(two),'and stay until the panel is done at 9:05 AM');

console.log('\nthe locker slips say the same');
const slips=lockerSlipData_(wed);
const slipOf=n=>slips.filter(s=>s.name===n)[0];
ok(slipOf(greeter).comeAt==='8:15 AM',greeter+' comes at '+slipOf(greeter).comeAt);
ok(slipOf(greeter).backBy==='8:45 AM','back at '+slipOf(greeter).backBy);
ok(slipOf('Blake Glenn').comeAt==='8:25 AM','a guide comes at 8:25 AM');
ok(slipOf(both).comeAt==='8:15 AM' && slipOf(both).backBy==='9:05 AM',
   both+': '+slipOf(both).comeAt+' to '+slipOf(both).backBy);
global.__doc=[];
buildLockerSlips('2026-10-07');
const printed=global.__doc.map(x=>String(x.t||''));
ok(printed.some(t=>/Cafeteria 8:15 AM\. Back in class by 8:45 AM\./.test(t)),
   'and it is what prints: "'+printed.filter(t=>/Cafeteria 8:15/.test(t))[0]+'"');
ok(printed.some(t=>/Cafeteria 8:25 AM\. Back in class by 9:05 AM\./.test(t)),
   'beside the guides\' own: "'+printed.filter(t=>/Cafeteria 8:25/.test(t))[0]+'"');

console.log('\nand their teachers are told the right window');
ok(awayWindow_([JOBS.LOBBY])==='8:15 AM - 8:45 AM',
   'a greeter is away '+awayWindow_([JOBS.LOBBY]));
ok(awayWindow_([JOBS.GUIDE])==='8:25 AM - 9:05 AM',
   'a guide '+awayWindow_([JOBS.GUIDE]));
ok(awayWindow_([JOBS.LOBBY,JOBS.PANELIST])==='8:15 AM - 9:05 AM',
   'and somebody with both jobs '+awayWindow_([JOBS.LOBBY,JOBS.PANELIST]));
global.__sent.length=0;
sendTeacherEmails('2026-10-07');
const theirs=global.__sent.filter(x=>String(x.htmlBody||'').indexOf(greeter)!==-1);
ok(theirs.length>0,theirs.length+' teacher email(s) name them');
ok(theirs.some(x=>/8:15 AM - 8:45 AM/.test(String(x.htmlBody))),
   'with the window on the row');

console.log('\nthe door is covered before the first family is through it.');
