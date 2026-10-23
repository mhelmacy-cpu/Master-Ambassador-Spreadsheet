// The name tags are counted out by hand the afternoon before, and the
// roster is the one sheet that already lists everybody on duty, one line
// each and in alphabetical order. So it carries a box to tick against
// each name. Somebody who is only handed a family at the end gets no box:
// the guide gives them their own tag at the door.
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
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');

/* The crews are hers to pick now, the same as the guides, so the fixture
 * picks them: a guide and three on the door, which is what makes the
 * roster long enough to be worth a column of tick boxes. */
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true},
   {job:JOBS.LOBBY,to:'Aurelia Walker',add:true},
   {job:JOBS.LOBBY,to:'Aksel Ozturk',add:true},
   {job:JOBS.TABLE,to:'Avery Griffiths',add:true}],[]);
clearReadCache_();

// The roster, read the way the page is laid out: a row of cells each.
/* The page has two tables: the roster, then the class visits under it.
 * Only the first is this test's business. */
const tableOf=()=>{ global.__doc=[]; buildTourRoster('2026-10-07');
  const head=global.__doc.filter(o=>!o.cell).map(o=>String(o.t||''));
  const tables=[]; let cells=[];
  global.__doc.forEach(o=>{ if(o.cell){ cells.push(String(o.t||'')); return; }
    if(cells.length){ tables.push(cells); cells=[]; } });
  if(cells.length) tables.push(cells);
  const flat=tables[0]||[];
  const rows=[]; for(let i=0;i<flat.length;i+=5) rows.push(flat.slice(i,i+5));
  return {head:head,rows:rows,tables:tables}; };

console.log('the roster has a column for them');
let t=tableOf();
ok(t.rows[0].join(' | ')==='Student | Name tag | Role | Class teacher | Advisor',
   'the headings read: '+t.rows[0].join(' | '));
const body=t.rows.slice(1);
ok(body.length>1,body.length+' ambassadors on it');
ok(body.every(r=>r[1]==='[    ]'),'every one of them has an empty box to tick');
ok(body.every(r=>!!r[0]),'beside their name');
ok(/name tags to count out/.test(t.head.join(' ')),
   'and the top says how many: "'+t.head[1]+'"');
ok(t.head.join(' ').indexOf(body.length+' name tags')!==-1,
   'which is the number of boxes, '+body.length);

console.log('\nthe column is narrow, since it holds a tick and nothing else');
// The roster is the first table on the page; the class visits under it
// set no widths of their own.
ok(((global.__docTables[0]||{}).widths||[])[1]>0,
   'its width is set: '+((global.__docTables[0]||{}).widths||[])[1]);

console.log('\nsomebody only handed a family at the end has no box');
const away=planTour('2026-10-07',true).pairs[0].classOptions
  .filter(o=>!o.own&&!o.job)[0].name;
commitTour('2026-10-07',true,[],[],[{visitor:'Sam Visitor',to:away}]);
clearReadCache_();
t=tableOf();
const theirs=t.rows.filter(r=>r[0]===away)[0];
ok(!!theirs,away+' is on the roster: '+theirs.join(' | '));
ok(theirs[2].indexOf(JOBS.PASSOFF)===0,'as a '+JOBS.PASSOFF);
ok(theirs[1]==='','with no box, because they get their guide\'s tag at the door');
const rest=t.rows.slice(1).filter(r=>r[0]!==away);
ok(rest.every(r=>r[1]==='[    ]'),'everybody else still has one');
ok(t.head.join(' ').indexOf(rest.length+' name tags')!==-1,
   'and the count leaves them out: "'+t.head[1]+'"');

console.log('\nand the data behind it says the same');
const data=tourRoster_(wed);
ok(data.filter(r=>r.name===away)[0].needsTag===false,away+' needs no tag');
ok(data.filter(r=>r.name!==away).every(r=>r.needsTag===true),'everybody else does');

console.log('\ntick them off as you count them.');
