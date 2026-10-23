// The class visits, at the bottom of the Tour Roster. The roster above is
// per ambassador, so the 9:06 handover is only on it a student at a time,
// scattered down the Role column. This is by family: who takes them,
// which class, whose room, and a family nobody is picked for yet saying
// so. All three shapes are in the one list.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,B=SHEETS.BUDDIES,T=SHEETS.TRACKER,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
rows_(B).slice(0,2).forEach((r,i)=>{
  m.sheets[B].getRange(i+2,col_(B,'Can Host a Visitor')+1).setValue('Yes');
  m.sheets[B].getRange(i+2,col_(B,'Room')+1).setValue('M20'+(i+1));
  m.sheets[B].getRange(i+2,col_(B,'Teacher')+1).setValue(['Dolores','Maya'][i]);});
// Four families: one with its own guides, one handed on, one a 5th
// grader is hosting, and one she has not staffed at all.
[['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M',''],
 ['2026-10-07','Lee Visitor','Grace','7','Male','WP','Q',''],
 ['2026-10-07','Kit Visitor','PS 3','5','Female','SOC','B','5th grade Spanish'],
 ['2026-10-07','Nia Visitor','PS 8','6','Female','SOC','B','']]
  .forEach((v,i)=>['Tour Date','Name','School','Grade','Gender','Race','Borough','Class Visit']
    .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1).setValue(v[k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const can=planTour('2026-10-07',true).spare.filter(c=>c.jobs[JOBS.GUIDE]);
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:can[0].name,add:true},
   {visitor:'Sam Visitor',to:can[1].name,add:true},
   {visitor:'Lee Visitor',to:can[2].name,add:true}],[]);
clearReadCache_();
const away=planTour('2026-10-07',true).pairs.filter(p=>p.visitor.name==='Lee Visitor')[0]
  .classOptions.filter(o=>!o.own&&!o.fifth)[0].name;
commitTour('2026-10-07',true,[],[],[{visitor:'Lee Visitor',to:away}]);
clearReadCache_();

// The printout, read the way the page is laid out.
const printed=()=>{ global.__doc=[]; const r=buildTourRoster('2026-10-07');
  const out={ r:r, head:[], tables:[] };
  let cells=[];
  global.__doc.forEach(o=>{ const t=String(o.t||'');
    if(o.cell){ cells.push(t); return; }
    if(cells.length){ out.tables.push(cells); cells=[]; }
    out.head.push({t:t,h:o.h||''}); });
  if(cells.length) out.tables.push(cells);
  return out; };
const page=printed();
const wide=page.tables[1];
const rowsOf=(flat,n)=>{ const out=[];
  for(let i=0;i<flat.length;i+=n) out.push(flat.slice(i,i+n)); return out; };
const visits=rowsOf(wide,4);

console.log('a section of its own, under the roster');
ok(page.tables.length===2,'two tables on the page: the roster and this one');
ok(page.head.some(x=>x.h==='H3'&&/^Class visits at /.test(x.t)),
   'with its own heading: "'+page.head.filter(x=>x.h==='H3')[0].t+'"');
ok(page.head.some(x=>/visiting families are settled/.test(x.t)),
   'and a line saying how it stands: "'+
   page.head.filter(x=>/settled/.test(x.t))[0].t+'"');
ok(visits[0].join(' | ')==='Visiting student | Goes with | Class | Teacher',
   'the headings read: '+visits[0].join(' | '));
ok(visits.length===5,'four families under them');
ok(page.r.visits===4,'and the answer says so: '+page.r.visits);

console.log('\nevery family, by family');
const find=n=>visits.filter(r=>r[0]===n)[0];
ok(!!find('Sam Visitor')&&!!find('Lee Visitor')&&!!find('Kit Visitor')&&!!find('Nia Visitor'),
   'all four are on it, in the order they are on Prospective Students');

console.log('\nthe one walking in with their own guide');
const sam=find('Sam Visitor');
const samTakes=handbackChoices_(toDate_('2026-10-07'))
  .byVisitor[norm_('Sam Visitor')];
ok(sam[1]===samTakes.takers.join(' and '),sam[1]+' takes them');
ok(!/pass off/.test(sam[1]),'with nothing about a pass off, because there is none');
ok(sam[2]===samTakes.where.label,'into '+sam[2]);
ok(sam[3]===samTakes.where.teacher,'whose teacher is '+(sam[3]||'(nobody named)'));

console.log('\nthe one handed to somebody else');
const lee=find('Lee Visitor');
ok(lee[1]===away+' (pass off)','it says '+lee[1]);
ok(!!lee[2]&&lee[2]!=='-','into '+lee[2]);

console.log('\nthe one a 5th grader is hosting');
const kit=find('Kit Visitor');
ok(kit[1].indexOf('(5th grade)')!==-1,'marked as the 5th grade class visit: '+kit[1]);
ok(/in M20/.test(kit[2]),'with the room on it: '+kit[2]);
ok(!!kit[3],'and the teacher whose class it is: '+kit[3]);

console.log('\nand the one she has not staffed yet');
const nia=find('Nia Visitor');
ok(nia[1]==='nobody yet','it says "'+nia[1]+'"');
ok(nia[2]==='-','with nothing to say about the class');

console.log('\nthe roster above is untouched');
const roster=rowsOf(page.tables[0],5);
ok(roster[0].join(' | ')==='Student | Name tag | Role | Class teacher | Advisor',
   'still: '+roster[0].join(' | '));
ok(roster.length-1===page.r.rows,page.r.rows+' ambassadors on it');

console.log('\nevery family, the right way up.');
