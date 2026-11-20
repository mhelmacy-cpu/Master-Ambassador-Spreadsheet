// A child can have two parents, and the letter goes to both of them: both
// names in the greeting, both addresses on the message. One parent still
// works, either of the two slots does on its own, and a sheet set up
// before there was a second parent is not made to retype the first.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const P=SHEETS.APPLICANTS, sh=m.sheets[P];
const put=(r,h,v)=>sh.getRange(r,col_(P,h)+1).setValue(v);

// Two parents, one parent, and a second parent with no address of their own.
put(2,'Student Name','Sam Rivera'); put(2,'Grade','6');
put(2,'Parent 1 Name','Jo Rivera');   put(2,'Parent 1 Email','jo@example.com');
put(2,'Parent 2 Name','Alex Rivera'); put(2,'Parent 2 Email','alex@example.com');

put(3,'Student Name','Robin Chen'); put(3,'Grade','7');
put(3,'Parent 1 Name','Lee Chen');  put(3,'Parent 1 Email','lee@example.com');

put(4,'Student Name','Cy Twombly'); put(4,'Grade','8');
put(4,'Parent 1 Name','Pat Twombly'); put(4,'Parent 1 Email','pat@example.com');
put(4,'Parent 2 Name','Sal Twombly');

// Only the second slot filled, which is a typo she should not be punished for.
put(5,'Student Name','Max Fell'); put(5,'Grade','5');
put(5,'Parent 2 Name','Nic Fell'); put(5,'Parent 2 Email','nic@example.com');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();

const by={}; api_schedulingFamilies().families.forEach(f=>by[f.student]=f);
ok(by['Sam Rivera'].email==='jo@example.com, alex@example.com','both addresses are listed');
ok(by['Robin Chen'].email==='lee@example.com','one parent is still just the one address');
ok(by['Cy Twombly'].email==='pat@example.com','a second parent with no address adds none');
ok(by['Max Fell'].ready,'only the second slot filled is still ready to write to');

const two=api_schedulingPreview('2','5-8').text;
ok(two.indexOf('Dear Jo Rivera and Alex Rivera,')===0,'both parents are greeted');
ok(api_schedulingPreview('3','5-8').text.indexOf('Dear Lee Chen,')===0,'one parent is greeted alone');
ok(api_schedulingPreview('4','5-8').text.indexOf('Dear Pat Twombly and Sal Twombly,')===0,
  'a parent with no address is still greeted');
ok(two.indexOf("Sam's application")!==-1,'the child is still named once');

// The message really goes to both.
global.__sent.length=0;
api_sendScheduling(['2'],false,false,'5-8');
ok(global.__sent.length===1,'two parents are one letter, not two');
ok(global.__sent[0].to==='jo@example.com,alex@example.com','addressed to both');
global.__sent.length=0;
api_sendScheduling(['3'],false,false,'5-8');
ok(global.__sent[0].to==='lee@example.com','one parent, one address, no stray comma');

// A draft to two parents carries both as well.
global.__drafts.length=0;
api_sendScheduling(['2'],false,true,'5-8');
ok(global.__drafts[0].to==='jo@example.com,alex@example.com','a draft is addressed to both too');

// A sheet set up before the second parent existed still reads.
const old=h=>sh.getRange(1,col_(P,h)+1);
old('Parent 1 Name').setValue('Parent Name');
old('Parent 1 Email').setValue('Parent Email');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();
const was={}; api_schedulingFamilies().families.forEach(f=>was[f.student]=f);
ok(was['Robin Chen'].email==='lee@example.com','the unnumbered column is still read');
ok(was['Sam Rivera'].email==='jo@example.com, alex@example.com',
  'and still alongside a second parent');

console.log('t105 ok');
