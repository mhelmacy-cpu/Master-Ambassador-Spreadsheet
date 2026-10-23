// No Preview button. The list draws itself as soon as the panel step is
// done, and again whenever the date or the "keep what is assigned" tick
// changes it, so a button whose only job was to redraw what is already
// on the screen was one more thing between her and the tour. Save is the
// only button left, and it comes alive when the list is drawn.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,sh=m.sheets[A];
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

console.log('the dialog has one button at the end, not two');
global.__dialogs.length=0; showStaffDialog();
const html=String(global.__dialogs[0].html);
ok(!/id="preview"/.test(html),'no Preview button');
ok(!/>Preview</.test(html),'and nothing labelled Preview');
ok(/id="save"/.test(html) && />Save to Tour Tracker</.test(html),
   'Save to Tour Tracker is still there');
ok(!/Press Preview again/.test(html),'and nothing tells her to press it');

console.log('\nit still draws itself without being asked');
ok(/function openStep2\(\)\{[^}]*doPreview\(\)/.test(html),
   'the panel step opens the list straight away');
ok(/onchange="restart\(\)"/.test(html),'changing the date starts over');

console.log('\nand Save comes alive when the list is on the screen');
const els={};
const el=id=>els[id]||(els[id]={id:id,innerHTML:'',disabled:true,checked:false,value:''});
const chain=()=>{ const p=new Proxy({},{get:()=>()=>p}); return p; };
const js=html.match(/<script>([\s\S]*?)<\\?\/script>/)[1];
const run=new Function('document','window','google',
  js+'\nreturn {render:render,saveOff:saveOff,fail:fail};')(
  {getElementById:el,querySelectorAll:()=>[]},{},{script:{run:chain()}});
el('d').value='2026-10-07';
ok(el('save').disabled===true,'it starts disabled, as the dialog opens');
run.saveOff();
ok(el('save').disabled===true,'and stays disabled while the plan is worked out');
run.render(planTour('2026-10-07',true));
ok(el('save').disabled===false,'then Save is ready');
ok(el('out').innerHTML.indexOf('Sam Visitor')!==-1,'with the family on the screen');
run.fail({message:'something went wrong'});
ok(el('save').disabled===true,'a failure puts it back out of reach');
ok(/something went wrong/.test(el('out').innerHTML),'and says what happened');

console.log('\nonly the button is gone, not the plan behind it');
const plan=planTour('2026-10-07',true);
ok(plan.pairs.length===1 && plan.greeters.length>0,
   'the same plan is still worked out: '+plan.pairs.length+' family, '+
   plan.greeters.length+' crews');

console.log('\none button, and it saves.');
