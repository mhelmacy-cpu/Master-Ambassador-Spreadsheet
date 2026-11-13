// The name tags, off the sheet she has always made in Pages: eight to a
// page, two across and four down, centred, in Times, the name large and
// what they are underneath it. An ambassador's is their first name and
// their grade. A parent's is their name, their child and the grade the
// child is applying for, and, where she ticks it, that they are already
// an LREI parent.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,S=SHEETS.SETTINGS,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
const DAY='2026-11-18';
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue([DAY,'Veronica Madar','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour(DAY,true,[],
  [{visitor:'Veronica Madar',to:'Jane Moss',add:true},
   {visitor:'Veronica Madar',to:'Avery Griffiths',add:true}],[]);
clearReadCache_();

console.log('a grade, written the way the tags write it');
ok(gradeLabel_('6')==='6th Grade','"6" is "'+gradeLabel_('6')+'"');
ok(gradeLabel_('6th')==='6th Grade','"6th" is "'+gradeLabel_('6th')+'"');
ok(gradeLabel_('8')==='8th Grade','"8" is "'+gradeLabel_('8')+'"');
ok(gradeLabel_('6th Grade')==='6th Grade','and one she has written out is left alone');
ok(gradeLabel_('Kindergarten')==='Kindergarten','so is anything that is not a number');
ok(gradeLabel_('')==='','and nothing is nothing');

console.log('\na parent who is not an LREI parent yet');
{
  const t=nameTagLines_({kind:'parent',first:'Marcus',last:'Reyes',
    child:'Iris Reyes',grade:'6',current:false});
  ok(t.top==='Marcus Reyes','their name on top: "'+t.top+'"');
  ok(t.lines.length===1,'one line under it');
  ok(t.lines[0]==='Iris Reyes, 6th Grade','their child and the grade: "'+t.lines[0]+'"');
  ok(t.lines.every(l=>!/LREI/.test(l)),'and nothing about being an LREI parent');
}

console.log('\nand one who is');
{
  const t=nameTagLines_({kind:'parent',first:'Annie',last:'Denson',
    child:'Theo Denson',grade:'6',current:true});
  ok(t.top==='Annie Denson','their name on top: "'+t.top+'"');
  ok(t.lines[0]==='Theo Denson, 6th Grade','their child first: "'+t.lines[0]+'"');
  ok(t.lines[1]==='Current LREI Parent','then: "'+t.lines[1]+'"');
  ok(t.lines.length===2,'and nothing else');
  // The wording is hers: one cell on Settings changes it everywhere.
  const at=rows_(S).findIndex(r=>norm_(r[0])===norm_('Current Parent Line'))+2;
  ok(at>1,'Current Parent Line is on the Settings sheet');
  m.sheets[S].getRange(at,2).setValue('Current LREI Family');
  clearReadCache_();
  const two=nameTagLines_({kind:'parent',first:'Annie',last:'Denson',current:true});
  ok(two.lines[0]==='Current LREI Family','and changing it changes the tag: "'+
     two.lines[0]+'"');
  ok(two.lines.length===1,'a parent with no child typed in gets only that line');
  m.sheets[S].getRange(at,2).setValue('Current LREI Parent');
  clearReadCache_();
}

console.log('\nan ambassador is their first name and their grade');
{
  const t=nameTagLines_({kind:'ambassador',name:'Jane Moss',grade:'6th'});
  ok(t.top==='Jane','"'+t.top+'", not their whole name, the way hers read');
  ok(t.lines.join('')==='6th Grade','and "'+t.lines.join('')+'" under it');
  const onDuty=nameTagsOnDuty_(toDate_(DAY));
  ok(onDuty.length===2,'two on duty that day: '+onDuty.map(x=>x.name).join(', '));
  ok(onDuty.every(x=>!!x.grade),'each with their grade off the Ambassadors sheet');
}

console.log('\nthe page itself');
const people=[
  {kind:'parent',first:'Annie',last:'Denson',child:'Theo Denson',grade:'6',current:true},
  {kind:'parent',first:'Marcus',last:'Reyes',child:'Iris Reyes',grade:'6'},
  {kind:'person',name:'Veronica Madar',note:'6th Grade'}
];
global.__doc=[];
let r=api_buildNameTags(DAY,people,true);
ok(r.tags===5,r.tags+' tags: the two on duty and the three typed in');
ok(r.pages===1,'on one page');
ok(global.__page.top===36&&global.__page.left===36,
   'half an inch of margin all round: '+JSON.stringify(global.__page));
const grid=global.__docTables[0];
ok(grid.widths.join(',')==='270,270',
   'two columns of 3.75 inches: '+grid.widths.join(' and ')+' points');
ok(grid.heights.join(',')==='180,180,180,180',
   'four rows of 2.5 inches: '+grid.heights.join(', '));
ok(grid.border===0,'and no border on any of it, so only the names print');
const cells=global.__doc.filter(o=>o.cell&&o.t);
ok(cells.length===11,cells.length+' lines of text in all');
ok(cells.every(o=>o.font==='Times New Roman'),'every one of them in Times New Roman');
ok(cells.every(o=>o.align==='center'),'centred');
ok(cells.every(o=>o.b===false),'and not one of them bold');
ok(cells.every(o=>o.i===false),'or italic');
const names=cells.filter(o=>o.size===28).map(o=>o.t);
const under=cells.filter(o=>o.size===20).map(o=>o.t);
ok(names.length===5,'five names at 28 point: '+names.join(', '));
ok(under.length===6,'six lines under them at 20 point');
ok(names.indexOf('Annie Denson')!==-1&&names.indexOf('Jane')!==-1,
   'the parents by both names and the ambassadors by their first');
ok(under.indexOf('Current LREI Parent')!==-1,'with the LREI line where it was ticked');

console.log('\nnine of them is two pages, and the grid stays eight to a page');
{
  const more=[];
  for(let i=0;i<9;i++) more.push({kind:'person',name:'Person '+(i+1),note:'6th Grade'});
  global.__doc=[];
  r=api_buildNameTags(DAY,more,false);
  ok(r.tags===9,'nine tags');
  ok(r.pages===2,'two pages');
  ok(global.__doc.filter(o=>String(o.t)==='--- PAGE BREAK ---').length===1,
     'with a page break between them');
  ok(global.__docTables.length===2,'a grid each');
  ok(global.__docTables.every(t=>t.heights.length===4&&t.widths.length===2),
     'both of them two across and four down, so the last page still lines up ' +
     'with the labels');
  const tops=global.__doc.filter(o=>o.cell&&o.size===28).map(o=>o.t);
  ok(tops.length===9,'nine names on the two pages');
}

console.log('\nand nothing to print is said rather than printed');
{
  let said='';
  try { buildNameTags(DAY,[]); } catch (e) { said=String(e.message||e); }
  ok(/Nobody to make a tag for/.test(said),'"'+said+'"');
}

console.log('\nthere is a button for it');
{
  global.__dialogs.length=0;
  showNameTagDialog();
  const html=String((global.__dialogs[0]||{}).html||'');
  ok(/Print name tags/.test(html),'the dialog opens');
  ok(/id="pf"/.test(html)&&/id="pl"/.test(html),'with a first and last name box');
  ok(/id="pc"/.test(html)&&/id="pg"/.test(html),'the child and their grade');
  ok(/Current LREI parent/.test(html),'and the tick for a current parent');
  ok(/api_buildNameTags/.test(html)&&typeof api_buildNameTags==='function',
     'and it builds them');
  const src=fs.readFileSync('build/App.gs','utf8');
  ok(/addItem\('Print Name Tags\.\.\.', 'showNameTagDialog'\)/.test(src),
     'and it is on the menu');
}

console.log('\neight to a page, in Times, like the ones in the drawer.');
