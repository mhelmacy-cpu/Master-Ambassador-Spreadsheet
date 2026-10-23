// The Co-Lab is not a stop on the walk any more. The tour still ends
// there: the family is taken to the co-lab at 9:25 and left with Maren.
// The itinerary lives on her own Tour Routes sheet and is seeded once,
// so the stop is taken off that sheet by setup rather than only in the
// script, and it cannot come back.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,R=SHEETS.ROUTES,sh=m.sheets[A];
const ic=col_(R,'Itinerary');
const isStop=line=>/^\s*\d{1,2}:\d{2}\s*-?\s*co-?\s?lab\b\s*$/i.test(line);

console.log('the routes the script seeds');
ok(TOUR_ROUTES_.length===7,TOUR_ROUTES_.length+' routes');
ok(TOUR_ROUTES_.every(r=>!r.itinerary.split('\n').some(isStop)),
   'not one of them stops at the Co-Lab');
ok(rows_(R).every(r=>!String(r[ic]).split('\n').some(isStop)),
   'nor does the Tour Routes sheet they are written to');
ok(TOUR_ROUTES_.every(r=>/9:25 Bring visitor down to the co-lab/.test(r.itinerary)),
   'and every one of them still ends in the co-lab');
ok(TOUR_ROUTES_.every(r=>/^8:30 Leave cafeteria to start tour/.test(r.itinerary)),
   'and still starts in the cafeteria');

console.log('\nher own sheet, which the script seeded once and never rewrites');
// The itinerary she has, Co-Lab and all, with the old ending on it.
const old='8:30 Leave cafeteria to start tour\n8:32 Library\n8:38 Co-Lab\n' +
  '8:42 7th Grade Humanities - Elizabeth (M107)\n' +
  '9:06 Bring visitors to class - Bring the clock and tour route with you to class.\n' +
  '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents)';
m.sheets[R].getRange(2,ic+1).setValue(old);
// and one she has edited herself, to be sure only the one line goes
m.sheets[R].getRange(3,ic+1).setValue('8:30 Leave cafeteria to start tour\n' +
  '8:36 Co-Lab\n8:40 My own note about the Co-Lab, which is not a stop\n' +
  '9:25 Bring visitor down to the co-lab (and wait)');
clearReadCache_();
const said=refreshRouteStops_();
clearReadCache_();
ok(said.some(x=>/Co-Lab stop came off route 1/.test(x)),
   'setup says what it did: '+said.join('; '));
const one=String(rows_(R)[0][ic]).split('\n');
ok(!one.some(isStop),'the stop is off route 1');
ok(one.indexOf('8:32 Library')!==-1 && one.indexOf('8:42 7th Grade Humanities - Elizabeth (M107)')!==-1,
   'and every other stop is exactly as it was');
ok(/9:25 Bring visitor down to the co-lab/.test(one[one.length-1]),
   'with the end of the morning in the co-lab: "'+one[one.length-1]+'"');
const two=String(rows_(R)[1][ic]).split('\n');
ok(!two.some(isStop),'the stop is off route 2 as well');
ok(two.some(x=>/My own note about the Co-Lab/.test(x)),
   'and a line she wrote herself is left alone: "'+
   two.filter(x=>/My own note/.test(x))[0]+'"');
ok(refreshRouteStops_().length===0,'running setup again has nothing to do');

console.log('\nand the printed route sheet reads the same way');
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
commitTour('2026-10-07',true,[],
  [{visitor:'Sam Visitor',to:'Blake Glenn',add:true}],[]);
clearReadCache_();
global.__doc=[];
buildRouteSheets('2026-10-07');
const lines=global.__doc.map(o=>String(o.t||''));
ok(!lines.some(isStop),'no Co-Lab stop on the walk');
ok(lines.some(t=>/At 9:25 AM take them to the co-lab/i.test(t)),
   'and the end still says: "'+
   (lines.filter(t=>/co-lab/i.test(t))[0]||'').slice(0,80)+'"');

console.log('\nthe co-lab is where they finish, not somewhere they pass.');
