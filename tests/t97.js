// The emails keep their hours and follow the tour. A Wednesday tour is
// written about on the Tuesday at 8:30 and noon and on the Wednesday at
// 7:45, exactly as it always was. A Tuesday tour is written about on the
// Monday at 8:30 and noon and on the Tuesday at 7:45. Nothing goes out
// on a day with no tour to write about, and a week with two tours in it
// gets both.
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
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
rows_(SHEETS.TEACHERS).forEach((r,i)=>m.sheets[SHEETS.TEACHERS]
  .getRange(i+2,col_(SHEETS.TEACHERS,'Teacher Email')+1).setValue('x@lrei.org'));
const MON='2026-10-05', TUE='2026-10-06', WED='2026-10-07', FRI='2026-10-09';
const put=(row,date,name)=>['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(row,col_(P,h)+1)
    .setValue([date,name,'PS 41','6','Female','WP','M'][k]));
put(2,TUE,'Sam Visitor');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour(TUE,true,[],[{visitor:'Sam Visitor',to:'Blake Glenn',add:true}],[]);
clearReadCache_();
ok(WEEKDAYS_[toDate_(MON).getDay()]==='Monday'&&WEEKDAYS_[toDate_(TUE).getDay()]==='Tuesday',
   MON+' is the Monday before the Tuesday tour on '+TUE);

console.log('the four sends, and the hours they keep');
const slot=(who,when)=>REMINDER_SLOTS_.filter(s=>s.who===who&&s.when===when)[0];
ok(slot('teachers','before').hour===8&&slot('teachers','before').minute===30,
   'teachers, the day before, at 8:30');
ok(slot('students','before').hour===12&&slot('students','before').minute===0,
   'students, the day before, at noon');
ok(slot('teachers','of').hour===7&&slot('teachers','of').minute===45,
   'teachers, the morning of, at 7:45');
ok(slot('students','of').hour===7&&slot('students','of').minute===45,
   'students, the morning of, at 7:45');
ok(REMINDER_SLOTS_.length===4,'and there are four of them, as before');

console.log('\nwhich day each lands on, for a tour on each day of the week');
const landsOn=(who,date)=>sendDaysFor_(who,toDate_(date))
  .map(d=>WEEKDAYS_[d.when.getDay()]+' '+d.slot);
ok(landsOn('teachers',WED).join(', ')==='Tuesday before, Wednesday of',
   'a Wednesday tour: '+landsOn('teachers',WED).join(', '));
ok(landsOn('students',WED).join(', ')==='Tuesday before, Wednesday of',
   'and its students: '+landsOn('students',WED).join(', '));
ok(landsOn('teachers',TUE).join(', ')==='Monday before, Tuesday of',
   'a Tuesday tour: '+landsOn('teachers',TUE).join(', '));
ok(landsOn('students',TUE).join(', ')==='Monday before, Tuesday of',
   'and its students: '+landsOn('students',TUE).join(', '));
ok(landsOn('teachers',FRI).join(', ')==='Thursday before, Friday of',
   'a Friday tour: '+landsOn('teachers',FRI).join(', '));
// Nobody reads a Sunday email, so a Monday tour's first send is Friday.
ok(landsOn('teachers',MON).join(', ')==='Friday before, Monday of',
   'a Monday tour: '+landsOn('teachers',MON).join(', '));

console.log('\nthe Monday before the Tuesday tour');
global.PRETEND_TODAY_=toDate_(MON);
global.__sent.length=0;
let r=remindTeachersDayBefore();
ok(global.__sent.length>0,global.__sent.length+' teacher email(s) went out on the Monday');
const bodies=()=>global.__sent.map(x=>String(x.htmlBody||'')
  .replace(/<[^>]*>/g,' ').replace(/\s+/g,' '));
ok(bodies().some(t=>/tomorrow \(Tuesday, October 6\)/.test(t)),
   'saying tomorrow, and which day that is: "'+
   (bodies().filter(t=>/tomorrow/.test(t))[0]||'').match(/[^.]*tomorrow[^.]*/)[0].trim()+'"');
global.__sent.length=0;
r=remindStudentsDayBefore();
ok(global.__sent.length>0,global.__sent.length+' student email(s) too');
ok(global.__sent.every(x=>!/Today/.test(String(x.subject||''))),
   'none of them titled Today: "'+global.__sent[0].subject+'"');
global.__sent.length=0;
ok(/No tour to write about/.test(remindTeachersMorningOf().note||''),
   'and the 7:45 send has nothing to say on the Monday');
ok(global.__sent.length===0,'so it writes to nobody');

console.log('\nthe Tuesday morning itself');
global.PRETEND_TODAY_=toDate_(TUE);
global.__sent.length=0;
remindStudentsMorningOf();
ok(global.__sent.length>0,global.__sent.length+' student email(s) at 7:45');
ok(global.__sent.some(x=>/Today/.test(String(x.subject||''))),
   'titled "'+global.__sent.filter(x=>/Today/.test(String(x.subject||'')))[0].subject+'"');
ok(bodies().some(t=>/today \(Tuesday, October 6\)/.test(t)),'and reading today');
global.__sent.length=0;
remindTeachersMorningOf();
ok(global.__sent.length>0,global.__sent.length+' teacher email(s) with them');
global.__sent.length=0;
ok(/No tour to write about/.test(remindStudentsDayBefore().note||''),
   'the noon send has nothing left to say that day');
ok(global.__sent.length===0,'and writes to nobody');

console.log('\nand on a day with no tour anywhere near it, nothing at all');
global.PRETEND_TODAY_=toDate_('2026-09-14');
global.__sent.length=0;
['remindTeachersDayBefore','remindTeachersMorningOf','remindStudentsDayBefore',
 'remindStudentsMorningOf'].forEach(f=>{
  const out=global[f]();
  ok(/No tour to write about/.test(out.note||''),f+' stands down');
});
ok(global.__sent.length===0,'not one email went out');

console.log('\ntwo tours in one week, and both are written about');
global.PRETEND_TODAY_=null;
put(3,WED,'Robin Visitor');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour(WED,true,[],[{visitor:'Robin Visitor',to:'Camille Bedeau',add:true}],[]);
clearReadCache_();
global.PRETEND_TODAY_=toDate_(TUE);
clearReadCache_();
ok(dateKey_(tourToRemind_('of'))===TUE,'the Tuesday morning send is for the Tuesday tour');
ok(dateKey_(tourToRemind_('before'))===WED,
   'and the 8:30 that same morning is for the Wednesday one');
global.__sent.length=0;
remindTeachersDayBefore();
ok(bodies().some(t=>/tomorrow \(Wednesday, October 7\)/.test(t)),
   'which is what its emails say: "'+
   (bodies().filter(t=>/tomorrow/.test(t))[0]||'').match(/[^.]*tomorrow[^.]*/)[0].trim()+'"');
global.PRETEND_TODAY_=null;

console.log('\nturning them on installs four daily sends');
global.__triggers.length=0;
// What a sheet set up before this change still has on it: the old pair,
// pinned to their weekday.
global.__triggers.push({getHandlerFunction:()=>HANDLER_TEACHER_EMAILS,day:'TUESDAY'});
global.__triggers.push({getHandlerFunction:()=>HANDLER_STUDENT_EMAILS,day:'WEDNESDAY'});
ok(api_checkScript().reminders.old===2,'Check This Script sees the two old ones');
enableReminders();
ok(global.__triggers.length===4,global.__triggers.length+' triggers after turning them on');
ok(global.__triggers.every(t=>t.days===1),'every one of them runs every day');
ok(global.__triggers.every(t=>t.day===undefined),'and none is pinned to a weekday');
const at=global.__triggers.map(t=>t.hour+':'+String(t.minute||0)).sort().join(' ');
ok(at==='12:0 7:45 7:45 8:30','at the same hours as before: '+at);
ok(api_checkScript().reminders.old===0,'the old pair is gone');
ok(api_checkScript().reminders.on.length===4,'and all four are reported on');
ok((global.__alerts.join(' ')).indexOf('follow the tour')!==-1,
   'and she is told they follow the tour');
disableReminders();
ok(global.__triggers.length===0,'turning them off clears the lot');

console.log('\nthe emails go out the day before and the morning of, whatever day that is.');
