// Monday routes she already has on her sheet, written by the script
// before it knew to name the classes that are usually in the rooms.
// Routes on her sheet are normally hers forever, but these are the
// script's own older words, so they are worked out again, in the rows
// they are already in. A row she has changed herself is not touched,
// and neither is anything on a Wednesday.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const R=SHEETS.ROUTES, sh=m.sheets[R];

// What the script used to write for a Monday: the rooms, with no class
// in any of them, and a first line that does not say why they are empty.
const OLD=['8:30 Leave cafeteria to start tour','8:32 Library',
 '8:35 Sports Bulletin Board (next to front desk, talk about sports)',
 '8:38 Humanities room (M107)','8:41 World Language room (M208)',
 '8:44 Art room (M306)','8:47 Main Science Lab (M307)',
 '8:50 Learning Center','8:53 Math room (M308)','8:56 Science room (M310)',
 '9:06 Bring visitors to MS Meeting - Bring the clock and tour route with you.',
 '9:25 Bring visitor down to the co-lab (wait with them for Maren and parents '+
   'to get back downstairs)'].join('\n');

const width=Math.max(sh.getLastColumn(),HEADERS[R].length);
const wedRows=rows_(R).length;
const first=wedRows+2;
const old=[];
for(let i=0;i<7;i++){
  const row=blankRow_(R);
  row[col_(R,'Route')]=String(i+1);
  row[col_(R,'Direction')]=i%2?'Top-Down':'Bottom-Up';
  row[col_(R,'Itinerary')]=OLD;
  row[col_(R,'Day')]='Monday';
  old.push(row);
}
sh.getRange(first,1,7,width).setValues(old);
clearReadCache_();
ok(routesForDay_('Monday').numbers.length===7,
   'seven Monday routes on her sheet already, in rows '+first+'-'+(first+6));

console.log('\nthe script knows its own older answer');
ok(staleQuietRoute_(OLD),'a room with no class in it is the script\'s, not hers');
ok(TOUR_ROUTES_.every(r=>!staleQuietRoute_(r.itinerary)
   ||!quietMorningAt_('Wednesday')),
   'and a Wednesday route is never worked out again: Wednesday is not a quiet morning');
ok(quietMorningAt_('Monday')==='MS Meeting',
   'Monday is one: the whole school is at "'+quietMorningAt_('Monday')+'"');

console.log('\nso they are worked out again where they sit');
const said=ensureDayRoutes_('Monday');
clearReadCache_();
ok(said.length===1&&/worked out again/.test(said[0]),'she is told: "'+said[0]+'"');
ok(rows_(R).length===wedRows+7,
   'no rows added: still '+rows_(R).length+' routes on the sheet');
const mine=routesForDay_('Monday');
ok(mine.numbers.length===7,'and seven Monday routes, the same seven');
const all=mine.numbers.map(n=>mine.byNumber[n].itinerary);
ok(all.every(t=>!/room \(M\d\d\d\)/.test(t)),'no stop is a room with nothing in it');
[[/7th Grade Humanities - \w+ \(M10[78]\)/,'a Humanities class with its teacher'],
 [/\(M20[789]\) - talk about world languages/,'a world language room'],
 [/Art \(M306\)/,'the art room'],[/8th Grade Math \(M308\)/,'8th grade Math'],
 [/6th Grade Science \(M310\)/,'6th grade Science'],
 [/Library/,'the library'],[/Learning Center/,'the Learning Center']]
  .forEach(([re,what])=>ok(all.every(t=>re.test(t)),'every route shows '+what));
ok(all.every(t=>/^8:30 Leave cafeteria to start tour - the whole school is at MS Meeting/m
   .test(t)),'and says why the rooms are quiet');
ok(all.every(t=>/^9:06 Bring visitors to MS Meeting/m.test(t))&&
   all.every(t=>/^9:25 Bring visitor down to the co-lab/m.test(t)),
   'with the end of the morning as it was');
ok(ensureDayRoutes_('Monday').length===0,
   'run again, it changes nothing: they are hers now');

console.log('\na Monday route she has edited herself stays hers');
{
  const keep='8:30 Leave cafeteria to start tour - the whole school is at MS Meeting '+
    'this morning, so the rooms are empty: tell them what happens in each one\n'+
    '8:40 My own stop\n9:06 Bring visitors to MS Meeting - Bring the clock and tour '+
    'route with you.';
  sh.getRange(first+2,col_(R,'Itinerary')+1).setValue(keep);
  sh.getRange(first+3,col_(R,'Itinerary')+1).setValue(OLD);
  clearReadCache_();
  const again=ensureDayRoutes_('Monday');
  clearReadCache_();
  ok(again.length===1&&/^1 tour route for Monday/.test(again[0]),
     'only the one the script wrote is done again: "'+again[0]+'"');
  const now=routesForDay_('Monday');
  ok(/My own stop/.test(now.byNumber['3'].itinerary),'route 3 is still hers');
  ok(/8th Grade Math \(M308\)/.test(now.byNumber['4'].itinerary),
     'and route 4 has its classes back');
}

console.log('\nWednesday is untouched by all of it');
{
  const wed=routesForDay_('Wednesday');
  ok(wed.numbers.length===TOUR_ROUTES_.length,
     wed.numbers.length+' Wednesday routes, as seeded');
  ok(wed.numbers.every(n=>wed.byNumber[n].itinerary===
     TOUR_ROUTES_.filter(r=>r.route===n)[0].itinerary),
     'every one of them word for word as she has it');
}

console.log('\nthe Monday routes she already had now name the classes.');
