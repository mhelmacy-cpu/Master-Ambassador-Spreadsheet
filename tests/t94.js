// The number of visitors in one class is a warning, not a limit. It
// never was a limit in the code - nothing was ever refused or moved
// because of it - but it was called Max Visitors Per Class and the
// dialog told her to hand the family somewhere else, which reads like a
// rule. It says what is happening now and leaves the decision to her.
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
 set('Can Solo','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
// Four visiting students, all walked into one class on purpose.
['A','B','C','D'].forEach((x,i)=>
  ['Tour Date','Name','School','Grade','Gender','Race','Borough']
    .forEach((h,k)=>m.sheets[P].getRange(2+i,col_(P,h)+1)
      .setValue(['2026-11-04','Visitor '+x,'PS 41','6','Female','WP','M'][k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-11-04');

console.log('the setting says what it does');
ok(setting_('Warn Above Visitors Per Class','')==='3',
   'Warn Above Visitors Per Class is 3');
ok(DEFAULT_SETTINGS.every(d=>d[0]!=='Max Visitors Per Class'),
   'and there is no "Max Visitors Per Class" left to read as a limit');

console.log('\nfour visitors into one teacher\'s room, which she is allowed');
const one='Michelle Denson';
const takers=[];
['Visitor A','Visitor B','Visitor C','Visitor D'].forEach(v=>{
  const plan=planTour('2026-11-04',true);
  const pick=plan.pairs.filter(p=>p.visitor.name===v)[0].classOptions
    .filter(o=>o.name===one)[0];
  ok(!!pick,v+' can be sent to '+one);
  takers.push(pick);
  commitTour('2026-11-04',true,[],[],[{visitor:v,to:one}]);
  clearReadCache_();
});
const land=handbackChoices_(wed).byVisitor;
const mine=Object.keys(land).filter(k=>land[k].takers.join()===one);
ok(mine.length===4,'all four are going to '+one+', and nothing refused one of them');
ok(land[mine[3]].count===4,'the fourth is counted as the fourth: '+land[mine[3]].count);
ok(land[mine[3]].over===true,'and marked as above the number she asked about');

console.log('\nthe dialog says so without telling her to undo it');
const plan=planTour('2026-11-04',true);
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:false,checked:false,value:''});
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
global.__dialogs.length=0; showStaffDialog();
const js=String(global.__dialogs[0].html).match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const run=new Function('document','window','google',
  js+'\nreturn {render:render,classVisitLine:classVisitLine};')(
  {getElementById:el,querySelectorAll:()=>[]},{},{script:{run:chain()}});
el('d').value='2026-11-04';
run.render(plan);
const over=plan.pairs.filter(p=>p.classVisit&&p.classVisit.over)[0];
const line=run.classVisitLine(over);
ok(/that class is getting 4 visitors/.test(line),
   'it reads: "'+line.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')
     .match(/that class[^.]*\.[^.]*\./)[0]+'"');
ok(/Which is fine if you want it/.test(line),'saying plainly that it is allowed');
ok(!/more than the limit/.test(line),'and nothing about a limit');
const out=el('out').innerHTML.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
const summary=(out.match(/[^.]*you asked to be told about[^.]*/)||[''])[0].trim();
ok(!!summary,'the summary says the same: "'+summary.slice(-70)+'"');
ok(/Nothing here is stopped/.test(out),'and that nothing is stopped');
ok(!/the limit is/i.test(out),'with no limit named anywhere');

console.log('\nthe dropdown counts them rather than shutting the door');
const opt=plan.pairs[0].classOptions.filter(o=>o.name===one)[0];
ok(opt.full===true,one+'\'s room is marked as having people in it');
// The one in the list below, not the "as it is" line at the top of it.
const option=(run.classVisitLine(plan.pairs[0])
  .match(new RegExp('<option[^>]*>'+one+' - [^<]*','g'))||[''])[0].replace(/<[^>]*>/,'');
ok(/, 4 there/.test(option),'and the option counts them: "'+option+'"');
ok(!/full/.test(option),'without the word "full", which read like a closed door');

console.log('\nand her own number is kept when the name changes');
{
  // A sheet made before the rename, with a number she had set herself.
  const at=rows_(S).findIndex(r=>norm_(r[0])===norm_('Warn Above Visitors Per Class'))+2;
  m.sheets[S].getRange(at,1).setValue('Max Visitors Per Class');
  m.sheets[S].getRange(at,2).setValue('5');
  clearReadCache_();
  ok(handbackChoices_(wed).cap===5,'the old name is still read: 5');
  const said=refreshSettingNames_();
  clearReadCache_();
  ok(said.length===1,'setup renames it and says so: "'+said[0]+'"');
  ok(setting_('Warn Above Visitors Per Class','')==='5','her 5 is kept');
  ok(!rows_(S).some(r=>norm_(r[0])===norm_('Max Visitors Per Class')),
     'and the old name is gone');
  ok(refreshSettingNames_().length===0,'running setup again has nothing to do');
}

console.log('\nwarned, not stopped.');
