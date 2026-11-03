// Her way round: two visiting students, one guide each, and she wants
// all four to walk as one. She tried it by putting each guide on the
// other's family, which cannot work (one body, two routes) and gave her
// a dead end. The dialog asks the question itself now: "goes round with",
// on either row, which writes Tour With and brings both children's
// guides onto the one tour.
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
 set('Can Solo','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
[['2026-11-04','Adam Gingerich','Earth School','6','Male','WP','M'],
 ['2026-11-04','Fia Heldebro Leon','PS 110','6','Female','SOC','B']]
 .forEach((v,i)=>['Tour Date','Name','School','Grade','Gender','Race','Borough']
   .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1).setValue(v[k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-11-04');
const pairOf=(p,n)=>p.pairs.filter(x=>x.visitor.name===n)[0];
const guidesFor=n=>rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE &&
  trim_(r[col_(T,'Prospective Student(s)')])===n)
  .map(r=>trim_(r[col_(T,'Ambassador')])).sort();
const routeOn=n=>trim_((rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE &&
  trim_(r[col_(T,'Prospective Student(s)')])===n)[0]||[])[col_(T,'Route')]);

console.log('one guide each, the way she had it');
commitTour('2026-11-04',true,[],
  [{visitor:'Adam Gingerich',to:'Charlotte Schwartz',add:true},
   {visitor:'Fia Heldebro Leon',to:'Aurelia Walker',add:true}],[]);
clearReadCache_();
ok(guidesFor('Adam Gingerich').join()==='Charlotte Schwartz',
   'Adam Gingerich has Charlotte Schwartz');
ok(guidesFor('Fia Heldebro Leon').join()==='Aurelia Walker',
   'Fia Heldebro Leon has Aurelia Walker');
ok(routeOn('Adam Gingerich')!==routeOn('Fia Heldebro Leon'),
   'on routes '+routeOn('Adam Gingerich')+' and '+routeOn('Fia Heldebro Leon'));

console.log('\nputting one guide on the other family is still refused');
let said='';
try {
  commitTour('2026-11-04',true,[],
    [{visitor:'Adam Gingerich',to:'Aurelia Walker',add:true}],[]);
} catch (e) { said=String(e.message||e); }
ok(/is the only guide Fia Heldebro Leon has/.test(said),'it still says why: "'+said+'"');
ok(/goes round/.test(said)&&/with Fia Heldebro Leon/.test(said),
   'and now says what to do instead');

console.log('\nthe dialog asks the question on every family');
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:false,checked:false,value:''});
const gsel=[],hsel=[],csel=[],tsel=[];
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
clearReadCache_();
let plan=planTour('2026-11-04',true);
global.__dialogs.length=0; showStaffDialog();
const js=String(global.__dialogs[0].html).match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const run=new Function('document','window','google',
  js+'\nreturn {render:render,groupPicker:groupPicker,groupsPicked:groupsPicked};')(
  {getElementById:el,querySelectorAll:s=>s==='select.gsel'?gsel:
    (s==='select.hsel'?hsel:(s==='select.csel'?csel:
      (s==='select.tsel'?tsel:[])))},
  {},{script:{run:chain()}});
el('d').value='2026-11-04';
run.render(plan);
const picker=run.groupPicker(pairOf(plan,'Adam Gingerich'));
ok(/class='tsel'/.test(picker),'a dropdown on Adam Gingerich\'s row');
ok(/>on their own</.test(picker),'starting on "on their own"');
ok(/>with Fia Heldebro Leon</.test(picker),'offering the other visiting student');
ok(!/>with Adam Gingerich</.test(picker),'and not themselves');

console.log('\nshe says the two of them go round together');
tsel.length=0;
tsel.push({value:'Fia Heldebro Leon',
  getAttribute:()=>String(pairOf(plan,'Adam Gingerich').order)});
const picked=run.groupsPicked();
ok(picked.length===1 && picked[0].with==='Fia Heldebro Leon',
   'the dialog sends: '+JSON.stringify(picked[0]));
const res=commitTour('2026-11-04',true,[],[],[],picked);
clearReadCache_();
ok(res.grouped.some(x=>/go round together now/.test(x)),
   'and the answer says so: "'+res.grouped[0]+'"');
ok(trim_(prospectiveFor_(wed).filter(v=>v.name==='Adam Gingerich')[0].tourWith)===
   'Fia Heldebro Leon','Tour With on the sheet now reads Fia Heldebro Leon');

console.log('\nand all four of them walk as one');
const both=['Aurelia Walker','Charlotte Schwartz'];
ok(guidesFor('Adam Gingerich').join()===both.join(),
   'Adam Gingerich now has '+guidesFor('Adam Gingerich').join(' and '));
ok(guidesFor('Fia Heldebro Leon').join()===both.join(),
   'and Fia Heldebro Leon has the same two');
ok(routeOn('Adam Gingerich')===routeOn('Fia Heldebro Leon'),
   'on one route: '+routeOn('Adam Gingerich'));

console.log('\neach child still has their own class visit');
clearReadCache_();
plan=planTour('2026-11-04',true);
const adam=pairOf(plan,'Adam Gingerich'), fia=pairOf(plan,'Fia Heldebro Leon');
ok(adam.withVisitors.join()==='Fia Heldebro Leon'&&fia.follows==='Adam Gingerich',
   'the two rows say so to each other');
ok((fia.classOptions||[]).length>0,
   fia.classOptions.length+' names Fia Heldebro Leon could be sent to');
const away=fia.classOptions.filter(o=>!o.own&&!o.fifth)[0].name;
commitTour('2026-11-04',true,[],[],[{visitor:'Fia Heldebro Leon',to:away}]);
clearReadCache_();
const land=handbackChoices_(wed).byVisitor;
ok(land[norm_('Fia Heldebro Leon')].takers.join()===away,
   'Fia Heldebro Leon goes to '+away+'\'s class');
ok(both.indexOf(land[norm_('Adam Gingerich')].takers[0])!==-1,
   'and Adam Gingerich goes with '+land[norm_('Adam Gingerich')].takers.join()+
   ', one of their own guides');

console.log('\nand she can split them up again');
clearReadCache_();
plan=planTour('2026-11-04',true);
tsel.length=0;
tsel.push({value:'-',getAttribute:()=>String(pairOf(plan,'Fia Heldebro Leon').order)});
run.render(plan);
const undo=run.groupsPicked();
ok(undo[0].alone===true,'the dialog sends "on their own"');
const back=commitTour('2026-11-04',true,[],[],[],undo);
clearReadCache_();
ok(back.grouped.some(x=>/go round on their own now/.test(x)),
   'the answer says so: "'+back.grouped[0]+'"');
plan=planTour('2026-11-04',true);
ok(!pairOf(plan,'Fia Heldebro Leon').follows,'Fia Heldebro Leon is on their own again');
ok(!trim_(prospectiveFor_(wed).filter(v=>v.name==='Adam Gingerich')[0].tourWith),
   'and Tour With is empty on both rows');

console.log('\nfour of them, one route, two class visits.');
