// The class visit dropdown on a family she has not staffed yet.
// With the guides hers to pick, a family with nobody on it was left out
// of the class visit sums altogether: no line, no list, nothing to click.
// It comes up now, says the class visit follows whoever she picks, and
// lets her send the family to somebody else before she picks anybody.
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

console.log('nobody is walking them yet');
let plan=planTour('2026-10-07',true);
let pair=plan.pairs[0];
ok(pair.guideNames.length===0,'no guides, since they are hers to pick');
ok(pair.classVisit===null,'so there is no class visit worked out');
ok((pair.classOptions||[]).length>0,
   (pair.classOptions||[]).length+' names she could send them to anyway');

console.log('\nand the dialog gives her the dropdown');
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:false,checked:false,value:''});
const gsel=[],hsel=[],csel=[];
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
global.__dialogs.length=0; showStaffDialog();
const js=String(global.__dialogs[0].html).match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const win={};
const run=new Function('document','window','google',
  js+'\nreturn {render:render,cvShow:cvShow,cvRefresh:cvRefresh,' +
  'classVisitLine:classVisitLine,handoffsPicked:handoffsPicked};')(
  {getElementById:el,querySelectorAll:s=>s==='select.gsel'?gsel:
    (s==='select.hsel'?hsel:(s==='select.csel'?csel:[]))},
  win,{script:{run:chain()}});
el('d').value='2026-10-07';
run.render(plan);
const line=run.classVisitLine(pair);
ok(line!=='','the line is drawn at all, which it was not before');
ok(/select class='hsel'/.test(line),'with the list on it');
ok(/choose who takes them/.test(line),'nothing chosen yet');
ok(/once you have picked one/.test(line),
   'and it says what happens when she picks a guide: "'+
   line.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,110)+'"');
ok(!/cannot be worked out/.test(line),'no warning, because nothing is wrong');

console.log('\nthe command is asked about them as she goes, guides or not');
const asked=[];
const run2=new Function('document','window','google',
  js+'\nreturn {render:render,cvRefresh:cvRefresh};')(
  {getElementById:el,querySelectorAll:()=>[]},win,
  {script:{run:{withSuccessHandler:()=>({withFailureHandler:()=>({
    api_classVisitPreview:(d,f)=>asked.push(f)})})}}});
run2.render(plan);
run2.cvRefresh();
ok(asked.length===1,'one question went out');
ok(asked[0].length===1 && asked[0][0].visitor==='Sam Visitor',
   'about Sam Visitor');
ok(asked[0][0].guides.length===0,'with nobody named on it');

console.log('\nand the answer comes back with a list');
const answer=api_classVisitPreview('2026-10-07',
  [{visitor:'Sam Visitor',guides:[]}]);
const one=answer.byVisitor['Sam Visitor'];
ok(!!one,'the family is in the answer');
ok(one.classVisit===null,'with no class visit, since nobody is walking them');
ok(one.classOptions.length>0,one.classOptions.length+' names to choose from');
run.cvShow(answer);
ok(el('cv'+pair.order).innerHTML.indexOf('hsel')!==-1,
   'and the dropdown is on the screen');

console.log('\nshe sends them to somebody before picking a guide');
const who=one.classOptions.filter(c=>!c.fifth)[0];
hsel.length=0;
hsel.push({value:String(one.classOptions.indexOf(who)),
  getAttribute:()=>String(pair.order)});
pair.classOptions=one.classOptions;
const picked=run.handoffsPicked();
ok(picked.length===1 && picked[0].to===who.name,
   'the dialog sends '+picked[0].to);
const res=commitTour('2026-10-07',true,[],[],picked);
clearReadCache_();
const rowsFor=n=>rows_(T).filter(r=>trim_(r[col_(T,'Ambassador')])===n)
  .map(r=>trim_(r[col_(T,'Job')])+' for '+trim_(r[col_(T,'Prospective Student(s)')]));
ok(rowsFor(who.name).some(x=>x.indexOf(JOBS.PASSOFF)===0),
   who.name+' is on the Tour Tracker: '+rowsFor(who.name).join(', '));
const v=prospectiveFor_(toDate_('2026-10-07'))[0];
ok(norm_(String(v.classVisitTo)).indexOf(norm_(who.name))===0,
   'and the sheet still says so afterwards: "'+v.classVisitTo+'"');
ok(isYes_(String(v.passOff)),'flagged as a hand-off');

console.log('\nand it stays hers once she picks the guides too');
clearReadCache_();
plan=planTour('2026-10-07',true);
pair=plan.pairs[0];
const can=plan.spare.filter(c=>c.jobs[JOBS.GUIDE]&&norm_(c.name)!==norm_(who.name));
const add=[0,1].map(k=>({visitor:'Sam Visitor',to:can[k].name,add:true}));
commitTour('2026-10-07',true,[],add,[]);
clearReadCache_();
const after=planTour('2026-10-07',true).pairs[0];
ok(after.guideNames.length===2,'two guides now: '+after.guideNames.join(' and '));
ok(!!after.classVisit,'and a class visit worked out');
ok(after.classVisit.takers.join('')===who.name,
   'still the one she picked: '+after.classVisit.takers.join(' and '));

console.log('\nthe class visit is hers to pick too.');
