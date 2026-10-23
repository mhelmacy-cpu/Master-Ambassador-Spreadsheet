// A teacher who is also somebody's advisor used to get two emails off two
// subject lines, often with the same name in both. There is one email per
// person now: their advisees are a section of it, and an advisee the email
// already names is said in a line rather than tabled twice. Somebody who
// advises a student they do not teach still gets an email of their own,
// because there is nothing to join it to.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,TE=SHEETS.TEACHERS,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
// Every teacher with an address of their own, so who hears what is plain.
rows_(TE).forEach((r,i)=>m.sheets[TE].getRange(i+2,col_(TE,'Teacher Email')+1)
  .setValue(norm_(trim_(r[col_(TE,'Teacher Name')])).replace(/[^a-z]/g,'')+'@lrei.org'));
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-07','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true},
   {visitor:'Sam Visitor',to:'Camille Bedeau',add:true}],[]);
clearReadCache_();

global.__sent.length=0;
const r=sendTeacherEmails('2026-10-07');
const text=x=>String(x.htmlBody||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');

console.log('nobody hears twice');
const byTo={};
global.__sent.forEach(x=>{ byTo[x.to]=(byTo[x.to]||[]).concat([x]); });
const twice=Object.keys(byTo).filter(k=>byTo[k].length>1);
ok(twice.length===0,'one email each, across all '+global.__sent.length+
   ': '+(twice.map(k=>k+' got '+byTo[k].length).join('; ')||'nobody got two'));

console.log('\nan advisor who teaches their advisee hears once, in that email');
const both=global.__sent.filter(x=>/out of your class/i.test(text(x)) &&
  /advisee/i.test(text(x)))[0];
ok(!!both,'there is such an email: "'+both.subject+'"');
ok(/Student Out of Your Class|Your Class and the Middle School Tour/.test(both.subject),
   'under the subject about their class, not a second one about advisees');
const who=(text(both).match(/(\w[\w'-]+ [\w'-]+) is your advisee as well/)||[])[1];
ok(!!who,'and the advisee is named in a line: "'+who+' is your advisee as well."');
ok((text(both).match(new RegExp(who,'g'))||[]).length===2,
   'their name is in it twice over: the table row and that line, not a second table');
ok(!/Advisee on Tour Duty/.test(both.subject),'the old subject is not on it');

console.log('\nan advisor who teaches none of them still gets their own');
const alone=global.__sent.filter(x=>/Advisee on Tour Duty/.test(x.subject));
ok(alone.length>0,alone.length+' email(s) of that kind');
ok(alone.every(x=>/Your advisee\(s\) will be out/.test(text(x))),
   'each with the advisee table on it');
ok(alone.every(x=>!/out of your class/i.test(text(x))),
   'and nothing about a class of their own, which is why it is its own email');

console.log('\nand an advisee is in the email of whoever advises them');
const advisorOf={};
ambassadors_().forEach(a=>{ if(a.advisor) advisorOf[a.name]=a.advisor; });
const onTour=rows_(T).filter(r=>sameDay_(toDate_(r[col_(T,'Tour Date')]),toDate_('2026-10-07')) &&
  trim_(r[col_(T,'Job')])!==JOBS.PASSOFF && trim_(r[col_(T,'Job')])!==JOBS.BUDDY)
  .map(r=>trim_(r[col_(T,'Ambassador')]));
const uniq=onTour.filter((n,i)=>onTour.indexOf(n)===i);
let checked=0;
uniq.forEach(name=>{
  const advisor=advisorOf[name]; if(!advisor) return;
  advisor.split(/[\/,&]| and /).map(trim_).filter(Boolean).forEach(one=>{
    const t=teachersByName_()[norm_(one)]; if(!t||!t.email) return;
    const mine=(byTo[t.email]||[]).filter(x=>new RegExp(name).test(text(x)));
    ok(mine.length===1,one+' hears about '+name+' once, in "'+
       (mine[0]||{}).subject+'"');
    checked++;
  });
});
ok(checked>0,checked+' advisor/advisee pair(s) checked');

console.log('\nthe counts say what really went out');
ok(r.teachersSent+r.advisorsSent===global.__sent.length,
   r.teachersSent+' class teacher and '+r.advisorsSent+' advisor email(s), which is '+
   global.__sent.length+', the number sent');
ok(r.adviseeSent>0,r.adviseeSent+' of the class teachers\' emails carry an advisee');
ok(r.adviseeSent<=r.teachersSent,'which is counted as a part of those, not as more email');

console.log('\none email each.');
