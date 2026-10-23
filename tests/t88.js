// The greeting crews are hers to pick, the same as the guides. Nothing
// is filled from the roster: every place comes up empty with a dropdown,
// bar the two her panel covers downstairs, which are hers already
// because she picked the panel.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,S=SHEETS.SETTINGS,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const crewOf=(p,job)=>p.greeters.filter(c=>c.job===job)[0];

console.log('nothing is filled for her');
ok(setting_('Script Suggests Greeters','')==='No','the setting is No by default');
let plan=planTour('2026-10-07',true);
const lobby=crewOf(plan,JOBS.LOBBY), table=crewOf(plan,JOBS.TABLE);
ok(lobby.needed===3 && table.needed===2,
   'the crews are still the size she asks for: '+lobby.needed+' and '+table.needed);
ok(lobby.chosen.length===0,'nobody is put on the door');
ok(table.chosen.length===0,'nor on the table');
ok(lobby.short===3 && table.short===2,'every place is open: '+
   lobby.short+' and '+table.short);
ok(/yours to pick/.test(lobby.why)&&/yours to pick/.test(table.why),
   'and it says so: "'+table.why+'"');
ok(plan.pairs[0].guideNames.length===0,'the guides are hers as before');
ok(plan.spare.length>0,plan.spare.length+' names to choose from');

console.log('\nthe dialog gives her a dropdown per place');
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:false,checked:false,value:''});
const gsel=[],hsel=[],csel=[];
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
global.__dialogs.length=0; showStaffDialog();
const js=String(global.__dialogs[0].html).match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const run=new Function('document','window','google',
  js+'\nreturn {render:render,crewPicker:crewPicker,swapsPicked:swapsPicked};')(
  {getElementById:el,querySelectorAll:s=>s==='select.gsel'?gsel:
    (s==='select.hsel'?hsel:(s==='select.csel'?csel:[]))},
  {},{script:{run:chain()}});
el('d').value='2026-10-07';
run.render(plan);
const picker=run.crewPicker(lobby,0);
ok((picker.match(/<select/g)||[]).length===3,'three dropdowns on the door, one per place');
ok((picker.match(/>choose a greeter</g)||[]).length===3,
   'each starting on "choose a greeter"');
ok((picker.match(/data-slot='add'/g)||[]).length===3,'all three marked as places to fill');
ok(!/none available/.test(picker),'not the old "none available"');
ok(!/nobody: leave this place empty/.test(picker),
   'and nothing to drop, since there is nobody on it yet');

console.log('\nshe picks three, and all three are saved');
/* Three who can do the job and are not on the Keep Apart list with each
 * other, which a crew refuses the same way a pair of guides does. */
const can=[];
plan.spare.filter(c=>c.jobs[JOBS.LOBBY]).forEach(c=>{
  if(can.length>=3) return;
  if(can.some(x=>keptApart_(x.name,c.name))) return;
  can.push(c);});
csel.length=0;
can.forEach(c=>csel.push({value:String(plan.spare.indexOf(c)),
  getAttribute:k=>k==='data-slot'?'add':'0',options:[]}));
const picked=run.swapsPicked();
ok(picked.length===3,'three picks sent');
ok(picked.every(x=>x.add===true&&x.job===JOBS.LOBBY),'all for the '+JOBS.LOBBY+' crew');
const res=commitTour('2026-10-07',true,[],picked,[]);
clearReadCache_();
ok(res.asked.length===3,'the answer repeats all three: '+res.asked.join('; '));
ok(!res.ignored.length,'and ignored none of them');
const onDoor=rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.LOBBY)
  .map(r=>trim_(r[col_(T,'Ambassador')]));
ok(onDoor.length===3,'the Tour Tracker has three: '+onDoor.join(', '));
ok(can.every(c=>onDoor.indexOf(c.name)!==-1),'hers, not its');

console.log('\nand the other crew is still waiting for her');
clearReadCache_();
plan=planTour('2026-10-07',true);
ok(crewOf(plan,JOBS.LOBBY).chosen.length===3,'the door is kept as she left it');
ok(crewOf(plan,JOBS.TABLE).chosen.length===0,'the table is still empty');

console.log('\nthe same person cannot fill two places on one crew');
const twice=[{job:JOBS.TABLE,to:can[0].name,add:true}];
const dup=commitTour('2026-10-07',true,[],twice.concat(
  [{job:JOBS.TABLE,to:can[0].name,add:true}]),[]);
clearReadCache_();
ok(dup.ignored.some(x=>/already on that crew/.test(x)),
   'the second is refused, and says why: '+
   dup.ignored.filter(x=>/already on that crew/.test(x))[0]);
const onTable=rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.TABLE)
  .map(r=>trim_(r[col_(T,'Ambassador')]));
ok(onTable.length===1,'and they are on it once: '+onTable.join(', '));
ok(rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.LOBBY).length===2,
   'the move took them off the door, which is two short now');

console.log('\nher panel still covers two of the places downstairs');
{
  clearReadCache_();
  const panel=api_handChoices('2026-10-07',JOBS.PANELIST).rows.slice(0,4).map(r=>r.name);
  api_saveByHand('2026-10-07',JOBS.PANELIST,panel);
  clearReadCache_();
  /* She has two of her own on the door by now, and the crew is three, so
   * the panel covers the one place left and no more: her picks keep
   * their places and the crew never grows past its size. */
  const c=crewOf(planTour('2026-10-07',true),JOBS.LOBBY);
  ok(c.chosen.length===c.needed,'the door is full: '+c.chosen.join(', '));
  ok(c.fromPanel===1,'one place covered off the panel, which is all that was open');
  ok(panel.slice(0,2).some(n=>c.chosen.indexOf(n)!==-1),
     'by somebody she put on the panel');
  // And with the door empty, the panel covers both of its places.
  const mine=c.chosen.filter(n=>panel.indexOf(n)===-1);
  commitTour('2026-10-07',true,panel,
    mine.map(n=>({job:JOBS.LOBBY,from:n,drop:true})),[]);
  clearReadCache_();
  const c2=crewOf(planTour('2026-10-07',true),JOBS.LOBBY);
  ok(c2.fromPanel===2,'two of them off the panel now: '+c2.chosen.join(', '));
  ok(c2.short===1,'and the third place is hers to pick');
}

console.log('\nand she can have the old filling back');
{
  const at=rows_(S).findIndex(r=>norm_(r[0])===norm_('Script Suggests Greeters'))+2;
  m.sheets[S].getRange(at,2).setValue('Yes');
  clearReadCache_();
  const p=planTour('2026-10-07',false);
  ok(crewOf(p,JOBS.LOBBY).chosen.length===3,'the door fills itself again');
  ok(crewOf(p,JOBS.TABLE).chosen.length===2,'and so does the table');
  ok(!/yours to pick/.test(crewOf(p,JOBS.TABLE).why||''),'with nothing left to pick');
}

console.log('\nthe crews are hers.');
