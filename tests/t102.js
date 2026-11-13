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
/* The school's own names for a year are not numbers and must never be
 * read as one: the 4s are the 4s, not the 4th grade. */
ok(gradeLabel_('4s')==='4s','"4s" stays "'+gradeLabel_('4s')+'", not 4th Grade');
ok(gradeLabel_('2s')==='2s','"2s" stays "'+gradeLabel_('2s')+'"');
ok(gradeLabel_('K')==='K','"K" stays "'+gradeLabel_('K')+'"');
ok(gradeLabel_('Pre-K')==='Pre-K','"Pre-K" stays "'+gradeLabel_('Pre-K')+'"');
ok(gradeLabel_('11')==='11th Grade','and 11 is still "'+gradeLabel_('11')+'"');

console.log('\na parent who is not an LREI parent yet');
{
  const t=nameTagLines_({kind:'parent',first:'Marcus',last:'Reyes',
    child:'Iris Reyes',grade:'6',current:false});
  ok(t.top==='Marcus Reyes','their name on top: "'+t.top+'"');
  ok(t.lines.length===1,'one line under it');
  ok(t.lines[0]==='Iris, 6th','their child, by first name, and the grade short: "'+
     t.lines[0]+'"');
  ok(t.lines[0].indexOf('Reyes')===-1,
     'no last name on the child: it is the parent\'s own, on the line above');
  ok(t.lines[0].indexOf('Grade')===-1,'and the grade short, since it is a badge');
  ok(t.lines.every(l=>!/LREI/.test(l)),'and nothing about being an LREI parent');
}

console.log('\nand one who is');
{
  const t=nameTagLines_({kind:'parent',first:'Annie',last:'Denson',
    child:'Theo Denson',grade:'6',current:true});
  ok(t.top==='Annie Denson','their name on top: "'+t.top+'"');
  ok(t.lines[0]==='Theo, 6th','their child first: "'+t.lines[0]+'"');
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

console.log('\nthe grade short, which is what a parent tag uses');
ok(gradeShort_('6')==='6th','"6" is "'+gradeShort_('6')+'"');
ok(gradeShort_('6th')==='6th','"6th" is "'+gradeShort_('6th')+'"');
ok(gradeShort_('6th Grade')==='6th','and "6th Grade" is "'+gradeShort_('6th Grade')+'"');
ok(gradeShort_('Kindergarten')==='Kindergarten','anything else is left as she typed it');
ok(gradeShort_('4s')==='4s','the 4s are the 4s on a parent tag too: "'+
   gradeShort_('4s')+'"');
ok(gradeShort_('')==='','and nothing is nothing');

console.log('\nan ambassador is their first name and their grade');
{
  const t=nameTagLines_({kind:'ambassador',name:'Jane Moss',grade:'6th'});
  ok(t.top==='Jane','"'+t.top+'", not their whole name, the way hers read');
  ok(t.lines.join('')==='6th Grade','and "'+t.lines.join('')+'" under it');
  const onDuty=nameTagsOnDuty_(toDate_(DAY));
  ok(onDuty.length===2,'two on duty that day: '+onDuty.map(x=>x.name).join(', '));
  ok(onDuty.every(x=>!!x.grade),'each with their grade off the Ambassadors sheet');
}

console.log('\na student she types in is a first name too');
{
  // Her sheet has never had a last name on a student's tag, and that
  // holds whether the script found them on the tour or she typed them.
  const t=nameTagLines_({kind:'student',name:'Veronica Madar',grade:'6'});
  ok(t.top==='Veronica','a whole name typed in prints as "'+t.top+'"');
  ok(t.top.indexOf(' ')===-1,'with no last name on it');
  ok(t.lines.join('')==='6th Grade','and "'+t.lines.join('')+'" under it');
  const one=nameTagLines_({kind:'student',name:'Veronica',grade:'6th'});
  ok(one.top==='Veronica','a first name on its own is left as it is');
  // The free-form box is the one thing that prints exactly what she
  // types, both lines, because it is for anybody at all.
  const any=nameTagLines_({kind:'person',name:'Mary Katherine Doyle',note:'Spanish'});
  ok(any.top==='Mary Katherine Doyle','"anybody else" prints what she types: "'+
     any.top+'"');
  ok(any.lines.join('')==='Spanish','and whatever she puts under it');
}

console.log('\na child in the 4s, on both kinds of tag');
{
  const p=nameTagLines_({kind:'parent',first:'Dana',last:'Okonkwo',
    child:'Ada Okonkwo',grade:'4s',current:true});
  ok(p.lines[0]==='Ada, 4s','the parent tag reads "'+p.lines[0]+'"');
  ok(p.lines.join(' ').indexOf('4th')===-1,'with no 4th anywhere on it');
  const s2=nameTagLines_({kind:'student',name:'Ada Okonkwo',grade:'4s'});
  ok(s2.lines.join('')==='4s','and the child\'s own tag reads "'+
     s2.lines.join('')+'"');
}

console.log('\nthe page itself');
const people=[
  {kind:'parent',first:'Annie',last:'Denson',child:'Theo Denson',grade:'6',current:true},
  // written out the long way to show it still comes out short

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
ok(under.indexOf('Theo, 6th')!==-1,'and the child line short: "Theo, 6th"');
ok(under.every(l=>!/Denson, /.test(l)),'never the child with a last name on it');

console.log('\nand the page holds all four rows, which is what a wasted sheet is');
{
  /* A sheet of labels is thrown away when a row carries over, so the
   * page is measured here the way the route sheets are: what is on it,
   * at the size it is, against what the margins leave. */
  const room=()=>792-(global.__page.top||0)-(global.__page.bottom||0);
  const gridHeight=t=>(t.heights||[]).reduce((n,h)=>n+(h||0),0);
  // Everything on the page that is not inside the grid: Docs keeps an
  // empty paragraph after a table and puts a page break in one of its
  // own, and each of those is a line of the page unless it is squashed.
  const loose=global.__doc.filter(o=>!o.cell);
  ok(loose.every(o=>o.size===1),
     loose.length+' line(s) outside the grid, all of them squashed to 1 point');
  const used=gridHeight(global.__docTables[0])+loose.reduce((n,o)=>n+(o.size||11)*1.2,0);
  ok(used<=room(),'the page holds its four rows: '+Math.round(used)+'pt of '+
     room()+'pt, '+Math.round(room()-used)+'pt spare');
  ok(gridHeight(global.__docTables[0])===720,'the grid itself is ten inches of it');
  ok((global.__page.top||0)+(global.__page.bottom||0)<=72,
     'with the margins kept to what the grid leaves: '+global.__page.top+
     ' at the top, '+global.__page.bottom+' at the foot');
  /* The empty paragraph a cleared Document keeps is off the top
   * altogether: that one line above the grid is what pushed the last row
   * onto a second sheet. */
  ok((global.__kids[0]||{}).table===true,
     'and the page starts with the grid itself, not with a blank line');
}

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
  ok(global.__doc.filter(o=>!o.cell).every(o=>o.size===1),
     'nothing between the two grids is any bigger than a point');
  global.__docTables.forEach((t,i)=>ok(
    (t.heights||[]).reduce((n,h)=>n+(h||0),0)===720,
    'page '+(i+1)+' is four rows of 2.5 inches, whether it is full or not'));
  // Eight on the first page and one on the second: never nine on one,
  // and never six because a row carried over.
  const perPage=[];
  let n=0;
  global.__doc.forEach(o=>{ if(!o.cell&&String(o.t)==='--- PAGE BREAK ---'){perPage.push(n);n=0;return;}
    if(o.cell&&o.size===28) n++; });
  perPage.push(n);
  ok(perPage.join(',')==='8,1','eight on the first page, then the rest: '+
     perPage.join(' then '));
  ok(perPage.every(x=>x<=8),'and never more than eight on any of them');
}

console.log('\nseventeen of them, which is three pages and no sheet wasted');
{
  const lots=[];
  for(let i=0;i<17;i++) lots.push({kind:'student',name:'Child '+(i+1),grade:'6'});
  global.__doc=[];
  const out=api_buildNameTags(DAY,lots,false);
  ok(out.pages===3,'three pages for seventeen');
  const perPage=[];
  let n=0;
  global.__doc.forEach(o=>{ if(!o.cell&&String(o.t)==='--- PAGE BREAK ---'){perPage.push(n);n=0;return;}
    if(o.cell&&o.size===28) n++; });
  perPage.push(n);
  ok(perPage.join(',')==='8,8,1','filled eight at a time: '+perPage.join(' then '));
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
  ok(/id="sn"/.test(html)&&/id="sg"/.test(html),'a box for a student and their grade');
  ok(/First names only on a student tag/.test(html),
     'saying first names only on a student tag');
  ok(/Current LREI parent/.test(html),'and the tick for a current parent');
  ok(/api_buildNameTags/.test(html)&&typeof api_buildNameTags==='function',
     'and it builds them');
  const src=fs.readFileSync('build/App.gs','utf8');
  ok(/addItem\('Print Name Tags\.\.\.', 'showNameTagDialog'\)/.test(src),
     'and it is on the menu');
}

console.log('\neight to a page, in Times, like the ones in the drawer.');
