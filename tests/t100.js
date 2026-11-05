// A guide's route sheet has to be ONE page. A second sheet is the one
// they leave on the printer, and the end of the morning is on it. Google
// does not tell a script where a Doc will break, so the sheet is
// measured here, in the same words the script uses to decide: the lines
// it holds, the width they have, the look it chose. Every sheet, from
// the lightest to the heaviest, comes out inside one page.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,T=SHEETS.TRACKER,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});

/* The page as it comes out of the mock: the paragraphs between page
 * breaks, with the size and spacing each was really given. Measured
 * against the same paper the script measured against. */
const pagesOf=dateStr=>{
  global.__doc=[];
  buildRouteSheets(dateStr);
  const out=[]; let now=[];
  global.__doc.forEach(o=>{
    if(String(o.t)==='--- PAGE BREAK ---'){ out.push(now); now=[]; return; }
    now.push(o); });
  out.push(now);
  return out;
};
const pageMargin=()=>{
  const pg=global.__page||{};
  return { top: pg.top==null?72:pg.top, bottom: pg.bottom==null?72:pg.bottom,
    left: pg.left==null?72:pg.left, right: pg.right==null?72:pg.right };
};
/* The same arithmetic the script does, done again here from what landed
 * on the page rather than from what it meant to put there. */
const heightOf=(page,mg)=>{
  const usable=SHEET_PAPER_.width-mg.left-mg.right;
  let h=0;
  page.forEach(o=>{
    const size=o.size||(o.h==='H1'?20:11);
    const wide=!!(o.b||o.h==='H1');
    const perLine=Math.max(10,Math.floor(usable/(size*(wide?0.58:0.54))));
    const rows=Math.max(1,Math.ceil(String(o.t||'').length/perLine));
    h+=rows*size*1.2*(o.ls||1.15);
  });
  return h;
};
const fits=(what,dateStr)=>{
  const pages=pagesOf(dateStr);
  const mg=pageMargin();
  const room=SHEET_PAPER_.height-mg.top-mg.bottom;
  pages.forEach((pg,i)=>{
    const h=heightOf(pg,mg);
    ok(h<=room,what+', sheet '+(i+1)+' of '+pages.length+': '+
       Math.round(h)+'pt of '+room+'pt, '+pg.length+' lines, '+
       Math.round(room-h)+'pt spare');
  });
  return pages;
};

console.log('the paper, and how much of it there is');
ok(SHEET_PAPER_.height===792&&SHEET_PAPER_.width===612,'Letter, 612 by 792 points');
ok(SHEET_LOOKS_[0].spacing===2,
   'the first look tried is still double spaced, which is how she has it');
ok(SHEET_LOOKS_.length>2,SHEET_LOOKS_.length+' looks to fall back through');
ok(SHEET_FIT_<1,'and a sheet may only fill '+Math.round(SHEET_FIT_*100)+
   '% of the page: the height is worked out, not measured');

console.log('\nan ordinary tour: one visitor, two guides, their own class');
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue(['2026-10-06','Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
commitTour('2026-10-06',true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true},
   {visitor:'Sam Visitor',to:'Camille Bedeau',add:true}],[]);
clearReadCache_();
let pages=fits('a Tuesday tour','2026-10-06');
ok(pages.length===2,'a sheet each: '+pages.length);
ok(pages[0].filter(o=>o.ls===2).length>0,
   'and it is still double spaced, because it fits that way');

console.log('\nthe same tour with the family handed to somebody else');
{
  const away=planTour('2026-10-06',true).pairs[0].classOptions
    .filter(o=>!o.own)[0].name;
  commitTour('2026-10-06',true,[],[],[{visitor:'Sam Visitor',to:away}]);
  clearReadCache_();
  pages=fits('with a pass off','2026-10-06');
  const said=pages[0].map(o=>String(o.t||''));
  ok(said.some(t=>/^Hand Sam Visitor to /.test(t.replace(/^\S+\s+\S+\s+/,''))||
     /Hand Sam Visitor to /.test(t)),
     'the hand-off is one short line: "'+
     said.filter(t=>/Hand Sam Visitor/.test(t))[0]+'"');
  ok(said.some(t=>/Give them the route, the clock and YOUR NAME TAG\. Back to class, you are finished\./.test(t)),
     'and so is what the guide does next: "'+
     said.filter(t=>/YOUR NAME TAG/.test(t))[0]+'"');
  ok(said.some(t=>/wait with them for Maren\.$/.test(t)),
     'and the end of it: "'+said.filter(t=>/wait with them for/.test(t))[0]+'"');
  ok(said.every(t=>!/wait there with them until/.test(t)),
     'none of the old longer wording is left');
}

console.log('\nthe heaviest sheet there is');
{
  /* Two children going round together, a class visit each, long names
   * and a long school: everything that makes a sheet spill, at once. */
  const long=['Alexandra Fitzwilliam-Harrow','Bartholomew Vandermolen'];
  long.forEach((n,i)=>['Tour Date','Name','School','Grade','Gender','Race',
    'Borough','Class Visit']
    .forEach((h,k)=>m.sheets[P].getRange(4+i,col_(P,h)+1)
      .setValue(['2026-10-06',n,'Public School 41 Greenwich Village','5','Female',
        'WP','M',classVisitOptions_()[1+i]][k])));
  m.sheets[P].getRange(5,col_(P,'Tour With')+1).setValue(long[0]);
  Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
  clearReadCache_();
  const free=planTour('2026-10-06',true).spare
    .filter(c=>c.jobs[JOBS.GUIDE]&&!c.busy).slice(0,2).map(c=>c.name);
  commitTour('2026-10-06',true,[],
    free.map(n=>({visitor:long[0],to:n,add:true})),[]);
  clearReadCache_();
  pages=fits('two children on one route, with a class visit each','2026-10-06');
  const theirs=pages.filter(pg=>pg.some(o=>/Fitzwilliam/.test(String(o.t||''))));
  ok(theirs.length>0,theirs.length+' sheet(s) carry the pair');
  ok(theirs.every(pg=>pg.some(o=>/go round together/.test(String(o.t||'')))),
     'each saying the two of them go round together');
  ok(theirs.some(pg=>pg.some(o=>o.ls&&o.ls<2)),
     'and this one closed up to fit rather than running onto a second page');
  ok(theirs.every(pg=>pg.every(o=>!o.size||o.size>=10)),
     'nothing smaller than 10 point, whatever it takes to fit');
}

console.log('\nand every day of the week, every sheet');
SCHEDULE_DAYS_.forEach((day,i)=>{
  const date=dateKey_(toDate_(nextWeekday_(day)));
  ['Tour Date','Name','School','Grade','Gender','Race','Borough']
    .forEach((h,k)=>m.sheets[P].getRange(6,col_(P,h)+1)
      .setValue([date,'Robin Visitor','PS 3','6','Male','BL','B'][k]));
  Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
  clearReadCache_();
  const free=planTour(date,true).spare
    .filter(c=>c.jobs[JOBS.GUIDE]&&!c.busy).slice(0,2).map(c=>c.name);
  commitTour(date,true,[],
    free.map(n=>({visitor:'Robin Visitor',to:n,add:true})),[]);
  clearReadCache_();
  const pg=pagesOf(date);
  const mg=pageMargin();
  const room=SHEET_PAPER_.height-mg.top-mg.bottom;
  const worst=Math.max.apply(null,pg.map(x=>heightOf(x,mg)));
  ok(worst<=room,day+': '+pg.length+' sheet(s), the fullest '+
     Math.round(worst)+'pt of '+room+'pt');
});

console.log('\nevery guide walks off with one sheet, and the whole of it.');
