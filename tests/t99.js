// The menu at the top of the spreadsheet. It is the only way she reaches
// any of this, and when it does not appear there is nothing to click and
// no error either: Apps Script simply draws no menu. So onOpen is run
// here, the menu it builds is read back, and every item is checked
// against the function it says it runs.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

console.log('the menu is drawn, before anything else is run');
// Deliberately no setupSpreadsheet() first: the menu has to appear on a
// sheet that has never been set up, which is how she sees it the first
// time. Anything that throws here leaves her with no menu at all.
global.__menus.length=0;
onOpen();
const top=global.__menus.filter(x=>x.added);
ok(top.length===1,'one menu goes on the spreadsheet');
const menu=top[0];
ok(!!trim_(menu.title),'it has a name: "'+menu.title+'"');
ok(menu.title==='Middle School Tours',
   'which is the name the paste kit tells her to look for');

console.log('\nwhat is on it');
const labels=menu.items.map(i=>i.label);
ok(labels[0]==='First-Time Setup','it starts with "'+labels[0]+'"');
ok(labels.indexOf('Staff a Tour...')!==-1,'and has "Staff a Tour..." on it');
[['Print Tour Routes...','the route sheets'],
 ['Print Locker Slips...','the locker slips'],
 ['Print the Tour Roster...','the roster'],
 ['Change Who Is Working...','a change after it is saved'],
 ['Send Emails Now...','the real send'],
 ['Test Emails...','the test send'],
 ['Check This Script...','the check']]
  .forEach(([label,what])=>ok(labels.indexOf(label)!==-1,what+': "'+label+'"'));
ok(menu.items.length>=12,menu.items.length+' items in all');

console.log('\nthe day buttons, in a submenu of their own');
const subs={}; global.__menus.forEach(x=>{ if(!x.added) subs[x.title]=x; });
ok(!!subs['Staff a Tour On'],'there is a "Staff a Tour On" submenu');
ok(subs['Staff a Tour On'].items.map(i=>i.label).join(', ')===
   'Monday, Tuesday, Wednesday, Thursday, Friday',
   'with the five school days on it: '+
   subs['Staff a Tour On'].items.map(i=>i.label).join(', '));
ok(!!subs['Automation'],'and the Automation submenu is still there');
ok(subs['Automation'].items.length===2,
   'with its two: '+subs['Automation'].items.map(i=>i.label).join(', '));
ok(menu.subs.length===2,'both of them hang off the one menu');

console.log('\nevery item runs a function that exists');
const all=[menu].concat(Object.keys(subs).map(k=>subs[k]));
let checked=0;
all.forEach(mu=>mu.items.forEach(it=>{
  ok(typeof global[it.fn]==='function',
     '"'+it.label+'" runs '+it.fn+'()');
  checked++;
}));
ok(checked>=20,checked+' items checked, none of them wired to nothing');

console.log('\nand a day button opens the staffing dialog on that day');
{
  setupSpreadsheet();
  global.__dialogs.length=0;
  staffTuesday();
  ok(global.__dialogs.length===1,'the Tuesday button opens a dialog');
  ok(String(global.__dialogs[0].title||'').indexOf('Staff')===0,
     'titled "'+global.__dialogs[0].title+'"');
}

console.log('\nthe menu is there, and everything on it goes somewhere.');
