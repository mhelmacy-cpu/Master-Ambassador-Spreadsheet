// One student can do more than one job, and taking a second never takes
// the first away. Blake Glenn guides a family, stands on the door, and
// is handed a family at the end of it: three jobs, three rows on the
// tracker, one email that lists all three. The only thing that cannot
// stack is the same job twice at the same moment, which is a guide on
// two families, and that still says what to do instead.
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
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');
const ME='Blake Glenn';
const jobsOf=n=>rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])===n)
  .map(r=>trim_(r[col_(T,'Job')])).sort();

console.log('a tour guide, who is also on the door');
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:ME,add:true},
   {visitor:'Sam Visitor',to:'Camille Bedeau',add:true}],[]);
clearReadCache_();
ok(jobsOf(ME).join(', ')===JOBS.GUIDE,ME+' is a '+jobsOf(ME).join(', '));
let res=commitTour('2026-10-07',true,[],[{job:JOBS.LOBBY,to:ME,add:true}],[]);
clearReadCache_();
ok(jobsOf(ME).join(' and ')===[JOBS.GUIDE,JOBS.LOBBY].sort().join(' and '),
   'and now they are '+jobsOf(ME).join(' and '));
ok(rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE&&
   trim_(r[col_(T,'Prospective Student(s)')])==='Sam Visitor').length===2,
   'Sam Visitor still has both guides: nobody was taken off the family');
ok((res.swapped||[]).some(w=>(w.problems||[])
   .some(t=>/is also guiding Sam Visitor/.test(t))),
   'and the answer says what else they are doing: "'+(res.swapped||[])
   .map(w=>(w.problems||[]).join(' ')).filter(Boolean)[0]+'"');
ok((res.swapped||[]).every(w=>(w.problems||[])
   .every(t=>!/comes off/.test(t))),'nothing came off anything');

console.log('\nand the other way round: the door first, then a family');
{
  const other='Aksel Ozturk';
  commitTour('2026-10-07',true,[],[{job:JOBS.TABLE,to:other,add:true}],[]);
  clearReadCache_();
  ok(jobsOf(other).join(', ')===JOBS.TABLE,other+' is on the table crew');
  // Her own pick on the family's second place, which is free again only
  // if she clears one, so this one goes on the other crew as well.
  const r=commitTour('2026-10-07',true,[],[{job:JOBS.LOBBY,to:other,add:true}],[]);
  clearReadCache_();
  ok(jobsOf(other).join(' and ')===[JOBS.LOBBY,JOBS.TABLE].sort().join(' and '),
     'and is now on both crews: '+jobsOf(other).join(' and '));
  ok((r.swapped||[]).some(w=>(w.problems||[])
     .some(t=>new RegExp('also on the '+JOBS.TABLE+' crew').test(t))),
     'with the other crew named in the answer');
}

console.log('\nthe panel too, and the panel keeps the guiding');
{
  const panel=api_handChoices('2026-10-07',JOBS.PANELIST).rows;
  ok(panel.some(r=>r.name===ME),
     ME+' is offered for the panel although they already have two jobs');
  ok(panel.filter(r=>r.name===ME)[0].busy.indexOf(JOBS.GUIDE)!==-1,
     'with what they have beside the name: "'+panel.filter(r=>r.name===ME)[0].busy+'"');
  const out=api_saveByHand('2026-10-07',JOBS.PANELIST,[ME]);
  clearReadCache_();
  ok(jobsOf(ME).indexOf(JOBS.PANELIST)!==-1,ME+' is '+jobsOf(ME).join(', '));
  ok(jobsOf(ME).indexOf(JOBS.GUIDE)!==-1,'and still guiding');
  ok((out.clashes||[]).some(t=>/stays on it/.test(t)),
     'and it says so: "'+(out.clashes||[])[0]+'"');
}

console.log('\nevery job is offered to somebody who already has one');
{
  [JOBS.LOBBY,JOBS.TABLE,JOBS.GUIDE].forEach(j=>{
    const rows=api_handChoices('2026-10-07',j).rows;
    ok(rows.some(r=>r.name===ME),ME+' is on the list for '+j);
  });
  const rows=api_handChoices('2026-10-07',JOBS.LOBBY).rows;
  const free=rows.filter(r=>!r.busy).length;
  ok(rows[0].busy==='','whoever is free is still offered first');
  ok(free<rows.length,'and the busy ones come after them, '+free+' free of '+rows.length);
}

console.log('\nand being handed a family at the end is a third job');
/* A second family, with her own guide on it, so there is somebody to
 * hand to and somebody to hand. */
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(3,col_(P,h)+1)
    .setValue(['2026-10-07','Robin Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour('2026-10-07',true,[],
  [{visitor:'Robin Visitor',to:'Aurelia Walker',add:true}],[]);
clearReadCache_();
{
  const pair=planTour('2026-10-07',true).pairs
    .filter(p=>p.visitor.name==='Robin Visitor')[0];
  const mine=(pair.classOptions||[]).filter(o=>o.name===ME)[0];
  ok(!!mine,ME+' is on the hand-off list for Robin Visitor, with two jobs already');
  ok(String(mine.job||'').indexOf(JOBS.GUIDE)!==-1||
     String(mine.job||'').indexOf(JOBS.LOBBY)!==-1,
     'and the list says what they are down for: "'+(mine.job||'nothing')+'"');
  commitTour('2026-10-07',true,[],[],[{visitor:'Robin Visitor',to:ME}]);
  clearReadCache_();
  const jobs=jobsOf(ME);
  ok(jobs.indexOf(JOBS.GUIDE)!==-1&&jobs.indexOf(JOBS.LOBBY)!==-1&&
     jobs.indexOf(JOBS.PASSOFF)!==-1,
     ME+' is down for all three: '+jobs.join(', '));
  ok(rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])===ME).length===
     jobs.length,'one row each on the tracker, '+jobs.length+' of them');
}

console.log('\nand all three reach the paper');
{
  const slip=lockerSlipData_(wed).filter(s=>s.name===ME)[0];
  ok(!!slip&&slip.jobs.length>=2,'their slip lists '+slip.jobs.join(' and '));
  ok(slip.comeAt==='8:15 AM',
     'and says 8:15 AM, the earliest of their jobs: '+slip.comeAt);
  ok((slip.passOff||[]).length>0,
     'with the family they are handed on it as well: "'+
     String((slip.passOff||[])[0]||'').slice(0,60)+'"');
  global.__sent.length=0;
  sendStudentEmails('2026-10-07');
  const addr=String((ambassadors_().filter(a=>a.name===ME)[0]||{}).email||'x')
    .toLowerCase();
  const mail=String((global.__sent.filter(x=>String(x.to||'').toLowerCase()
    .indexOf(addr)===0)[0]||{}).htmlBody||'')
    .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  ok(new RegExp(JOBS.GUIDE).test(mail)&&new RegExp(JOBS.LOBBY).test(mail),
     'their email names both jobs');
  ok(/Robin Visitor/.test(mail),'and the family they are handed at the end');
  ok(/come to the cafeteria at 8:15 AM/.test(mail),'and 8:15 AM with the crew');
}

console.log('\nwhat still cannot be done, and what it says instead');
{
  // The same job twice at the same moment. A guide cannot walk two
  // families at once: that is what "goes round" is for.
  let said='';
  try {
    commitTour('2026-10-07',true,[],
      [{visitor:'Sam Visitor',to:'Aurelia Walker',add:true}],[]);
  } catch (e) { said=String(e.message||e); }
  ok(/two families at the same time/.test(said),
     'it is refused, and says why: "'+said.slice(0,80)+'..."');
  ok(/goes round/.test(said),'and what to do instead');
  ok(rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])==='Aurelia Walker'&&
     trim_(r[col_(T,'Job')])===JOBS.GUIDE).length===1,
     'and Aurelia Walker still walks the one family');
  // The same name in both of one family's places is still refused too.
  const dup=commitTour('2026-10-07',true,[],
    [{visitor:'Sam Visitor',to:'Camille Bedeau',add:true}],[]);
  clearReadCache_();
  ok((dup.ignored||[]).some(x=>/already walking that family/.test(x)),
     'the same guide twice on one family is skipped: "'+
     (dup.ignored||[]).filter(x=>/already walking/.test(x))[0]+'"');
  ok(rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])==='Camille Bedeau'&&
     trim_(r[col_(T,'Job')])===JOBS.GUIDE).length===1,
     'and they are on that family once');
}

console.log('\nthe one move left is from one family to another, and only that');
{
  /* Sam Visitor has two guides, so one of them can be moved onto the
   * other family: that is what the dropdowns are for. What moves is the
   * guiding and nothing else. The crew place, the panel and the hand-off
   * all stay. */
  const before=jobsOf(ME);
  const r=commitTour('2026-10-07',true,[ME],
    [{visitor:'Robin Visitor',to:ME,add:true}],[]);
  clearReadCache_();
  const guidesOf=v=>rows_(T).filter(x=>trim_(x[col_(T,'Job')])===JOBS.GUIDE&&
    trim_(x[col_(T,'Prospective Student(s)')])===v)
    .map(x=>trim_(x[col_(T,'Ambassador')])).sort();
  ok((r.swapped||[]).some(w=>(w.problems||[])
     .some(t=>/comes off Sam Visitor/.test(t)&&/two families at once/.test(t))),
     'it says what it did: "'+(r.swapped||[]).map(w=>(w.problems||[])
     .filter(t=>/comes off/.test(t)).join(' ')).filter(Boolean)[0]+'"');
  ok(guidesOf('Sam Visitor').join(', ')==='Camille Bedeau',
     'Sam Visitor is down to '+guidesOf('Sam Visitor').join(', '));
  ok(guidesOf('Robin Visitor').indexOf(ME)!==-1,
     'and Robin Visitor has '+guidesOf('Robin Visitor').join(' and '));
  ok(jobsOf(ME).indexOf(JOBS.LOBBY)!==-1&&jobsOf(ME).indexOf(JOBS.PANELIST)!==-1,
     ME+' keeps everything else: '+jobsOf(ME).join(', '));
  ok(before.indexOf(JOBS.LOBBY)!==-1&&jobsOf(ME).indexOf(JOBS.LOBBY)!==-1,
     'the door place was never in question');
  /* The hand-off is the one thing that goes, and only because it was
   * Robin Visitor: being handed the family you are guiding is not a
   * hand-off at all, it is your own family. */
  ok(jobsOf(ME).indexOf(JOBS.PASSOFF)===-1,
     'and Robin Visitor is theirs to walk now, not theirs to be handed');
}

console.log('\nnobody is taken off a job to be given another.');
