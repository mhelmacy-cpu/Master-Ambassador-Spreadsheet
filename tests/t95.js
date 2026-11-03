// She set two children to go round together in the dialog and nothing
// happened on the sheet. Two reasons, and they hid each other: Tour With
// is a column setup adds, so on a sheet that had not had setup run since
// the paste there was nowhere to write it, and the answer never said a
// word about the pairing either way. It writes the column itself now,
// and says what it did.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,sh=m.sheets[A];
const psh=m.sheets[P];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 set('Can Solo','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
[['2026-11-04','Adam Gingerich','Earth School','6','Male','WP','M'],
 ['2026-11-04','Fia Heldebro Leon','PS 110','6','Female','SOC','B']]
 .forEach((v,i)=>['Tour Date','Name','School','Grade','Gender','Race','Borough']
   .forEach((h,k)=>psh.getRange(2+i,col_(P,h)+1).setValue(v[k])));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const wed=toDate_('2026-11-04');
const tourWithOf=n=>trim_(prospectiveFor_(wed).filter(v=>v.name===n)[0].tourWith);

console.log('her sheet, without the column setup would have added');
{
  const at=col_(P,'Tour With');
  psh.getRange(1,at+1).setValue('');
  delete HEADER_CACHE_[P];
  clearReadCache_();
  ok(optionalCol_(P,'Tour With')===-1,'there is no Tour With column');
}

console.log('\nsaying the two of them go round together writes it anyway');
const res=commitTour('2026-11-04',true,[],
  [{visitor:'Adam Gingerich',to:'Charlotte Schwartz',add:true},
   {visitor:'Fia Heldebro Leon',to:'Aurelia Walker',add:true}],[],
  [{visitor:'Adam Gingerich',with:'Fia Heldebro Leon'}]);
clearReadCache_();
ok(optionalCol_(P,'Tour With')!==-1,'the column is there now');
ok(res.grouped.some(x=>/Tour With was added to Prospective Students/.test(x)),
   'and the answer says it had to add it: "'+
   res.grouped.filter(x=>/was added/.test(x))[0]+'"');
ok(res.grouped.some(x=>/go round together now/.test(x)),
   'and what it did with it: "'+res.grouped.filter(x=>/together/.test(x))[0]+'"');
ok(tourWithOf('Adam Gingerich')==='Fia Heldebro Leon',
   'the cell on the sheet reads: "'+tourWithOf('Adam Gingerich')+'"');

console.log('\nand the pairing is real, not only on the sheet');
const plan=planTour('2026-11-04',true);
const fia=plan.pairs.filter(p=>p.visitor.name==='Fia Heldebro Leon')[0];
ok(fia.follows==='Adam Gingerich','Fia Heldebro Leon goes round with Adam Gingerich');
const guidesFor=n=>rows_(T).filter(r=>trim_(r[col_(T,'Job')])===JOBS.GUIDE &&
  trim_(r[col_(T,'Prospective Student(s)')])===n)
  .map(r=>trim_(r[col_(T,'Ambassador')])).sort();
ok(guidesFor('Adam Gingerich').join()===guidesFor('Fia Heldebro Leon').join(),
   'both have '+guidesFor('Fia Heldebro Leon').join(' and '));
/* Both guides, not one: she picked one on each row and put the two
 * children together in the same save, so the guide she chose on the row
 * that stopped having places of its own still had to land. */
ok(guidesFor('Fia Heldebro Leon').length===2,
   'and neither pick was lost on the way: '+
   guidesFor('Fia Heldebro Leon').join(' and '));
ok(trim_(readCell_(P,prospectiveFor_(wed).filter(v=>v.name==='Fia Heldebro Leon')[0].row,
   'Route'))===trim_(readCell_(P,prospectiveFor_(wed)
   .filter(v=>v.name==='Adam Gingerich')[0].row,'Route')),
   'and one route on Prospective Students for the two of them');

console.log('\nthe answer always says what the pairing did');
const dlg=(function(){ global.__dialogs.length=0; showStaffDialog();
  return String(global.__dialogs[0].html); })();
ok(/r\.grouped/.test(dlg),'the dialog prints it rather than keeping it to itself');
const again=commitTour('2026-11-04',true,[],[],[],
  [{visitor:'Adam Gingerich',with:'Fia Heldebro Leon'}]);
ok(again.grouped.length===0,
   'asking for what is already true says nothing, rather than saying it twice');
const off=commitTour('2026-11-04',true,[],[],[],
  [{visitor:'Fia Heldebro Leon',alone:true}]);
clearReadCache_();
ok(off.grouped.some(x=>/go round on their own now/.test(x)),
   'and splitting them up says so: "'+off.grouped[0]+'"');
ok(!tourWithOf('Adam Gingerich')&&!tourWithOf('Fia Heldebro Leon'),
   'with both cells emptied');

console.log('\nwhat she sets in the dialog is on the sheet.');
