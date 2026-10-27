// Every dialog's own script, parsed.
//
// The dialogs are built as single-quoted strings inside App.gs, so a
// stray \" or an unbalanced quote does not break the paste or the build:
// it breaks that one dialog, silently, in her hands. This opens every
// one of them, pulls out the <script> and parses it, which is the check
// that would have caught each of those by itself.
//
// It also guards the inline-handler trap: an onclick name that is also a
// property of document or window (all, forms, name, length) resolves to
// that instead of to the function, and the button does nothing.
const fs=require('fs'); const {makeMock}=require(__dirname+'/mock.js');
const m=makeMock();
const G=s=>s.replace(/^(?:const|var|let)\s+(\w+)\s*=/gm,'global.$1 =').replace(/^function\s+(\w+)\s*\(/gm,'global.$1 = function $1(');
eval(G(fs.readFileSync('build/Data.gs','utf8')));
eval(G(fs.readFileSync('build/App.gs','utf8')));
const ok=(c,msg)=>{ if(!c) throw new Error('FAIL: '+msg); console.log('  ok: '+msg); };

setupSpreadsheet();
const src=fs.readFileSync('build/App.gs','utf8');
const names=(src.match(/^function (show\w*Dialog)\(/gm)||[])
  .map(s=>s.replace(/^function /,'').replace(/\($/,''));
ok(names.length>5,names.length+' dialogs: '+names.join(', '));

/* Names that are already something on document or window. An inline
 * onclick is resolved against the element, then the form, then document,
 * then window, so a handler called all() never runs: document.all wins. */
const taken=['all','forms','name','length','open','close','location','title',
  'status','print','focus','blur','find','scroll','top','self','parent'];

let withScript=0;
names.forEach(n=>{
  global.__dialogs.length=0;
  try { global[n](); } catch (err) {
    throw new Error('FAIL: '+n+' threw before it could be drawn: '+err.message);
  }
  ok(global.__dialogs.length>0,n+' opens a dialog');
  const html=String(global.__dialogs[0].html||'');
  const js=(html.match(/<script>([\s\S]*?)<\\?\/script>/)||[])[1];
  if(!js){ console.log('  ok: '+n+' has no script of its own'); return; }
  withScript++;
  try { new Function('document','window','google',js); } catch (err) {
    throw new Error('FAIL: '+n+' script does not parse: '+err.message);
  }
  console.log('  ok: '+n+' script parses ('+js.length+' chars)');
  // Every inline handler in the HTML must be a function the script
  // defines, and must not be a name the browser has already taken.
  const calls=(html.match(/on(?:click|change|input)=['"]?([a-zA-Z_$][\w$]*)\(/g)||[])
    .map(s=>s.replace(/^on\w+=['"]?/,'').replace(/\($/,''));
  const uniq=calls.filter((c,i)=>calls.indexOf(c)===i);
  uniq.forEach(c=>{
    if(taken.indexOf(c)!==-1){
      throw new Error('FAIL: '+n+' has an onclick called '+c+
        ', which is already a property of document or window');
    }
    if(!new RegExp('function '+c+'\\s*\\(').test(js)){
      throw new Error('FAIL: '+n+' calls '+c+'() but its script does not define it');
    }
  });
  if(uniq.length) console.log('     and its '+uniq.length+
    ' inline handler(s) are all defined: '+uniq.join(', '));
  // A double-quoted string inside one of these single-quoted .gs strings
  // is how a dialog script was broken before.
  ok(js.indexOf('\\"')===-1,'     no escaped double quote in '+n);
});
ok(withScript>=5,withScript+' of them carry a script');

console.log('\nevery dialog parses.');
