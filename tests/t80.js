// Which of the two guides takes the family on the class visit is hers.
// The guides sit on the class visit list themselves now, first and marked
// as their own, so when the two of them are in different rooms she can
// say which one it is instead of taking the academic one the script
// prefers. Her answer survives the save: the script writes its own
// answer into Class Visit To, and it used to overrule her on the way.
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
rows_(SHEETS.TEACHERS).forEach((r,i)=>m.sheets[SHEETS.TEACHERS]
  .getRange(i+2,col_(SHEETS.TEACHERS,'Teacher Email')+1).setValue('x@lrei.org'));
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-10-07');
const rowOf=()=>prospectiveFor_(wed).filter(v=>v.name==='Sam Visitor')[0];
const landingNow=()=>{clearReadCache_();
  return handbackChoices_(wed).byVisitor[norm_('Sam Visitor')];};

console.log('two guides in two different rooms');
// Hers to pick, so the fixture picks: a pair the script will not keep
// together, because the block at 9:06 reads differently for each.
let plan=planTour('2026-10-07',true);
const can=plan.spare.filter(c=>c.jobs[JOBS.GUIDE]);
let two=null;
for(let i=0;i<can.length&&!two;i++){
  for(let j=i+1;j<can.length&&!two;j++){
    const t=handbackAllocate_(wed,[{visitor:'Sam Visitor',
      guides:[can[i].name,can[j].name]}]).byVisitor[norm_('Sam Visitor')];
    if(t.where&&t.takers.length===1) two=[can[i].name,can[j].name];
  }
}
ok(!!two,'a pair who are not together at 9:06: '+two.join(' and '));
commitTour('2026-10-07',true,[],
  two.map(n=>({visitor:'Sam Visitor',to:n,add:true})),[]);
clearReadCache_();
plan=planTour('2026-10-07',true);
let pair=plan.pairs[0];
ok(pair.guideNames.length===2,'both are walking the family: '+pair.guideNames.join(' and '));
ok(pair.classVisit.takers.length===1,
   'and the script takes the academic one: '+pair.classVisit.takers[0]);
const mine=pair.classVisit.takers[0];
const other=pair.guideNames.filter(n=>n!==mine)[0];

console.log('\nboth of them are on the class visit list');
const own=pair.classOptions.filter(o=>o.own).map(o=>o.name);
ok(own.length===2,'their own guides are on it: '+own.join(' and '));
ok(pair.classOptions[0].own&&pair.classOptions[1].own,'and come first');
ok(pair.classOptions.some(o=>o.name===other),other+' among them, which is the point');

console.log('\nthe dropdown says which is which');
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:false,checked:false,value:''});
const gsel=[],hsel=[],csel=[];
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
const win={};
global.__dialogs.length=0; showStaffDialog();
const js=String(global.__dialogs[0].html).match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const run=new Function('document','window','google',
  js+'\nreturn {render:render,classVisitLine:classVisitLine,' +
  'handoffsPicked:handoffsPicked};')(
  {getElementById:el,querySelectorAll:s=>s==='select.gsel'?gsel:
    (s==='select.hsel'?hsel:(s==='select.csel'?csel:[]))},
  win,{script:{run:chain()}});
el('d').value='2026-10-07';
run.render(plan);
let line=run.classVisitLine(pair);
ok(line.indexOf('their own guide')!==-1,'marked as their own guide on the list');
ok(line.indexOf(other)!==-1,'with '+other+' on it by name');
ok(!/Both of them/.test(line),'and no "both of them", since they are not together');

console.log('\nshe picks the other one, and it is saved');
hsel.length=0;
hsel.push({value:String(pair.classOptions.map(o=>o.name).indexOf(other)),
  getAttribute:()=>String(pair.order)});
const picked=run.handoffsPicked();
ok(picked.length===1&&picked[0].to===other,'the dialog sends '+picked[0].to);
commitTour('2026-10-07',true,[],[],picked);
let c=landingNow();
ok(c.takers.join()===other,other+' takes them now, not '+mine);
ok(rowOf().classVisitTo.indexOf('Your pick: '+other)===0,
   'and the sheet says whose answer it is: "'+rowOf().classVisitTo+'"');
ok(!isYes_(String(rowOf().passOff)),
   'Pass Off stays No, because one of their own guides is not a hand-off');
ok(!rows_(T).some(r=>trim_(r[col_(T,'Job')])===JOBS.PASSOFF),
   'and nobody gets a Pass Off row on the Tour Tracker');

console.log('\nand saving again does not put the script back in charge');
commitTour('2026-10-07',true,[],[],[]);
c=landingNow();
ok(c.takers.join()===other,'still '+other+', after a save that touched nothing');
commitTour('2026-10-07',true,[],[],[]);
c=landingNow();
ok(c.takers.join()===other,'and after another one');

console.log('\nwhen the two of them do share a class, both take the family');
const put=(name,pod,split)=>rows_(A).forEach((r,i)=>{
  if((trim_(r[0])+' '+trim_(r[1]))!==name) return;
  sh.getRange(i+2,col_(A,'Homeroom')+1).setValue(pod);
  sh.getRange(i+2,col_(A,'Split')+1).setValue(split);
  sh.getRange(i+2,col_(A,'Grade')+1).setValue('6th'); });
put(mine,'CCM','6A'); put(other,'CCM','6A');
clearReadCache_();
plan=planTour('2026-10-07',true);
pair=plan.pairs[0];
ok(pair.classBoth===true,'the dialog is told both of them is an answer');
ok(pair.classVisit.takers.join()===other,
   'her pick still stands for now: '+pair.classVisit.takers.join(' and '));
run.render(plan);
line=run.classVisitLine(pair);
ok(/Both of them/.test(line),'so the list offers it: "'+
   (line.match(/Both of them[^<]*/)||[''])[0]+'"');

console.log('\nshe asks for both, and gets both');
hsel.length=0;
hsel.push({value:'both',getAttribute:()=>String(pair.order)});
const bothPick=run.handoffsPicked();
ok(bothPick.length===1&&bothPick[0].to===pair.guideNames.join(' and '),
   'the dialog sends both names: '+bothPick[0].to);
commitTour('2026-10-07',true,[],[],bothPick);
c=landingNow();
ok(c.takers.length===2,'both of them take the family: '+c.takers.join(' and '));
ok(rowOf().classVisitTo.indexOf('Your pick: ')===0,
   'the sheet reads: "'+rowOf().classVisitTo+'"');
commitTour('2026-10-07',true,[],[],[]);
c=landingNow();
ok(c.takers.length===2,'and it is still both after another save');

console.log('\nand she can go back to one of them');
clearReadCache_();
plan=planTour('2026-10-07',true); pair=plan.pairs[0];
run.render(plan);
hsel.length=0;
hsel.push({value:String(pair.classOptions.map(o=>o.name).indexOf(mine)),
  getAttribute:()=>String(pair.order)});
commitTour('2026-10-07',true,[],[],run.handoffsPicked());
c=landingNow();
ok(c.takers.join()===mine,'back to one of them: '+c.takers.join());

console.log('\nthe script does not overrule her, and she can overrule it.');
