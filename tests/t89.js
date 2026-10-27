// Her locker slips still said 8:25 for the greeters after the hours
// changed in the script. They were right to: the hours live on her Jobs
// sheet, the sheet wins so she can change them, and only setup brought a
// cell still holding the script's own older answer up to date. Nothing
// should have to be run for a slip to say 8:15, so everything that
// prints or sends does that itself now.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,J=SHEETS.JOBS,sh=m.sheets[A];
const jsh=m.sheets[J];
const fromCol=col_(J,'Out of Class From')+1, toCol=col_(J,'Out of Class To')+1;
const rowOf=job=>rows_(J).findIndex(r=>trim_(r[col_(J,'Job Name')])===job)+2;
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');
const greeters=['Aurelia Walker','Aksel Ozturk','Ama Bediako Whyte'];
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true}].concat(
    greeters.slice(0,2).map(n=>({job:JOBS.LOBBY,to:n,add:true})),
    [{job:JOBS.TABLE,to:greeters[2],add:true}]),[]);
clearReadCache_();

console.log('her sheet, as it was: the hour the script used to set');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:25 AM');
jsh.getRange(rowOf(JOBS.TABLE),fromCol).setValue('8:25 AM');
clearReadCache_();
ok(jobHours_()[norm_(JOBS.LOBBY)].from==='8:25 AM',
   'the sheet says 8:25 AM, and the sheet wins');

console.log('\nand the slips say 8:15 anyway, with nothing run first');
global.__doc=[];
buildLockerSlips('2026-10-07');
const printed=global.__doc.map(o=>String(o.t||''));
ok(printed.some(t=>/Cafeteria 8:15 AM\. Back in class by 8:45 AM\./.test(t)),
   'a greeter\'s slip reads: "'+
   printed.filter(t=>/Cafeteria 8:15/.test(t))[0]+'"');
ok(printed.some(t=>/Cafeteria 8:25 AM\. Back in class by 9:05 AM\./.test(t)),
   'and a guide\'s still reads: "'+
   printed.filter(t=>/Cafeteria 8:25/.test(t))[0]+'"');
clearReadCache_();
ok(jobHours_()[norm_(JOBS.LOBBY)].from==='8:15 AM',
   'because the sheet itself was brought up to date on the way');
ok(lockerSlipData_(wed).filter(s=>greeters.indexOf(s.name)!==-1)
   .every(s=>s.comeAt==='8:15 AM'),'all three of them come at 8:15 AM');

console.log('\nthe same for their email');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:25 AM');
clearReadCache_();
global.__sent.length=0;
sendStudentEmails('2026-10-07');
const mailTo=who=>{
  const addr=String((ambassadors_().filter(a=>a.name===who)[0]||{}).email||'x').toLowerCase();
  const hit=global.__sent.filter(x=>String(x.to||'').toLowerCase().indexOf(addr)===0)[0];
  return String((hit||{}).htmlBody||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
};
ok(/come to the cafeteria at 8:15 AM/.test(mailTo(greeters[0])),
   'their email says 8:15 AM: "'+
   (mailTo(greeters[0]).match(/Please come[^.]*\./)||[''])[0]+'"');

console.log('\nand for the staffing command and the roster');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:25 AM');
clearReadCache_();
planTour('2026-10-07',true);
ok(jobHours_()[norm_(JOBS.LOBBY)].from==='8:15 AM','the command brings it up to date');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:25 AM');
clearReadCache_();
buildTourRoster('2026-10-07');
clearReadCache_();
ok(jobHours_()[norm_(JOBS.LOBBY)].from==='8:15 AM','and so does the roster');

console.log('\nan hour she has typed herself is still hers');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:10 AM');
clearReadCache_();
global.__doc=[];
buildLockerSlips('2026-10-07');
clearReadCache_();
ok(jobHours_()[norm_(JOBS.LOBBY)].from==='8:10 AM','8:10 AM is left alone');
ok(global.__doc.map(o=>String(o.t||''))
   .some(t=>/Cafeteria 8:10 AM/.test(t)),'and the slip says 8:10 AM');
jsh.getRange(rowOf(JOBS.LOBBY),fromCol).setValue('8:15 AM');
clearReadCache_();

console.log('\nand a sheet without those columns at all is not a crash');
{
  // What an older sheet looks like: no Out of Class columns on Jobs.
  const head=jsh.getRange(1,1,1,jsh.getLastColumn()).getValues()[0];
  jsh.getRange(1,fromCol).setValue('');
  jsh.getRange(1,toCol).setValue('');
  delete HEADER_CACHE_[J];
  clearReadCache_();
  ok(refreshJobHours_().length===0,'it says there was nothing to do');
  const slip=lockerSlipData_(wed).filter(s=>s.name===greeters[0])[0];
  ok(slip.comeAt==='8:15 AM',
     'and the hours come from the script instead: '+slip.comeAt);
  jsh.getRange(1,1,1,head.length).setValues([head]);
  delete HEADER_CACHE_[J];
  clearReadCache_();
}

console.log('\nthe hours reach the paper without being asked twice.');
