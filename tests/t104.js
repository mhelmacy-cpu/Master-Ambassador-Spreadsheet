// Three divisions, one letter. The words are the same everywhere; only
// the admissions address and the name of the appointment move, so a
// change to the wording cannot reach two divisions and miss the third.
// The youngest two sit a playgroup, not an assessment.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const P=SHEETS.APPLICANTS, sh=m.sheets[P];
const put=(r,h,v)=>sh.getRange(r,col_(P,h)+1).setValue(v);
[[2,'Sam Rivera','6'],[3,'Robin Chen','3'],[4,'Cy Twombly','K'],[5,'Pat Lee','Pre-K'],
 [6,'Nobody Yet','']].forEach(([r,n,g])=>{
  put(r,'Student Name',n); put(r,'Grade',g);
  put(r,'Parent 1 Name','Parent of '+n); put(r,'Parent 1 Email','p'+r+'@example.com');});
Object.keys(HEADER_CACHE_).forEach(k=>delete HEADER_CACHE_[k]);
clearReadCache_();

// Every division is offered, each with the grades it covers.
const d=api_schedulingFamilies();
ok(d.letters.length===3,'three divisions are offered');
ok(d.letters.map(l=>l.key).join(',')==='5-8,1-4,K/Pre-K','5-8, 1-4 and K/Pre-K');

// The grade each family is in, K and Pre-K included.
const by={}; d.families.forEach(f=>by[f.student]=f);
ok(by['Sam Rivera'].gradeNum==='6','6 reads as 6');
ok(by['Cy Twombly'].gradeNum==='0','K reads as 0');
ok(by['Pat Lee'].gradeNum==='-1','Pre-K reads as below K');
ok(by['Nobody Yet'].gradeNum==='','a blank grade reads as nothing, not as zero');

const ms=api_schedulingPreview('2','5-8').text;
const ls=api_schedulingPreview('3','1-4').text;
const kp=api_schedulingPreview('4','K/Pre-K').text;

ok(/ms-admissions@lrei\.org/.test(ms),'5-8 points at ms-admissions');
ok(/ls-admissions@lrei\.org/.test(ls),'1-4 points at ls-admissions');
ok(/ls-admissions@lrei\.org/.test(kp),'K/Pre-K points at ls-admissions too');
ok(!/ms-admissions/.test(ls)&&!/ms-admissions/.test(kp),'and neither of those at ms-admissions');

ok((ms.match(/student assessment/g)||[]).length===2,'5-8 says student assessment, twice');
ok((ls.match(/student assessment/g)||[]).length===2,'1-4 says it twice as well');
ok((kp.match(/student playgroup/g)||[]).length===2,'K/Pre-K says student playgroup instead');
ok(!/assessment/.test(kp),'and never says assessment');

// 1-4 and K/Pre-K differ by that one word and nothing else. Same family
// both times, or the child's name would differ and prove nothing.
const sameLs=api_schedulingPreview('3','1-4').text;
const sameKp=api_schedulingPreview('3','K/Pre-K').text;
ok(sameLs.split('student assessment').join('student playgroup')===sameKp,
  'K/Pre-K is the 1-4 letter with the one word changed, to the character');

// All three name the child and keep her hours.
[['5-8',ms],['1-4',ls],['K/Pre-K',kp]].forEach(([k,t])=>{
  ok(/Dear Parent of /.test(t),k+' opens to the parent by name');
  ok(/9:30AM-4:30PM/.test(t),k+' keeps her hours');
  ok(/212-477-5316 x298/.test(t),k+' keeps her number');
  ok(t.trim().slice(-5)==='Maren',k+' signs off as her');
  ok(t.indexOf('{')===-1,k+' has no blanks left in it');
  ok(!/[\u2013\u2014]/.test(t),k+' has not a dash in it that is not a hyphen');
});
ok(/Sam's application/.test(ms),'5-8 names the child');
ok(/Robin's application/.test(ls),'1-4 names the child');
ok(/Cy's application/.test(kp),'K/Pre-K names the child too');

// The subject follows the appointment.
ok(api_schedulingPreview('2','5-8').subject==='LREI Scheduling: Parent Interview and Student Assessment','5-8 subject');
ok(api_schedulingPreview('3','1-4').subject==='LREI Scheduling: Parent Interview and Student Assessment','1-4 subject');
ok(api_schedulingPreview('4','K/Pre-K').subject==='LREI Scheduling: Parent Interview and Student Playgroup','K/Pre-K subject');

// Drafts go to her Drafts, not out to a parent, and are marked as drafts.
global.__sent.length=0; global.__drafts.length=0;
const r=api_sendScheduling(['4','5'],false,true,'K/Pre-K');
ok(global.__sent.length===0,'a draft sends nothing');
ok(global.__drafts.length===2,'two drafts are written');
ok(global.__drafts[0].to==='p4@example.com','addressed to the parent');
ok(/Student Playgroup/.test(global.__drafts[0].subject),'with the playgroup subject');
ok(/Cy\'s application/.test(global.__drafts[0].htmlBody),'and the right child in it');
ok(r.drafts&&!r.test,'it reports itself as drafts');
clearReadCache_();
const after={}; api_schedulingFamilies().families.forEach(f=>after[f.student]=f);
ok(/^drafted /.test(after['Cy Twombly'].sent),'the sheet says drafted, not sent');
ok(/K\/Pre-K/.test(after['Cy Twombly'].sent),'and which letter they got');
ok(after['Sam Rivera'].sent==='','nobody outside the batch is marked');

console.log('t104 ok');
