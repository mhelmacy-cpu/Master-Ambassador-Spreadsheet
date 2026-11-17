// The scheduling email: her letter to a family whose application has come
// through. Its own Applicants sheet, which she types: not Prospective
// Students, who are the families coming on a tour and not the same people. One per family, the parents addressed by the name she typed and
// the child named from the sheet. A test copy comes to her and marks
// nobody; a real send stamps the date against each family it wrote to.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const P=SHEETS.APPLICANTS, sh=m.sheets[P];
const put=(row,h,v)=>sh.getRange(row,col_(P,h)+1).setValue(v);

// Three families: one ready, one already written to, one with no address.
put(2,'Student Name','Sam Rivera');      put(2,'Parent Name','Jo Rivera');
                                  put(2,'Parent Email','jo@example.com');
put(3,'Student Name','Twombly, Cy');     put(3,'Parent Name','Pat Twombly');
                                  put(3,'Parent Email','pat@example.com');
                                  put(3,'Scheduling Email Sent','2026-11-01');
put(4,'Student Name','Robin Chen');      put(4,'Parent Name','Lee Chen');
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();

const fams=api_schedulingFamilies().families;
ok(fams.length===3,'all three families are listed, gaps and all');
ok(fams[0].ready&&!fams[0].sent,'the ready one is ready and unwritten');
ok(fams[1].sent==='2026-11-01','the one already written to says when');
ok(!fams[2].ready&&/no parent email/.test(fams[2].missing),'the one with no address says so');

// "Twombly, Cy" is Cy, not Twombly.
ok(api_schedulingPreview('3','5-8').text.indexOf("Cy's application")!==-1,
  'a name typed last-first still reads as the first name');

const one=api_schedulingPreview('2','5-8');
ok(one.subject==='LREI Scheduling: Parent Interview and Student Assessment','the subject is hers');
ok(one.text.indexOf('Dear Jo Rivera,')===0,'it opens to the parent by name');
ok(one.text.indexOf("Sam's application has been received")!==-1,'it names the child');
ok(one.text.indexOf('212-477-5316 x298')!==-1,'her number is in it');
ok(one.text.indexOf('ms-admissions@lrei.org')!==-1,'the admissions address is in it');
ok(/Monday-Friday between the hours of 9:30AM-4:30PM/.test(one.text),'her hours are in it');
ok(one.text.trim().slice(-5)==='Maren','it signs off as her');
ok(one.text.indexOf('{parent}')===-1&&one.text.indexOf('{student}')===-1,'no blanks left in it');
ok(!/[\u2013\u2014]/.test(one.text),'not a dash in it that is not a hyphen');

// A test send: to her, marked, and nobody on the sheet touched.
global.__sent.length=0;
const t=api_sendScheduling(['2'],true,false,'5-8');
ok(global.__sent.length===1,'a test sends one letter');
ok(/^\[TEST - scheduling\]/.test(global.__sent[0].subject),'it is marked as a test');
ok(global.__sent[0].to!=='jo@example.com','it does not go to the parent');
ok(global.__sent[0].htmlBody.indexOf('jo@example.com')!==-1,'it says who it would have gone to');
clearReadCache_();
ok(!trim_(api_schedulingFamilies().families[0].sent),'a test marks nobody as written to');

// The real thing: to the parent, and stamped.
global.__sent.length=0;
const r=api_sendScheduling(['2'],false,false,'5-8');
ok(r.sent===1&&!r.test,'a real send reports one letter');
ok(global.__sent[0].to==='jo@example.com','it goes to the parent');
ok(global.__sent[0].subject.indexOf('[TEST')===-1,'it is not marked as a test');
ok(global.__sent[0].htmlBody.indexOf('Dear Jo Rivera,')!==-1,'the letter is in the body');
ok(global.__sent[0].htmlBody.indexOf('<br>')!==-1,'her line breaks survive into the mail');
clearReadCache_();
ok(trim_(api_schedulingFamilies().families[0].sent)!=='','it is stamped as written to');

// A family with a gap is refused by name rather than half-sent.
let threw='';
try { api_sendScheduling(['4'],false,false,'5-8'); } catch(e){ threw=e.message; }
ok(/Robin Chen/.test(threw)&&/no parent email/.test(threw),
  'a family with no address is refused, by name and reason');

// Her own wording wins over the one in the file.
m.sheets[SHEETS.SETTINGS].getRange(2,1,1,2).setValues([['Scheduling Email Body: 5-8','Hi {parent}, about {student}.']]);
clearReadCache_();
ok(api_schedulingPreview('2','5-8').text==='Hi Jo Rivera, about Sam.','a Settings row replaces the letter');

// The two lists are not the same people. A family on a tour is not an
// applicant, and nothing about a tour reads the parents' addresses.
clearReadCache_();
const PR=SHEETS.PROSPECTIVE;
ok(optionalCol_(PR,'Parent Email')===-1,'Prospective Students has no parent address on it');
ok(optionalCol_(PR,'Scheduling Email Sent')===-1,'nor anything about a scheduling email');
m.sheets[PR].getRange(2,col_(PR,'Name')+1).setValue('Someone On A Tour');
clearReadCache_();
ok(!api_schedulingFamilies().families.some(f=>f.student==='Someone On A Tour'),
  'somebody booked on a tour is not written to about an application');
ok(api_schedulingFamilies().families.length===3,'the letter list is still only the applicants');

console.log('t103 ok');
