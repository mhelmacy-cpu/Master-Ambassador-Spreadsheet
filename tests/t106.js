// A Monday tour. The whole middle school is in its meeting while the
// guides walk, so there is no class to look into and none to take the
// family to at the end. The route walks the same places in the same
// order, from the same cafeteria, showing the rooms rather than the
// lessons in them; and at 9:06 the visitors go to the meeting, in lieu
// of a class visit, with their own guides.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,R=SHEETS.ROUTES,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
rows_(SHEETS.TEACHERS).forEach((r,i)=>m.sheets[SHEETS.TEACHERS]
  .getRange(i+2,col_(SHEETS.TEACHERS,'Teacher Email')+1).setValue('x@lrei.org'));
const MON='2026-11-23', WED='2026-11-25';
ok(WEEKDAYS_[toDate_(MON).getDay()]==='Monday',MON+' is a Monday');
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue([MON,'Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const mon=toDate_(MON);
const walkFrom=toMinutes_(setting_('Tour Start Time','8:30'));
const hand=toMinutes_(setting_('Class Visit Handoff Time','9:06'));
const endAt=toMinutes_(setting_('Tour End Time','9:25'));

console.log('the whole school in one place');
ok(wholeSchoolAt_(mon,walkFrom,hand)==='MS Meeting',
   'while the tour walks on a Monday: "'+wholeSchoolAt_(mon,walkFrom,hand)+'"');
ok(wholeSchoolAt_(mon,hand,endAt)==='MS Meeting','and at 9:06, when the walk is over');
ok(wholeSchoolAt_(toDate_(WED),hand,endAt)==='',
   'and on a Wednesday, nothing: they are all in their own classes');

console.log('\nthe route walks the same kind of morning');
const mine=routesForDate_(mon);
clearReadCache_();
ok(mine.numbers.length===7,'seven routes for Monday, like every other day');
const all=mine.numbers.map(n=>mine.byNumber[n].itinerary);
ok(all.every(t=>/^8:30 Leave cafeteria to start tour$/m.test(t)),
   'every one of them leaves from the cafeteria at 8:30, as they always have');
ok(mine.numbers.map(n=>mine.byNumber[n].direction).join(',')===
   'Bottom-Up,Top-Down,Bottom-Up,Top-Down,Bottom-Up,Top-Down,Bottom-Up',
   'and they alternate bottom up and top down');
[['Library',/Library/],['the board by the front desk',/Sports Bulletin Board/],
 ['the Learning Center',/Learning Center/],['a Humanities room',/Humanities room \(M10[78]\)/],
 ['a World Language room',/World Language room \(M20[789]\)/],
 ['the Art room',/Art room \(M306\)/],['the science lab',/Main Science Lab \(M307\)/],
 ['the Math room',/Math room \(M308\)/],['the Science room',/Science room \(M310\)/]]
  .forEach(([what,re])=>ok(all.every(t=>re.test(t)),'every route shows '+what));
ok(all.every(t=>!/\dth Grade/.test(t)),
   'and none of them names a class, because none is sitting');
const floorsOf=txt=>txt.split('\n').map(l=>{
  const r=/\bM(\d)\d\d\b/.exec(l);
  if(r) return Number(r[1]);
  if(/Library|Sports Bulletin Board/.test(l)) return 0;
  return null; }).filter(f=>f!==null);
const up=floorsOf(mine.byNumber['1'].itinerary), down=floorsOf(mine.byNumber['2'].itinerary);
ok(up.every((f,i)=>i===0||f>=up[i-1]),'route 1 only goes up: '+up.join(' '));
ok(down.every((f,i)=>i===0||f<=down[i-1]),'route 2 only comes down: '+down.join(' '));
ok(/^9:06 Bring visitors to MS Meeting/m.test(all[0]),
   'and the walk ends by taking them to the meeting: "'+
   (all[0].match(/^9:06.*$/m)||[])[0]+'"');
ok(all.every(t=>/^9:25 Bring visitor down to the co-lab/m.test(t)),
   'with the morning still ending in the co-lab at 9:25');

console.log('\nstaffing it is staffing any other day');
commitTour(MON,true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true},
   {visitor:'Sam Visitor',to:'Camille Bedeau',add:true}],[]);
clearReadCache_();
ok(rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE).length===2,
   'two guides on the tracker');
const landed=handbackChoices_(mon).byVisitor[norm_('Sam Visitor')];
ok(landed.where&&landed.where.label==='MS Meeting',
   'the family lands at "'+landed.where.label+'"');
ok(landed.where.meeting===true,'marked as the meeting rather than a class');
ok(landed.takers.length===2,'both guides take them: '+landed.takers.join(' and '));
ok((landed.options||[]).length===0,
   'and there is nobody to hand them to instead, because everybody is there');
ok(landed.over===false&&landed.count===0,
   'nobody is ever too many for the meeting');

console.log('\nwhat the guides are handed');
global.__doc=[];
buildRouteSheets(MON);
const said=global.__doc.map(o=>String(o.t||''));
ok(said.some(t=>/take Sam Visitor to MS Meeting with you/.test(t)),
   'the sheet says: "'+said.filter(t=>/MS Meeting with you/.test(t))[0]+'"');
ok(said.every(t=>!/Stop at your locker/.test(t)),
   'and does not send them to their locker: no lesson is waiting for them');
ok(said.every(t=>!/^9:06 Bring visitors/.test(t)),
   'the walk\'s own last lines are off the sheet, as they always are');
ok(said.some(t=>/at 9:25 AM take them to the co-lab/i.test(t)),
   'and the end of the morning is unchanged');

console.log('\nand what is written down');
ok(/MS Meeting/.test(trim_(readCell_(P,2,'Class Visit To'))),
   'Class Visit To reads "'+trim_(readCell_(P,2,'Class Visit To'))+'"');
const visits=classVisitRows_(mon);
ok(visits.length===1&&visits[0].where==='MS Meeting',
   'the roster puts them in "'+visits[0].where+'"');
ok(!visits[0].teacher,'with no teacher to name, and none emailed');
global.__sent.length=0;
sendTeacherEmails(MON);
const mail=global.__sent.map(x=>String(x.htmlBody||'').replace(/<[^>]*>/g,' '));
ok(global.__sent.length>0,global.__sent.length+' teacher email(s)');
ok(mail.some(t=>/advisee/i.test(t)),'their advisor hears, as always');
ok(mail.every(t=>!/visiting student will be coming into your class/i.test(t)),
   'and no teacher is told a visitor is coming into their class');

console.log('\na Wednesday tour is untouched by any of it');
{
  ['Tour Date','Name','School','Grade','Gender','Race','Borough']
    .forEach((h,k)=>m.sheets[P].getRange(3,col_(P,h)+1)
      .setValue([WED,'Robin Visitor','PS 41','6','Female','WP','M'][k]));
  Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
  clearReadCache_();
  commitTour(WED,true,[],
    [{visitor:'Robin Visitor',to:'Aurelia Walker',add:true},
     {visitor:'Robin Visitor',to:'Avery Griffiths',add:true}],[]);
  clearReadCache_();
  const c=handbackChoices_(toDate_(WED)).byVisitor[norm_('Robin Visitor')];
  ok(!!c.where&&!c.where.meeting,'they go to a real class: '+c.where.label);
  ok((c.options||[]).length>0,
     'with '+c.options.length+' other people she could hand them to');
  const wed=routesForDay_('Wednesday');
  ok(wed.numbers.every(n=>/\dth Grade/.test(wed.byNumber[n].itinerary)),
     'and Wednesday\'s routes still name the classes they walk past');
}

console.log('\nthe Monday morning they are all together is a morning she can tour.');
