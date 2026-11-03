// Two visiting students on one pair of guides. Tour With on Prospective
// Students names the other one. They share the guides and the route and
// nothing else: each child keeps their own class visit, so one of them
// can still be sent to a different class at the end.
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
const put=rows=>rows.forEach((v,i)=>
  ['Tour Date','Name','School','Grade','Gender','Race','Borough','Tour With']
    .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1).setValue(v[k])));
// Sam names Kit; Lee goes round alone.
put([['2026-11-04','Sam Visitor','PS 41','6','Female','WP','M','Kit Visitor'],
     ['2026-11-04','Kit Visitor','PS 8','6','Male','SOC','B',''],
     ['2026-11-04','Lee Visitor','Grace','7','Male','WP','Q','']]);
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-11-04');
const pairOf=(p,n)=>p.pairs.filter(x=>x.visitor.name===n)[0];

console.log('the column is there to say it in');
ok(optionalCol_(P,'Tour With')!==-1,'Tour With is a column on Prospective Students');
ok(HEADERS[P].indexOf('Tour With')!==-1,'and one the script makes');

console.log('\none of them leads, and the other reads off their row');
let plan=planTour('2026-11-04',true);
ok(plan.pairs.length===3,'all three students have a row: '+
   plan.pairs.map(p=>p.visitor.name).join(', '));
let sam=pairOf(plan,'Sam Visitor'), kit=pairOf(plan,'Kit Visitor'),
    lee=pairOf(plan,'Lee Visitor');
ok(!sam.follows && sam.withVisitors.join()==='Kit Visitor',
   'Sam Visitor leads, with Kit Visitor');
ok(kit.follows==='Sam Visitor','Kit Visitor goes round with Sam Visitor');
ok(kit.short===0 && /going round with Sam Visitor/.test(kit.why),
   'and has no places of their own: "'+kit.why+'"');
ok(sam.short===2,'the two places are on Sam Visitor\'s row');
ok(!lee.follows,'Lee Visitor is on their own');

console.log('\nthe route is shared, and it is the only thing counted once');
ok(kit.route===sam.route,'both are on route '+kit.route);
ok(lee.route!==sam.route,'Lee Visitor has their own: route '+lee.route);
ok(!plan.warnings.some(w=>/Tour With/.test(w)),'and nothing to report about it');

console.log('\nthe guides she picks on the leading row walk both children');
const can=[];
plan.spare.filter(c=>c.jobs[JOBS.GUIDE]).forEach(c=>{
  if(can.length>=3) return;
  if(can.some(x=>keptApart_(x.name,c.name))) return;
  can.push(c);});
const two=[can[0].name,can[1].name];
const res=commitTour('2026-11-04',true,[],
  two.map(n=>({visitor:'Sam Visitor',to:n,add:true}))
    .concat([{visitor:'Lee Visitor',to:can[2].name,add:true}]),[]);
clearReadCache_();
const guidesFor=n=>rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE &&
  trim_(r[col_(T,'Prospective Student(s)')])===n)
  .map(r=>trim_(r[col_(T,'Ambassador')])).sort();
ok(guidesFor('Sam Visitor').join()===two.slice().sort().join(),
   'Sam Visitor has '+guidesFor('Sam Visitor').join(' and '));
ok(guidesFor('Kit Visitor').join()===two.slice().sort().join(),
   'Kit Visitor has the same two, written on their own rows');
ok(guidesFor('Lee Visitor').join()===can[2].name,
   'and Lee Visitor has '+guidesFor('Lee Visitor').join());
const routeOn=n=>trim_(rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE &&
  trim_(r[col_(T,'Prospective Student(s)')])===n)[0][col_(T,'Route')]);
ok(routeOn('Sam Visitor')===routeOn('Kit Visitor'),
   'one route on the tracker for both: '+routeOn('Kit Visitor'));

console.log('\neach child keeps their own class visit');
let land=handbackChoices_(wed).byVisitor;
ok(!!land[norm_('Sam Visitor')].where && !!land[norm_('Kit Visitor')].where,
   'both are walked into a class');
clearReadCache_();
const away=planTour('2026-11-04',true).pairs
  .filter(p=>p.visitor.name==='Kit Visitor')[0]
  .classOptions.filter(o=>!o.own&&!o.fifth)[0].name;
commitTour('2026-11-04',true,[],[],[{visitor:'Kit Visitor',to:away}]);
clearReadCache_();
land=handbackChoices_(wed).byVisitor;
ok(land[norm_('Kit Visitor')].takers.join()===away,
   'Kit Visitor goes to '+away+'\'s class');
ok(two.indexOf(land[norm_('Sam Visitor')].takers[0])!==-1,
   'and Sam Visitor still goes with their own guide, '+
   land[norm_('Sam Visitor')].takers.join(' and '));
ok(land[norm_('Sam Visitor')].where.label!==land[norm_('Kit Visitor')].where.label,
   'two children, two classes: '+land[norm_('Sam Visitor')].where.label+' and '+
   land[norm_('Kit Visitor')].where.label);

console.log('\none route sheet per guide, with both children on it');
global.__doc=[];
buildRouteSheets('2026-11-04');
const pages=[]; let now=null;
global.__doc.forEach(o=>{ const t=String(o.t||'');
  if(t==='--- PAGE BREAK ---'){ now=null; return; }
  if(!now){ now={who:t,lines:[]}; pages.push(now); return; }
  now.lines.push(t); });
ok(pages.length===3,pages.length+' sheets: '+pages.map(p=>p.who).join(', '));
const mine=pages.filter(p=>p.who===two[0].toUpperCase())[0];
ok(!!mine,two[0]+' has one sheet, not two');
const taking=mine.lines.filter(l=>/^You are taking: /.test(l))[0];
ok(/Sam Visitor/.test(taking)&&/Kit Visitor/.test(taking),
   'naming both: "'+taking+'"');
ok(mine.lines.some(l=>/go round together, on this one route/.test(l)),
   'and saying they are together');
ok(mine.lines.filter(l=>/^8:30 Leave cafeteria/.test(l)).length===1,
   'the walk is printed once');
ok(mine.lines.filter(l=>/Stop at your locker/.test(l)).length===1,
   'and so is the locker line, which is the guide\'s own');
ok(mine.lines.some(l=>/Take Sam Visitor to /.test(l)),'Sam Visitor\'s 9:06 is on it');
ok(mine.lines.some(l=>new RegExp(away+'|Kit Visitor').test(l)),
   'and Kit Visitor\'s, which is a different one');

console.log('\nthe guide is told about both on their slip and in their email');
const slip=lockerSlipData_(wed).filter(s=>s.name===two[0])[0];
ok(slip.jobs.length===2,'their slip says: '+slip.jobs.join(' / '));
global.__sent.length=0;
sendStudentEmails('2026-11-04');
const addr=String((ambassadors_().filter(a=>a.name===two[0])[0]||{}).email||'x').toLowerCase();
const mail=String((global.__sent.filter(x=>String(x.to||'').toLowerCase()
  .indexOf(addr)===0)[0]||{}).htmlBody||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
ok(/Tour Guide for Sam Visitor/.test(mail)&&/Tour Guide for Kit Visitor/.test(mail),
   'and their email names both children');

console.log('\nand the counts are not doubled by the sharing');
clearReadCache_();
plan=planTour('2026-11-04',true);
ok(plan.assignedCount===new Set(plan.pairs.reduce((a,p)=>
   a.concat(p.follows?[]:p.guideNames),[]).concat(
   plan.greeters.reduce((a,c)=>a.concat(c.chosen),[]))).size,
   plan.assignedCount+' ambassadors assigned, each counted once');

console.log('\na name that matches nobody is said out loud');
m.sheets[P].getRange(4,col_(P,'Tour With')+1).setValue('Nobody At All');
clearReadCache_();
plan=planTour('2026-11-04',true);
ok(plan.warnings.some(w=>/"Nobody At All" is in Tour With for Lee Visitor/.test(w)),
   'it reads: "'+plan.warnings.filter(w=>/Nobody At All/.test(w))[0]+'"');
ok(!pairOf(plan,'Lee Visitor').follows,'and Lee Visitor goes round on their own');

console.log('\nnaming each other on both rows is the same as naming it once');
m.sheets[P].getRange(4,col_(P,'Tour With')+1).setValue('');
m.sheets[P].getRange(3,col_(P,'Tour With')+1).setValue('Sam Visitor');
clearReadCache_();
plan=planTour('2026-11-04',true);
ok(pairOf(plan,'Kit Visitor').follows==='Sam Visitor',
   'still Kit Visitor with Sam Visitor, who is higher up the sheet');
ok(!plan.warnings.some(w=>/Tour With/.test(w)),'and still nothing to report');

console.log('\nand naming it the other way round reads the same');
m.sheets[P].getRange(2,col_(P,'Tour With')+1).setValue('');
clearReadCache_();
plan=planTour('2026-11-04',true);
ok(pairOf(plan,'Kit Visitor').follows==='Sam Visitor',
   'Kit Visitor names Sam Visitor, and Sam Visitor still leads');

console.log('\ntwo children, one pair of guides, one route.');
