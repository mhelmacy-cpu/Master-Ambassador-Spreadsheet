// A guide who takes their visitor into their own class at 9:06 walks
// straight from the tour into a period, and needs their books. The route
// sheet says so first, in the same large type as the rest of it: stop at
// your locker, then go to class. It used to send them to the cafeteria
// for them, which was right while they brought everything down at 8:25.
// They do not bring anything down any more, so nothing on a slip, in an
// email or on a route sheet asks them to.
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
const things=/Stop at your locker/;

console.log('the guide who takes the family into class');
let pages=pagesOf();
const takes=handbackChoices_(wed).byVisitor[norm_('Sam Visitor')].takers[0];
const back=two.filter(n=>n!==takes)[0];
ok(pages.length===2,'a page each: '+pages.map(p=>p.who).join(' and '));
let mine=pages.filter(p=>p.who===takes.toUpperCase())[0];
ok(!!mine,takes+' has a page');
const line=lineOf(mine,things);
ok(!!line,'and is told where their books are: "'+(line||{}).t+'"');
ok(line.t.indexOf('Stop at your locker with your visitor if you need anything, ' +
  'then go to class.')!==-1,'in those words, after the time');
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
ok(!lineOf(other,things),'and is not sent to their locker: they are going back to class');
ok(/Go back to your own class/.test(lineOf(other,/takes Sam Visitor/).t),
   'their line is the one they had: "'+lineOf(other,/takes Sam Visitor/).t.slice(0,70)+'"');

console.log('\nwhere the family is handed to somebody else');
const away=planTour('2026-10-07',true).pairs[0].classOptions.filter(o=>!o.own)[0].name;
commitTour('2026-10-07',true,[],[],[{visitor:'Sam Visitor',to:away}]);
clearReadCache_();
pages=pagesOf();
ok(pages.every(p=>!lineOf(p,things)),
   'neither guide is sent to their locker: both go back to the class they left');
ok(pages.some(p=>p.lines.some(l=>new RegExp('FOR '+away.toUpperCase()).test(l.t))),
   'and '+away+' gets their own block');
ok(pages.every(p=>p.lines.every(l=>!(new RegExp('FOR '+away.toUpperCase()).test(l.t)&&
   things.test(l.t)))),'which says nothing about a locker either');

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
ok(pages.every(p=>!!lineOf(p,things)),'both pages send them to their locker');
ok(pages.every(p=>/You and .* take Sam Visitor/
   .test((p.lines[p.lines.indexOf(lineOf(p,things))+1]||{}).t||'')),
   'each followed by the two of them taking the family in together');

console.log('\nand nothing asks them to bring anything down');
{
  // The three places it was ever said: the route sheet, the locker slip
  // and their own email. None of them says it now.
  // Told to bring it, which is the old line. "You do not need to bring
  // anything downstairs" is the new one and must not trip this.
  const down=/bring (everything|anything) (you need|with you)/i;
  ok(pages.every(p=>p.lines.every(l=>!down.test(l.t))),
     'not on a route sheet');
  global.__doc=[];
  buildLockerSlips('2026-10-07');
  const slips=global.__doc.map(o=>String(o.t||''));
  ok(!slips.some(t=>down.test(t)),'not on a locker slip');
  ok(slips.some(t=>/Nothing to bring down\. You can go to your locker after the tour\./
     .test(t)),'which says the opposite: "'+
     slips.filter(t=>/Nothing to bring down/.test(t))[0]+'"');
  global.__sent.length=0;
  sendStudentEmails('2026-10-07');
  const mail=global.__sent.map(x=>String(x.htmlBody||'')
    .replace(/<[^>]*>/g,' ').replace(/\s+/g,' '));
  ok(mail.length>0,mail.length+' student email(s)');
  ok(!mail.some(t=>down.test(t)),'and not in an email either');
  const said=/You do not need to bring anything downstairs\. You can go to your locker after the tour\./;
  ok(mail.every(t=>!/on the tour schedule/.test(t)||said.test(t)),
     'every ambassador with a job is told so: "'+
     ((mail.filter(t=>said.test(t))[0]||'').match(/You do not need[^.]*\.[^.]*\./)||[''])[0]+'"');
}

console.log('\ntheir books stay in their locker.');
