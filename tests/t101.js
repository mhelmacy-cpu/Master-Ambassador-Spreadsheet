// The roster is read in the order the morning happens in, not down the
// alphabet: the tours first, each pair of guides under the family they
// are walking, then the panel and the crews. Somebody who is guiding and
// greeting is in the tours, once, with both jobs beside their name,
// because that is where she looks for them while she counts tags out.
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
const WED='2026-10-07';
[['Sam Visitor'],['Robin Visitor'],['Kit Visitor']].forEach((v,i)=>
  ['Tour Date','Name','School','Grade','Gender','Race','Borough']
    .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1)
      .setValue([WED,v[0],'PS 41','6','Female','WP','M'][k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();

// Her panel, then three families with two guides each, and one of those
// guides on the table crew as well.
const panel=api_handChoices(WED,JOBS.PANELIST).rows.slice(0,3).map(r=>r.name);
api_saveByHand(WED,JOBS.PANELIST,panel);
clearReadCache_();
const free=planTour(WED,true).spare.filter(c=>c.jobs[JOBS.GUIDE]&&!c.busy)
  .slice(0,6).map(c=>c.name);
const visitors=['Sam Visitor','Robin Visitor','Kit Visitor'];
const picks=[];
visitors.forEach((v,i)=>{ picks.push({visitor:v,to:free[i*2],add:true});
  picks.push({visitor:v,to:free[i*2+1],add:true}); });
picks.push({job:JOBS.TABLE,to:free[0],add:true});
picks.push({job:JOBS.LOBBY,to:free[5],add:true});
commitTour(WED,true,panel,picks,[]);
clearReadCache_();
const both=free[0];

console.log('the data behind the roster, in order');
const data=tourRoster_(toDate_(WED));
ok(data.length>=6,data.length+' on duty');
const touring=data.filter(r=>r.touring).map(r=>r.name);
const rest=data.filter(r=>!r.touring).map(r=>r.name);
ok(touring.length===6,'six of them are touring: '+touring.join(', '));
ok(data.slice(0,6).every(r=>r.touring),'and they come first, all six');
ok(rest.length>0,'then the rest: '+rest.join(', '));
ok(data.filter(r=>r.touring).every(r=>!!r.group),
   'every touring line knows its family: "'+data[0].group+'"');
ok(data.filter(r=>!r.touring).every(r=>!r.group),
   'and no other line has one');

console.log('\neach pair under its own family, in route order');
const groups=[];
data.filter(r=>r.touring).forEach(r=>{
  if(!groups.length||groups[groups.length-1].label!==r.group){
    groups.push({label:r.group,names:[]}); }
  groups[groups.length-1].names.push(r.name); });
ok(groups.length===3,'three families: '+groups.map(g=>g.label).join(' / '));
ok(groups.every(g=>g.names.length===2),
   'two guides under each: '+groups.map(g=>g.names.join(' and ')).join(' / '));
ok(groups.map(g=>Number((/Route (\d+)/.exec(g.label)||[])[1]||0))
   .every((n,i,all)=>i===0||n>=all[i-1]),
   'in route order: '+groups.map(g=>g.label).join(' / '));
groups.forEach(g=>ok(g.names.every(n=>rows_(T).some(r=>
   trim_(r[col_(T,'Ambassador')])===n&&trim_(r[col_(T,'Job')])===JOBS.GUIDE&&
   g.label.indexOf(trim_(r[col_(T,'Prospective Student(s)')]))!==-1)),
   g.label+' is walked by '+g.names.join(' and ')));
ok(groups.map(g=>g.names.slice().sort().join()).join('|')===
   groups.map(g=>g.names.join()).join('|'),
   'and each pair reads in alphabetical order inside its family');

console.log('\na guide who is also a greeter is in the tours, once');
ok(touring.indexOf(both)!==-1,both+' is in the tours');
ok(rest.indexOf(both)===-1,'and not again at the bottom');
ok(data.filter(r=>r.name===both).length===1,'one line only');
const mine=data.filter(r=>r.name===both)[0].role;
ok(new RegExp(JOBS.GUIDE).test(mine)&&new RegExp(JOBS.TABLE).test(mine),
   'with both jobs on it: "'+mine+'"');
ok(data.filter(r=>r.name===both)[0].needsRoute===true,
   'and a box for their route sheet');

console.log('\nthe panel and the crews, under the tours');
const restRows=data.filter(r=>!r.touring);
ok(restRows.some(r=>new RegExp(JOBS.PANELIST).test(r.role)),'the panel is down there');
ok(restRows.filter(r=>new RegExp(JOBS.PANELIST).test(r.role)).length===
   panel.filter(n=>touring.indexOf(n)===-1).length,
   'all of it that is not already touring');
const rank=r=>new RegExp(JOBS.PANELIST).test(r.role)?0:
  (new RegExp(JOBS.LOBBY).test(r.role)?1:(new RegExp(JOBS.TABLE).test(r.role)?2:3));
ok(restRows.map(rank).every((n,i,all)=>i===0||n>=all[i-1]),
   'and it reads panel, then door, then table, then anybody handed a family: '+
   restRows.map(r=>r.role).join(' / '));

console.log('\nand that is how it prints');
global.__doc=[];
buildTourRoster(WED);
const lines=[]; let cells=[];
global.__doc.forEach(o=>{ if(o.cell){cells.push(String(o.t||''));return;}
  if(cells.length){lines.push({cells:cells});cells=[];}
  lines.push({head:String(o.t||''),h:o.h||''}); });
if(cells.length) lines.push({cells:cells});
const heads=lines.filter(x=>x.head!==undefined&&x.h==='H3').map(x=>x.head);
ok(heads[0]==='Touring','the first section is headed "'+heads[0]+'"');
ok(heads[1]==='Panel and greeters','then "'+heads[1]+'"');
ok(heads[2]&&/^Class visits at /.test(heads[2]),'then "'+heads[2]+'"');
const first=lines.filter(x=>x.cells)[0].cells;
const rowsOf=(flat,n)=>{const out=[];
  for(let i=0;i<flat.length;i+=n) out.push(flat.slice(i,i+n)); return out;};
const tbl=rowsOf(first,6);
ok(tbl[1][0]===groups[0].label&&!tbl[1][3],
   'the first line of the table is the family: "'+tbl[1][0]+'"');
ok(tbl[2][0]===groups[0].names[0]&&tbl[3][0]===groups[0].names[1],
   'with its two guides under it: '+tbl[2][0]+' and '+tbl[3][0]);
ok(tbl[4][0]===groups[1].label&&!tbl[4][3],
   'then the next family: "'+tbl[4][0]+'"');
ok(tbl.filter(r=>!r[3]).length===3,'three family lines in all, one per tour');
ok(tbl.slice(1).filter(r=>!!r[3]).length===6,'and six people under them');

console.log('\nthe roster reads in the order she ticks it off.');
