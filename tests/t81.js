// A guide who takes their visitor into their own class at 9:06 walks
// straight from the tour into a period, with their bag, their books and
// their coat still in the cafeteria where they left them at 8:25. The
// route sheet says so first, in the same large type as the rest of it.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,S=SHEETS.SETTINGS,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(r[0]+' '+r[1]).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');

// Her two picks, in two different rooms, so one of them takes the family.
const two=['Blake Glenn','Camille Bedeau'];
commitTour('2026-10-07',true,[],
  two.map(n=>({visitor:'Sam Visitor',to:n,add:true})),[]);
clearReadCache_();

// Every page, as the guide holding it reads it: the lines in order, with
// the large ones marked, so the sheet is read rather than searched.
const pagesOf=()=>{ global.__doc=[]; buildRouteSheets('2026-10-07');
  const out=[]; let now=null;
  global.__doc.forEach(o=>{ const t=String(o.t||'');
    if(t==='--- PAGE BREAK ---'){ now=null; return; }
    if(!now){ now={who:t,lines:[]}; out.push(now); return; }
    now.lines.push({t:t,big:!!o.size}); });
  return out; };
const lineOf=(pg,re)=>pg.lines.filter(l=>re.test(l.t))[0];
const things=/get your things/;

console.log('the guide who takes the family into class');
let pages=pagesOf();
const takes=handbackChoices_(wed).byVisitor[norm_('Sam Visitor')].takers[0];
const back=two.filter(n=>n!==takes)[0];
ok(pages.length===2,'a page each: '+pages.map(p=>p.who).join(' and '));
let mine=pages.filter(p=>p.who===takes.toUpperCase())[0];
ok(!!mine,takes+' has a page');
const line=lineOf(mine,things);
ok(!!line,'and is told about their things: "'+(line||{}).t+'"');
ok(line.t.indexOf('Bring your visitor back to the cafeteria to get your things, ' +
  'then go to class.')!==-1,'in her words, after the time');
ok(line.big===true,'in the large text, like the rest of the end of the sheet');
const at=mine.lines.indexOf(line);
const next=mine.lines[at+1];
ok(!!next&&/Take Sam Visitor to .* with you/.test(next.t),
   'and the class visit comes straight after it: "'+next.t.slice(0,60)+'"');
ok(next.big===true,'also large');
ok(mine.lines.slice(0,at).every(l=>!things.test(l.t)),
   'it is said once, not on every line of the walk');

console.log('\nthe other guide, who goes back to their own class');
let other=pages.filter(p=>p.who===back.toUpperCase())[0];
ok(!!other,back+' has a page');
ok(!lineOf(other,things),'and is not told to fetch anything: they never left class');
ok(/Go back to your own class/.test(lineOf(other,/takes Sam Visitor/).t),
   'their line is the one they had: "'+lineOf(other,/takes Sam Visitor/).t.slice(0,70)+'"');

console.log('\nwhere the family is handed to somebody else');
const away=planTour('2026-10-07',true).pairs[0].classOptions.filter(o=>!o.own)[0].name;
commitTour('2026-10-07',true,[],[],[{visitor:'Sam Visitor',to:away}]);
clearReadCache_();
pages=pagesOf();
ok(pages.every(p=>!lineOf(p,things)),
   'neither guide is told to fetch their things: both go back to class as they are');
ok(pages.some(p=>p.lines.some(l=>new RegExp('FOR '+away.toUpperCase()).test(l.t))),
   'and '+away+' gets their own block');
ok(pages.every(p=>p.lines.every(l=>!(new RegExp('FOR '+away.toUpperCase()).test(l.t)&&
   things.test(l.t)))),'which says nothing about the cafeteria either');

console.log('\nwhere the two of them share a class, both are told');
const put=(name,pod,split)=>rows_(A).forEach((r,i)=>{
  if((trim_(r[0])+' '+trim_(r[1]))!==name) return;
  sh.getRange(i+2,col_(A,'Homeroom')+1).setValue(pod);
  sh.getRange(i+2,col_(A,'Split')+1).setValue(split);
  sh.getRange(i+2,col_(A,'Grade')+1).setValue('6th'); });
put(two[0],'CCM','6A'); put(two[1],'CCM','6A');
// and the hand-off is called off, so the family is theirs again
commitTour('2026-10-07',true,[],[],[{visitor:'Sam Visitor',to:'',clear:true}]);
clearReadCache_();
const c=handbackChoices_(wed).byVisitor[norm_('Sam Visitor')];
ok(c.takers.length===2,'both of them take the family: '+c.takers.join(' and '));
pages=pagesOf();
ok(pages.every(p=>!!lineOf(p,things)),'both pages say to fetch their things');
ok(pages.every(p=>/You and .* take Sam Visitor/
   .test((p.lines[p.lines.indexOf(lineOf(p,things))+1]||{}).t||'')),
   'each followed by the two of them taking the family in together');

console.log('\nand the place is whatever Settings says');
const at2=rows_(S).findIndex(r=>norm_(r[0])===norm_('Ambassadors Report To'))+2;
m.sheets[S].getRange(at2,2).setValue('the co-lab');
clearReadCache_();
pages=pagesOf();
ok(pages.every(p=>/back to the co-lab to get your things/.test(lineOf(p,things).t)),
   'it reads: "'+lineOf(pages[0],things).t+'"');

console.log('\ntheir things come with them.');
