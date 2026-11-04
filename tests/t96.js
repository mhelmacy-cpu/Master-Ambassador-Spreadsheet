// She has a tour on a Tuesday. There is a button for the day, and the
// routes are Tuesday's: the classes the guides walk past are the ones
// the bell schedule has on while they are walking, in her own order -
// bottom up from the lobby, or top down from the third floor - and the
// class a visitor is taken into at the end is that Tuesday's class.
// Wednesday's seven routes are hers and are never written over.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const A=SHEETS.AMBASSADORS,P=SHEETS.PROSPECTIVE,R=SHEETS.ROUTES,sh=m.sheets[A];
const by={}; MS_ROSTER_.forEach(s=>by[s.name.toLowerCase()]=s);
rows_(A).forEach((r,i)=>{const n=(trim_(r[0])+' '+trim_(r[1])).trim(),s=by[n.toLowerCase()];
 const set=(h,v)=>sh.getRange(i+2,col_(A,h)+1).setValue(v); set('Active','Yes');
 if(!s)return; set('Homeroom',s.pod);set('Split',s.grade+s.split);set('Grade',s.grade+'th');
 set('Advisor',s.advisor);set('Gender',i%2?'Male':'Female');set('Student Email',s.email);});
// A Tuesday, the day she has the tour on. The Wednesday after it is the
// one every other test uses, and is here to be left alone.
const TUE='2026-10-06', WED='2026-10-07';
['Tour Date','Name','School','Grade','Gender','Race','Borough']
  .forEach((h,k)=>m.sheets[P].getRange(2,col_(P,h)+1)
    .setValue([TUE,'Sam Visitor','PS 41','6','Female','WP','M'][k]));
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const tue=toDate_(TUE), wed=toDate_(WED);
ok(WEEKDAYS_[tue.getDay()]==='Tuesday',TUE+' is a Tuesday');

console.log('her sheet, as setup leaves it');
const dayOf=no=>rows_(R).filter(r=>trim_(r[col_(R,'Route')])===no)
  .map(r=>trim_(r[col_(R,'Day')]));
ok(optionalCol_(R,'Day')!==-1,'the Tour Routes sheet has a Day column');
ok(rows_(R).length===7,'with her seven routes on it');
ok(rows_(R).every(r=>trim_(r[col_(R,'Day')])==='Wednesday'),
   'every one of them marked Wednesday, which is what they are');
const itinOf=(no,day)=>rows_(R).filter(r=>trim_(r[col_(R,'Route')])===no&&
  trim_(r[col_(R,'Day')])===day).map(r=>String(r[col_(R,'Itinerary')]))[0]||'';
const wedWas=TOUR_ROUTES_.map(r=>itinOf(r.route,'Wednesday'));
ok(wedWas.every((t,i)=>t===TOUR_ROUTES_[i].itinerary),
   'holding, word for word, the itineraries she has always had');
ok(routesForDay_('Tuesday').numbers.length===0,'and nothing for a Tuesday yet');

console.log('\nstaffing the Tuesday tour writes that day\'s routes');
commitTour(TUE,true,[],[{visitor:'Sam Visitor',to:'Blake Glenn',add:true}],[]);
clearReadCache_();
const tues=routesForDay_('Tuesday');
ok(tues.numbers.length===7,'seven routes for Tuesday: '+tues.numbers.join(', '));
ok(routesForDay_('Wednesday').numbers.length===7,'and Wednesday still has its seven');
ok(TOUR_ROUTES_.every((r,i)=>itinOf(r.route,'Wednesday')===wedWas[i]),
   'not one word of hers changed on them');

console.log('\nand they are Tuesday\'s classes, not Wednesday\'s');
const all=tues.numbers.map(n=>tues.byNumber[n].itinerary);
const some=re=>all.filter(t=>re.test(t)).length;
// Tuesday at a quarter to nine: 7th grade Humanities in M107 and M108,
// the science lab, 8th grade Math, 6th grade Science, Music, Choices,
// and 5th grade Math. Art is a Wednesday class and is not on.
ok(some(/7th Grade Humanities - Elizabeth \(M107\)/)>0 &&
   some(/7th Grade Humanities - Sabrina \(M108\)/)>0,
   'both Humanities rooms are visited, one route each');
ok(all.every(t=>!(/M107/.test(t)&&/M108/.test(t))),
   'and no route goes to both: it is one class, in two rooms');
ok(all.every(t=>/Main Science Lab \(M307\) - talk about robotics/.test(t)),
   'the science lab is on every route, as it is on at that hour');
ok(all.every(t=>/8th Grade Math \(M308\)/.test(t)),'8th grade Math as well');
ok(all.every(t=>/6th Grade Music \(M103\)/.test(t)),'6th grade Music, which Wednesday has not');
ok(all.every(t=>/5th Grade Math \(M311\)/.test(t)),'and 5th grade Math in M311');
ok(all.every(t=>!/M306/.test(t)),'and nothing about Art: Art is not on at that hour on a Tuesday');
ok(all.every(t=>!/TSAC|Charlton/.test(t)),'PE in the gym is not a stop either');
ok(all.every(t=>/Library/.test(t)&&/Sports Bulletin Board/.test(t)&&
   /Learning Center/.test(t)),'the library, the board and the Learning Center are on each one');

console.log('\nbottom up and top down, by the room numbers');
const floorsOf=txt=>txt.split('\n').map(l=>{
  const r=/\bM(\d)\d\d\b/.exec(l);
  if(r) return Number(r[1]);
  if(/Library|Sports Bulletin Board/.test(l)) return 0;
  return null; }).filter(f=>f!==null);
const up=tues.byNumber['1'], down=tues.byNumber['2'];
ok(up.direction==='Bottom-Up'&&down.direction==='Top-Down',
   'route 1 is '+up.direction+' and route 2 is '+down.direction);
const climbs=floorsOf(up.itinerary), drops=floorsOf(down.itinerary);
ok(climbs.every((f,i)=>i===0||f>=climbs[i-1]),
   'route 1 only ever goes up: '+climbs.join(' '));
ok(drops.every((f,i)=>i===0||f<=drops[i-1]),
   'route 2 only ever comes down: '+drops.join(' '));
ok(climbs[0]===0&&drops[drops.length-1]===0,
   'one starts on the lobby floor and the other finishes there');
ok(tues.numbers.map(n=>tues.byNumber[n].direction)
   .join(',')==='Bottom-Up,Top-Down,Bottom-Up,Top-Down,Bottom-Up,Top-Down,Bottom-Up',
   'and they alternate all the way down the seven');

console.log('\nthe times run from the cafeteria to the class visit');
ok(all.every(t=>/^8:30 Leave cafeteria to start tour$/m.test(t)),
   'each one leaves the cafeteria at 8:30');
ok(all.every(t=>/^9:06 Bring visitors to class/m.test(t)),'hands over at 9:06');
ok(all.every(t=>/^9:25 Bring visitor down to the co-lab/m.test(t)),
   'and ends in the co-lab at 9:25');
ok(all.every(t=>{
  const mins=t.split('\n').map(l=>toMinutes_((/^(\d{1,2}:\d{2})/.exec(l)||[])[1]||''));
  return mins.every((x,i)=>x!==null&&(i===0||x>=mins[i-1])); }),
   'and every line is later than the one before it');

console.log('\nthe tour itself is on a Tuesday route');
const routeNo=trim_(readCell_(P,2,'Route'));
ok(tues.numbers.indexOf(routeNo)!==-1,'Sam Visitor is on route '+routeNo+', a Tuesday route');
global.__doc=[];
const made=buildRouteSheets(TUE);
const printed=global.__doc.map(o=>String(o.t||''));
ok(made.pages>0,made.pages+' route sheet page(s) printed');
ok(printed.some(t=>/M307|M308|M311|M103/.test(t)),
   'with Tuesday\'s rooms on the walk: "'+
   printed.filter(t=>/M30|M31|M10/.test(t))[0]+'"');
ok(printed.every(t=>!/M306/.test(t)),'and not a Wednesday one');

console.log('\nthe class visit is that Tuesday\'s class');
const amb=ambassadors_().filter(a=>a.name==='Blake Glenn')[0];
const visitFrom=toMinutes_(setting_('Class Visit Handoff Time','9:06'));
const visitTo=toMinutes_(setting_('Tour End Time','9:25'));
const onTue=classesMissed_(amb.pod,amb.split,amb.grade,tue,visitFrom,visitTo);
const onWed=classesMissed_(amb.pod,amb.split,amb.grade,wed,visitFrom,visitTo);
ok(onTue.length>0,'Blake Glenn is in '+onTue.map(c=>c.what).join(' and ')+' on the Tuesday');
ok(onWed.length>0,'and in '+onWed.map(c=>c.what).join(' and ')+' on the Wednesday');
ok(onTue.map(c=>c.what).join('|')!==onWed.map(c=>c.what).join('|'),
   'which is not the same class, so the day is being read');
// And it is the class the route sheet names at the end of the walk.
ok(printed.some(t=>/Science in M307/.test(t)),
   'the sheet takes Sam Visitor into it: "'+
   printed.filter(t=>/Science in M307/.test(t))[0]+'"');
ok(printed.every(t=>!/Humanities in M10[78]/.test(t)),
   'and not into the class that guide would have been in on the Wednesday');

console.log('\nan itinerary she has typed herself is hers');
const rowOfRoute=(no,day)=>rows_(R).findIndex(r=>trim_(r[col_(R,'Route')])===no&&
  trim_(r[col_(R,'Day')])===day)+2;
m.sheets[R].getRange(rowOfRoute('1','Tuesday'),col_(R,'Itinerary')+1)
  .setValue('8:30 Leave cafeteria to start tour\n8:40 My own stop\n'+
    '9:06 Bring visitors to class - Bring the clock and tour route with you to class.');
clearReadCache_();
planTour(TUE,true);
clearReadCache_();
ok(/My own stop/.test(routesForDay_('Tuesday').byNumber['1'].itinerary),
   'her stop is still there after another run');
ok(rows_(R).length===14,'and no routes were added a second time');

console.log('\nthe other days, and the day buttons');
['Monday','Thursday','Friday'].forEach(d=>{
  const said=ensureDayRoutes_(d);
  clearReadCache_();
  ok(routesForDay_(d).numbers.length===7,'seven routes for '+d);
  ok(said.length===1,'  said: '+said[0]);
});
// Monday morning is the whole school in its meeting, so there is no
// class to walk past and the routes say so rather than looking broken.
ok(ensureDayRoutes_('Monday').length===0,
   'a day that has its routes is left alone the next time');
const mon=routesForDay_('Monday');
ok(mon.numbers.length===7&&mon.byNumber['1'].itinerary.indexOf('Library')!==-1,
   'Monday walks the library and the board: no class is on at 8:45 that day');
ok(WEEKDAYS_[toDate_(nextWeekday_('Tuesday')).getDay()]==='Tuesday',
   'the Tuesday button opens on a Tuesday: '+nextWeekday_('Tuesday'));
ok(WEEKDAYS_[toDate_(nextWeekday_('Friday')).getDay()]==='Friday',
   'and the Friday button on a Friday: '+nextWeekday_('Friday'));
global.__dialogs.length=0;
staffTuesday();
ok(global.__dialogs.length===1,'it opens the staffing dialog');
ok(new RegExp('value="'+nextWeekday_('Tuesday')+'"')
   .test(String(global.__dialogs[0].html||'')),
   'with that Tuesday in the date box');
ok(/Staff a Tour/.test(String(global.__dialogs[0].title||'')),
   'titled "'+global.__dialogs[0].title+'", not Wednesday\'s');

console.log('\na tour on a Tuesday walks Tuesday.');
